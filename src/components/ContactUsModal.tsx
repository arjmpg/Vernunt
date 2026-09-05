import React, { useState } from 'react';
import { 
  X, 
  Mail, 
  Phone, 
  PhoneCall, 
  Headphones, 
  Clock, 
  MapPin, 
  CheckCircle2, 
  Copy, 
  Send, 
  ShieldCheck, 
  Sparkles, 
  Globe, 
  ExternalLink,
  MessageSquare,
  Building,
  HeartHandshake
} from 'lucide-react';

interface ContactUsModalProps {
  isOpen: boolean;
  onClose: () => void;
  onOpenVoiceSupport: (language?: string) => void;
}

export const ContactUsModal: React.FC<ContactUsModalProps> = ({
  isOpen,
  onClose,
  onOpenVoiceSupport
}) => {
  const [copiedEmail, setCopiedEmail] = useState(false);
  const [ticketCategory, setTicketCategory] = useState('playmates_kyc');
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [message, setMessage] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [ticketSubmitted, setTicketSubmitted] = useState<string | null>(null);

  if (!isOpen) return null;

  const handleCopyEmail = () => {
    navigator.clipboard.writeText('support@vernunt.com');
    setCopiedEmail(true);
    setTimeout(() => setCopiedEmail(false), 2500);
  };

  const handleSubmitTicket = (e: React.FormEvent) => {
    e.preventDefault();
    if (!email.trim() || !message.trim()) return;

    setIsSubmitting(true);
    setTimeout(() => {
      setIsSubmitting(false);
      const generatedTicket = `VRN-${Math.floor(100000 + Math.random() * 900000)}`;
      setTicketSubmitted(generatedTicket);
    }, 900);
  };

  const INDIAN_LANGUAGES = [
    { code: 'kn-IN', name: 'ಕನ್ನಡ', english: 'Kannada', flag: '🟡🔴' },
    { code: 'hi-IN', name: 'हिन्दी', english: 'Hindi', flag: '🇮🇳' },
    { code: 'ta-IN', name: 'தமிழ்', english: 'Tamil', flag: '🪔' },
    { code: 'te-IN', name: 'తెలుగు', english: 'Telugu', flag: '🏛️' },
    { code: 'ml-IN', name: 'മലയാളം', english: 'Malayalam', flag: '🌴' },
    { code: 'mr-IN', name: 'मराठी', english: 'Marathi', flag: '🚩' },
    { code: 'bn-IN', name: 'বাংলা', english: 'Bengali', flag: '🎨' },
    { code: 'en-IN', name: 'English', english: 'Indian English', flag: '🌐' }
  ];

  return (
    <div 
      className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-950/70 backdrop-blur-sm animate-fade-in"
      onClick={onClose}
    >
      <div 
        id="contact-us-modal"
        className="bg-white w-full max-w-4xl max-h-[92vh] rounded-2xl shadow-2xl border border-slate-200 overflow-hidden flex flex-col"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Modal Top Header */}
        <div className="bg-gradient-to-r from-slate-900 via-rose-950 to-slate-900 text-white px-5 py-4 flex items-center justify-between border-b border-rose-900/50">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-rose-500 to-amber-500 flex items-center justify-center text-white shadow-md text-xl">
              📞
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-base sm:text-lg font-black tracking-tight text-white">
                  Vernunt Support & Help Center
                </h2>
                <span className="text-[10px] bg-emerald-500/20 text-emerald-300 font-bold px-2 py-0.5 rounded-full border border-emerald-500/40 flex items-center gap-1">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-ping" />
                  Live 24/7
                </span>
              </div>
              <p className="text-xs text-rose-200 font-medium">
                For help contact us or call to connect with our intelligent voice support
              </p>
            </div>
          </div>
          <button
            id="btn-close-contact-modal"
            type="button"
            onClick={onClose}
            className="p-2 rounded-xl bg-white/10 hover:bg-white/20 text-white transition cursor-pointer"
            title="Close"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Scrollable Body */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-6">

          {/* HERO: CALL FOR SUPPORT TO CONNECT WITH AI VOICE */}
          <div className="relative overflow-hidden rounded-2xl bg-gradient-to-r from-red-900 via-rose-900 to-amber-900 text-white p-5 sm:p-6 shadow-lg border border-rose-700/80">
            <div className="relative z-10 flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
              <div className="space-y-2 max-w-xl">
                <div className="inline-flex items-center gap-2 bg-amber-400 text-slate-950 text-xs font-black px-2.5 py-1 rounded-full uppercase tracking-wider shadow-sm">
                  <Headphones className="w-3.5 h-3.5" />
                  <span>Call For Support • Customer Care Helpline</span>
                </div>
                <h3 className="text-lg sm:text-xl font-serif font-black text-white leading-snug">
                  Need Immediate Assistance? Speak in Any Indian Language
                </h3>
                <p className="text-xs sm:text-sm text-rose-100 font-medium leading-relaxed">
                  Connect instantly with Priya at customer care. Speak in English, Kannada, Hindi, Tamil, Telugu, Malayalam, Bengali, Marathi, or Gujarati for Aadhaar KYC, playmates, daycare booking, and store orders.
                </p>
              </div>

              <div className="w-full md:w-auto flex flex-col sm:flex-row md:flex-col gap-2 shrink-0">
                <button
                  id="btn-hero-start-voice-call"
                  type="button"
                  onClick={() => {
                    onClose();
                    onOpenVoiceSupport('en-IN');
                  }}
                  className="w-full px-5 py-3 bg-gradient-to-r from-amber-400 to-amber-300 hover:from-amber-300 hover:to-amber-200 text-slate-950 font-black rounded-xl text-sm transition transform hover:scale-102 shadow-md flex items-center justify-center gap-2 cursor-pointer"
                >
                  <PhoneCall className="w-4 h-4 animate-bounce text-slate-950" />
                  <span>Call Customer Care</span>
                </button>
                <div className="text-[10px] text-center text-amber-200 font-semibold flex items-center justify-center gap-1">
                  <span>⚡ Instant connection • No waiting queue</span>
                </div>
              </div>
            </div>

            {/* Quick Language Dial Grid */}
            <div className="mt-4 pt-4 border-t border-rose-700/60">
              <p className="text-[11px] font-bold text-rose-200 uppercase tracking-wider mb-2 flex items-center gap-1.5">
                <Globe className="w-3.5 h-3.5 text-amber-300" />
                <span>Or Select Preferred Indian Language to Dial:</span>
              </p>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                {INDIAN_LANGUAGES.map((lang) => (
                  <button
                    key={lang.code}
                    type="button"
                    onClick={() => {
                      onClose();
                      onOpenVoiceSupport(lang.code);
                    }}
                    className="flex items-center justify-between px-3 py-2 bg-rose-950/70 hover:bg-white hover:text-slate-950 text-white rounded-xl text-xs font-bold transition border border-rose-700/50 hover:border-white shadow-xs cursor-pointer group"
                  >
                    <span className="flex items-center gap-1.5">
                      <span>{lang.flag}</span>
                      <span>{lang.name}</span>
                    </span>
                    <span className="text-[10px] opacity-70 group-hover:opacity-100 font-mono">
                      {lang.english}
                    </span>
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* OFFICIAL CONTACT CHANNELS GRID */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            
            {/* 1. Official Support Email */}
            <div className="bg-rose-50/70 border border-rose-200/80 rounded-2xl p-4.5 space-y-3 flex flex-col justify-between hover:shadow-md transition">
              <div className="space-y-2">
                <div className="w-9 h-9 rounded-xl bg-rose-600 text-white flex items-center justify-center shadow-xs">
                  <Mail className="w-4 h-4" />
                </div>
                <div>
                  <h4 className="font-serif font-black text-slate-900 text-sm">Support Email</h4>
                  <p className="text-xs text-slate-600">Official customer & parent assistance desk</p>
                </div>
                <div className="bg-white p-2.5 rounded-xl border border-rose-200 flex items-center justify-between gap-2">
                  <code className="text-xs font-mono font-bold text-rose-900">
                    support@vernunt.com
                  </code>
                  <button
                    id="btn-copy-support-email"
                    type="button"
                    onClick={handleCopyEmail}
                    className="p-1.5 rounded-lg bg-rose-50 hover:bg-rose-100 text-rose-700 transition cursor-pointer"
                    title="Copy Email Address"
                  >
                    {copiedEmail ? (
                      <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                    ) : (
                      <Copy className="w-4 h-4" />
                    )}
                  </button>
                </div>
              </div>
              <div className="pt-2 border-t border-rose-100 flex items-center justify-between">
                <a
                  href="mailto:support@vernunt.com?subject=Vernunt%20Support%20Enquiry"
                  className="inline-flex items-center gap-1 text-xs font-bold text-rose-700 hover:text-rose-900 hover:underline"
                >
                  <span>Send Email</span>
                  <ExternalLink className="w-3 h-3" />
                </a>
                <span className="text-[10px] text-slate-500 font-medium">&lt; 2 hr reply</span>
              </div>
            </div>

            {/* 2. Toll-Free & Office Phone */}
            <div className="bg-amber-50/70 border border-amber-200/80 rounded-2xl p-4.5 space-y-3 flex flex-col justify-between hover:shadow-md transition">
              <div className="space-y-2">
                <div className="w-9 h-9 rounded-xl bg-amber-600 text-white flex items-center justify-center shadow-xs">
                  <Phone className="w-4 h-4" />
                </div>
                <div>
                  <h4 className="font-serif font-black text-slate-900 text-sm">Helpline Numbers</h4>
                  <p className="text-xs text-slate-600">Toll-Free India & Bangalore Tech Desk</p>
                </div>
                <div className="bg-white p-2 rounded-xl border border-amber-200 space-y-1">
                  <div className="flex items-center justify-between text-xs">
                    <span className="text-slate-500 font-medium">Toll Free:</span>
                    <a href="tel:18008376868" className="font-mono font-bold text-slate-900 hover:text-amber-700">
                      1800-VERNUNT
                    </a>
                  </div>
                  <div className="flex items-center justify-between text-xs">
                    <span className="text-slate-500 font-medium">Bengaluru:</span>
                    <a href="tel:08045685437" className="font-mono font-bold text-slate-900 hover:text-amber-700">
                      +91 (080) 4568-5437
                    </a>
                  </div>
                </div>
              </div>
              <div className="pt-2 border-t border-amber-100 flex items-center justify-between text-[11px] text-slate-600">
                <span className="flex items-center gap-1">
                  <Clock className="w-3 h-3 text-amber-600" />
                  <span>Mon - Sun: 8 AM - 10 PM IST</span>
                </span>
              </div>
            </div>

            {/* 3. Bangalore Registered HQ */}
            <div className="bg-slate-50 border border-slate-200 rounded-2xl p-4.5 space-y-3 flex flex-col justify-between hover:shadow-md transition">
              <div className="space-y-2">
                <div className="w-9 h-9 rounded-xl bg-slate-800 text-white flex items-center justify-center shadow-xs">
                  <Building className="w-4 h-4" />
                </div>
                <div>
                  <h4 className="font-serif font-black text-slate-900 text-sm">Registered Office</h4>
                  <p className="text-xs text-slate-600">Karnataka Technology & Child Safety Hub</p>
                </div>
                <p className="text-xs text-slate-700 font-medium leading-relaxed bg-white p-2 rounded-xl border border-slate-200">
                  Vernunt Kids Connect Technologies Pvt. Ltd., 100 Feet Road, Indiranagar, Bengaluru, Karnataka 560038
                </p>
              </div>
              <div className="pt-2 border-t border-slate-200 flex items-center gap-1.5 text-[10px] text-emerald-700 font-bold">
                <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" />
                <span>100% Aadhaar Verified &amp; Admin Approved</span>
              </div>
            </div>
          </div>

          {/* SEND MESSAGE / DIRECT TICKET INQUIRY */}
          <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-xs">
            <div className="flex items-center justify-between gap-2 mb-4">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-lg bg-rose-100 text-rose-700 flex items-center justify-center font-bold">
                  <MessageSquare className="w-4 h-4" />
                </div>
                <div>
                  <h4 className="font-serif font-black text-slate-900 text-sm">
                    Send Direct Support Message
                  </h4>
                  <p className="text-xs text-slate-500">
                    Submit your query and our team will get back to your email ({'support@vernunt.com'})
                  </p>
                </div>
              </div>
            </div>

            {ticketSubmitted ? (
              <div className="p-5 rounded-xl bg-emerald-50 border border-emerald-200 text-center space-y-2 animate-scale-up">
                <div className="w-12 h-12 rounded-full bg-emerald-100 text-emerald-600 flex items-center justify-center mx-auto text-xl font-bold">
                  ✓
                </div>
                <h5 className="font-serif font-black text-emerald-900 text-base">
                  Support Ticket Raised Successfully!
                </h5>
                <p className="text-xs text-emerald-800 max-w-md mx-auto">
                  Your ticket reference is <strong className="font-mono bg-emerald-100 px-2 py-0.5 rounded">{ticketSubmitted}</strong>. Our senior relationship officer has received your details and will respond to <span className="font-semibold">{email || 'your email'}</span> shortly.
                </p>
                <div className="pt-2 flex justify-center gap-3">
                  <button
                    type="button"
                    onClick={() => {
                      setTicketSubmitted(null);
                      setMessage('');
                    }}
                    className="text-xs text-emerald-800 font-bold hover:underline cursor-pointer"
                  >
                    Submit Another Query
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      onClose();
                      onOpenVoiceSupport('en-IN');
                    }}
                    className="text-xs bg-emerald-700 hover:bg-emerald-800 text-white font-bold px-3 py-1.5 rounded-lg shadow-xs cursor-pointer flex items-center gap-1"
                  >
                    <PhoneCall className="w-3 h-3" />
                    <span>Call For Immediate Voice Support</span>
                  </button>
                </div>
              </div>
            ) : (
              <form onSubmit={handleSubmitTicket} className="space-y-4">
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1">
                      Your Name
                    </label>
                    <input
                      type="text"
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                      placeholder="e.g. Ramesh Kumar"
                      className="w-full px-3 py-2 text-xs rounded-xl border border-slate-300 focus:outline-none focus:border-rose-500 focus:ring-1 focus:ring-rose-500 font-sans"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1">
                      Email Address <span className="text-rose-600">*</span>
                    </label>
                    <input
                      type="email"
                      required
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      placeholder="e.g. parent@example.com"
                      className="w-full px-3 py-2 text-xs rounded-xl border border-slate-300 focus:outline-none focus:border-rose-500 focus:ring-1 focus:ring-rose-500 font-sans"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1">
                      Phone Number (Optional)
                    </label>
                    <input
                      type="tel"
                      value={phone}
                      onChange={(e) => setPhone(e.target.value)}
                      placeholder="e.g. +91 98765 43210"
                      className="w-full px-3 py-2 text-xs rounded-xl border border-slate-300 focus:outline-none focus:border-rose-500 focus:ring-1 focus:ring-rose-500 font-sans"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1">
                      Inquiry Category
                    </label>
                    <select
                      value={ticketCategory}
                      onChange={(e) => setTicketCategory(e.target.value)}
                      className="w-full px-3 py-2 text-xs rounded-xl border border-slate-300 focus:outline-none focus:border-rose-500 focus:ring-1 focus:ring-rose-500 font-sans bg-white"
                    >
                      <option value="playmates_kyc">Aadhaar KYC & Playmates Safety</option>
                      <option value="daycare_care">Daycare & Babysitting Booking</option>
                      <option value="store_orders">Vernunt Store Organic Food & Toy Orders</option>
                      <option value="events_tickets">Kids Events & Dynamic QR Entry Passes</option>
                      <option value="technical">App Login, Sync & Account Support</option>
                      <option value="other">Other Inquiries / Feedback</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1">
                      Preferred Language for Reply
                    </label>
                    <select
                      className="w-full px-3 py-2 text-xs rounded-xl border border-slate-300 focus:outline-none focus:border-rose-500 focus:ring-1 focus:ring-rose-500 font-sans bg-white"
                    >
                      <option value="English">English</option>
                      <option value="Kannada">ಕನ್ನಡ (Kannada)</option>
                      <option value="Hindi">हिन्दी (Hindi)</option>
                      <option value="Tamil">தமிழ் (Tamil)</option>
                      <option value="Telugu">తెలుగు (Telugu)</option>
                      <option value="Malayalam">മലയാളം (Malayalam)</option>
                      <option value="Marathi">मराठी (Marathi)</option>
                      <option value="Bengali">বাংলা (Bengali)</option>
                    </select>
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Your Message / Question <span className="text-rose-600">*</span>
                  </label>
                  <textarea
                    required
                    rows={3}
                    value={message}
                    onChange={(e) => setMessage(e.target.value)}
                    placeholder="Describe your question or how we can help you..."
                    className="w-full px-3 py-2 text-xs rounded-xl border border-slate-300 focus:outline-none focus:border-rose-500 focus:ring-1 focus:ring-rose-500 font-sans resize-none"
                  />
                </div>

                <div className="flex items-center justify-between pt-1">
                  <span className="text-[11px] text-slate-500 flex items-center gap-1">
                    <ShieldCheck className="w-3.5 h-3.5 text-rose-600" />
                    <span>Data encrypted and protected under DPDP Act</span>
                  </span>

                  <button
                    id="btn-submit-support-ticket"
                    type="submit"
                    disabled={isSubmitting}
                    className="px-5 py-2.5 bg-slate-900 hover:bg-slate-800 text-white font-bold text-xs rounded-xl transition shadow-xs flex items-center gap-1.5 cursor-pointer disabled:opacity-50"
                  >
                    {isSubmitting ? (
                      <>
                        <span className="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                        <span>Submitting...</span>
                      </>
                    ) : (
                      <>
                        <Send className="w-3.5 h-3.5" />
                        <span>Send Support Ticket</span>
                      </>
                    )}
                  </button>
                </div>
              </form>
            )}
          </div>

        </div>

        {/* Modal Bottom Action Footer */}
        <div className="bg-slate-50 px-5 py-3.5 border-t border-slate-200 flex flex-col sm:flex-row items-center justify-between gap-3 text-xs">
          <div className="flex items-center gap-2 text-slate-600">
            <HeartHandshake className="w-4 h-4 text-rose-600 shrink-0" />
            <span>Support email: <strong className="text-slate-900 font-mono">support@vernunt.com</strong></span>
          </div>

          <div className="flex items-center gap-2">
            <button
              id="btn-footer-close"
              type="button"
              onClick={onClose}
              className="px-4 py-2 border border-slate-300 text-slate-700 hover:bg-slate-100 rounded-xl font-bold transition cursor-pointer"
            >
              Close
            </button>
            <button
              id="btn-footer-call-ai"
              type="button"
              onClick={() => {
                onClose();
                onOpenVoiceSupport('en-IN');
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
export default ContactUsModal;
