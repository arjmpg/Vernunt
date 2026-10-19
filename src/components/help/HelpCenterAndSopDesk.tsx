import React, { useState, useMemo } from 'react';
import { 
  FileText, Search, ShieldCheck, Store, Calendar, 
  Home, Users, Compass, Zap, CheckCircle2, ArrowRight, 
  Printer, ExternalLink, HelpCircle, Phone, Mail, Award, Lock, BookOpen
} from 'lucide-react';

interface HelpCenterAndSopDeskProps {
  onClose?: () => void;
  onNavigateToPortal?: (portal: 'vendor' | 'host' | 'care') => void;
}

export const HelpCenterAndSopDesk: React.FC<HelpCenterAndSopDeskProps> = ({
  onClose,
  onNavigateToPortal
}) => {
  const [activeSopId, setActiveSopId] = useState<string>('sop-vendor');
  const [searchQuery, setSearchQuery] = useState<string>('');

  const SOP_COLLECTIONS = [
    {
      id: 'sop-vendor',
      title: 'SOP-01: Vendor & Seller Store Operations Manual',
      category: 'Marketplace Sellers',
      icon: Store,
      portalUrl: 'https://app.vernunt.com/vendor',
      portalKey: 'vendor' as const,
      summary: 'Complete operating procedure for registering as a seller, listing products, setting discounts, delivery pincodes, and receiving automated settlements.',
      sections: [
        {
          heading: '1. Registration & Seller KYC Verification',
          steps: [
            'Visit https://app.vernunt.com/vendor or click "Become a Seller" in the Vernunt Store.',
            'Enter your 10-digit mobile phone number and click "Send SMS OTP Verification Code".',
            'Input the 6-digit code received via SMS to verify your mobile identity instantly.',
            'Provide Business Name, Brand Description, Registered Address, and GSTIN (or Artisanal Small Maker Declaration).',
            'For baby food, nutrition, or oral teethers: Upload valid FSSAI license / lab safety certificate for pediatric approval.'
          ]
        },
        {
          heading: '2. Catalog Management & Carousel Promotion',
          steps: [
            'From the Vendor Dashboard, navigate to the "Products" tab and click "+ Add New Product".',
            'Upload high-resolution transparent or white-background product photography.',
            'Input Product Name, MRP (Regular Price), and Selling Price (Sale Price).',
            'Highlight Discounts: Products with high discount percentages automatically appear in the top "🔥 Top Deals & Discounts" carousel sorted from highest to lowest discount.',
            'Marking as Featured: Admin or verified vendors can mark products as "Featured" or "Highlighted" to place them directly on the storefront top carousels.',
            'Assign accurate age groups (e.g. 0-12m, 1-3y, 3-6y) and categories (Montessori & STEM, Clothing, Baby Care, Organic Food, Kids Jewellery).'
          ]
        },
        {
          heading: '3. Pincode Availability & Fast Dispatch',
          steps: [
            'Configure your serviceable pincodes or enable Pan-India logistics.',
            'Set your dispatch lead time (1-Day Dispatch for instant warehouse shipping, or 2-Day Express).',
            'When parents enter their 6-digit PIN code on the storefront or carousel card, the delivery engine automatically validates serviceability and calculates delivery dates.'
          ]
        },
        {
          heading: '4. Order Processing, Shiprocket Fulfillment & Payouts',
          steps: [
            'When an order is placed, an instant notification is dispatched to your vendor dashboard.',
            'Click "Generate Shipping Label" to print your barcode label and manifest via Shiprocket.',
            'Courier partners (BlueDart, Delhivery, Xpressbees) pick up the packaged goods from your warehouse.',
            'Cashfree Payouts: Order amounts are escrowed and settled directly to your verified IFSC bank account on the automated weekly Tuesday settlement cycle.'
          ]
        }
      ]
    },
    {
      id: 'sop-host',
      title: 'SOP-02: Event Host & Class Activity Organizer Manual',
      category: 'Event Organizers',
      icon: Calendar,
      portalUrl: 'https://app.vernunt.com/host',
      portalKey: 'host' as const,
      summary: 'Operating procedures for publishing developmental workshops, toddler camps, sports meets, managing attendee rosters, and running gate QR passes.',
      sections: [
        {
          heading: '1. Host Account Onboarding & Verification',
          steps: [
            'Visit https://app.vernunt.com/host and sign in using your mobile number and SMS OTP code.',
            'Complete your Host Profile including instructor background, certifications (e.g., Chess, STEM, Gymnastics, Dance), and venue safety amenities.',
            'All hosts undergo child safety verification before publishing paid events.'
          ]
        },
        {
          heading: '2. Creating a Workshop, Class or Activity Camp',
          steps: [
            'Click "+ Create Event / Class" in the Host Dashboard.',
            'Select event type: Permanent Class, Sports Activity Camp, or 1–7 Day Workshop.',
            'Fill in Event Title, Location/Google Maps PIN, Recommended Age Bracket, and Maximum Attendee Capacity.',
            'Set Ticket Price per child (or select ₹0 for free community meetups).',
            'Publish Event: An alert is automatically broadcasted to neighborhood parents in the 5km radius via the Vernunt Events Radar.'
          ]
        },
        {
          heading: '3. Gate Check-In & Anti-Counterfeit Dynamic QR Pass',
          steps: [
            'On event day, launch the "QR Scanner Check-In Desk" on your tablet or smartphone.',
            'Parents present their dynamic 10-second rotating QR pass or 4-digit booking PIN.',
            'Scan pass to instantly mark attendance; duplicate screenshots are automatically rejected.',
            'Export attendee attendance roster for parent communications and post-event certificates.'
          ]
        },
        {
          heading: '4. Ticket Revenue Settlement',
          steps: [
            'Gross ticket collections are processed seamlessly via the official Cashfree gateway.',
            'Track ticket revenue in real-time under "Cashfree Payouts & Bank KYC".',
            'Net payouts (92% after standard 8% processing/platform fee) are wired directly to your bank account.'
          ]
        }
      ]
    },
    {
      id: 'sop-care',
      title: 'SOP-03: Daycare & Babysitter Partner Network Manual',
      category: 'Care Providers',
      icon: Home,
      portalUrl: 'https://app.vernunt.com/care',
      portalKey: 'care' as const,
      summary: 'Standard procedures for running trusted neighborhood babysitting, home playhomes, setting dual hourly rates, and executing safety handshakes.',
      sections: [
        {
          heading: '1. Daycare / Sitter Registration & Safety Screening',
          steps: [
            'Access https://app.vernunt.com/care and enter your registered mobile number for SMS OTP verification.',
            'Upload Aadhaar or Government ID verification for mandatory child-protection compliance.',
            'Add photos of your playhome space, safety soft-padding, emergency first aid kit, and CPR certification (if applicable).'
          ]
        },
        {
          heading: '2. Setting Dual Hourly Rates & Availability',
          steps: [
            'Vernunt supports flexible dual rates: "Host at My Home" (e.g., ₹150/hr or Free Co-Op) and "Visit Parent’s Home" (e.g., ₹250/hr).',
            'Update your real-time availability calendar with open time slots (e.g., Morning 9 AM – 1 PM, Evening 4 PM – 8 PM).',
            'Enable "Accepting Walk-ins Now" when you have immediate emergency care capacity.'
          ]
        },
        {
          heading: '3. Handshake Security PIN Protocol (Drop-off & Pick-up)',
          steps: [
            'When a parent arrives for drop-off, verify the 4-digit security PIN generated on the parent’s app.',
            'Both parties confirm the physical handover; care timer starts automatically.',
            'During care: Log daily milestone updates (snack time, diaper check, nap time).',
            'At pick-up: Execute reverse handshake PIN verification. Children are never released without matching parent security PIN.'
          ]
        }
      ]
    },
    {
      id: 'sop-parent',
      title: 'SOP-04: Parents, Playmates & Store Shopping Guide',
      category: 'Parents & Families',
      icon: Users,
      summary: 'Step-by-step instructions for finding local playmates, browsing product carousels with highest discounts, and ordering child-safe toys.',
      sections: [
        {
          heading: '1. Connecting with Neighborhood Playmates',
          steps: [
            'Sign in using your mobile number or Google Account.',
            'Create your child profile with age bracket, spoken languages, and favorite hobbies (Lego, cycling, art).',
            'Explore the Playmate Radar swipe deck: Swipe Right 💖 to request a playdate connection; Swipe Left ✕ to pass.',
            'Use the distance filter (0.5 km to 10 km) to find kids within walking distance in your apartment complex or neighborhood.'
          ]
        },
        {
          heading: '2. Shopping the Vernunt Store in Carousel View',
          steps: [
            'Click "🎡 Showcase Carousels" in the Store header for product-focused horizontal browsing.',
            'Featured Products Carousel: Curated pediatric tools handpicked for developmental milestones.',
            'Top Deals & Discounts Carousel: Products strictly sorted by the highest discount percentage so you always get maximum savings.',
            'Explore Category Carousels: Horizontal scrub through Montessori & STEM, Kids Clothing, Baby Care, and Books.',
            'Express Shipping Check: Enter your 6-digit postal PIN code in the top banner or on any product card to view estimated delivery (e.g. "Tomorrow by 2 PM").'
          ]
        },
        {
          heading: '3. Checkout & Payment Security',
          steps: [
            'Add items to your cart using the 1-click `+ ADD` or `[- 1 +]` stepper.',
            'Enjoy Free Express Delivery on all orders above ₹499.',
            'Pay securely via Cashfree using UPI (Google Pay, PhonePe, Paytm), NetBanking, Cards, or Cash on Delivery (COD).'
          ]
        }
      ]
    },
    {
      id: 'sop-safety',
      title: 'SOP-05: Child Safety, Privacy & Emergency Protocol',
      category: 'Child Safety & Compliance',
      icon: ShieldCheck,
      summary: 'Operational safety rules, Digital Personal Data Protection (DPDP) Act 2023 compliance, facial blurring, and Emergency SOS procedure.',
      sections: [
        {
          heading: '1. Digital Personal Data Protection (DPDP) Act 2023 Compliance',
          steps: [
            'Zero Advertising & Zero Third-Party Tracking: Vernunt does not sell parental or child behavioral data.',
            'Parental Consent: All child profiles require verified parent/guardian consent.',
            'Right to Erasure: Parents can export or delete their entire account and family records at any time from Profile Privacy Settings.'
          ]
        },
        {
          heading: '2. 1-Tap Emergency SOS Alert Protocol',
          steps: [
            'In case of an emergency, tap the red SOS button visible in the bottom navigation.',
            'An instant priority alert with your live GPS location is broadcasted to your designated emergency contacts and verified neighborhood parent volunteers.',
            'Local pediatric first-aid numbers (112 Emergency and local ambulance) are displayed on-screen for immediate calling.'
          ]
        }
      ]
    }
  ];

  const currentSop = useMemo(() => {
    return SOP_COLLECTIONS.find(s => s.id === activeSopId) || SOP_COLLECTIONS[0];
  }, [activeSopId]);

  const filteredSops = useMemo(() => {
    if (!searchQuery.trim()) return SOP_COLLECTIONS;
    const q = searchQuery.toLowerCase();
    return SOP_COLLECTIONS.filter(s => 
      s.title.toLowerCase().includes(q) || 
      s.summary.toLowerCase().includes(q) ||
      s.sections.some(sec => sec.heading.toLowerCase().includes(q) || sec.steps.some(st => st.toLowerCase().includes(q)))
    );
  }, [searchQuery]);

  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="bg-slate-50 min-h-screen text-slate-900 pb-16 animate-fade-in">
      {/* Top Banner */}
      <div className="bg-gradient-to-r from-slate-950 via-rose-950 to-slate-950 text-white p-6 sm:p-10 border-b border-rose-900/30">
        <div className="max-w-6xl mx-auto space-y-4">
          <div className="flex flex-wrap items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-2xl bg-rose-500/20 border border-rose-400/30 flex items-center justify-center text-2xl shrink-0">
                📚
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <h1 className="text-xl sm:text-2xl font-black tracking-tight">
                    Vernunt Standard Operating Procedures (SOP) &amp; Help Center
                  </h1>
                </div>
                <p className="text-xs sm:text-sm text-slate-300">
                  Official operating manuals for Sellers, Event Hosts, Daycare Providers, and Parents
                </p>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={handlePrint}
                className="px-3.5 py-2 bg-white/10 hover:bg-white/20 text-white font-bold text-xs rounded-xl border border-white/20 transition flex items-center gap-1.5 cursor-pointer"
                title="Print this SOP Manual"
              >
                <Printer className="w-3.5 h-3.5" />
                <span>Print SOP</span>
              </button>

              {onClose && (
                <button
                  type="button"
                  onClick={onClose}
                  className="px-4 py-2 bg-rose-600 hover:bg-rose-500 text-white font-bold text-xs rounded-xl shadow-md transition cursor-pointer"
                >
                  Return to App
                </button>
              )}
            </div>
          </div>

          {/* Dedicated Portal Quick-Launch Links */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-2">
            <a
              href="/vendor"
              onClick={(e) => {
                if (onNavigateToPortal) {
                  e.preventDefault();
                  onNavigateToPortal('vendor');
                }
              }}
              className="bg-white/10 hover:bg-white/15 p-3 rounded-xl border border-white/15 flex items-center justify-between transition group cursor-pointer"
            >
              <div className="flex items-center gap-2.5">
                <Store className="w-5 h-5 text-rose-400" />
                <div>
                  <span className="font-black text-xs text-white block">Seller Portal</span>
                  <span className="text-[10.5px] text-slate-300 font-mono">app.vernunt.com/vendor</span>
                </div>
              </div>
              <ArrowRight className="w-4 h-4 text-slate-400 group-hover:text-white transition" />
            </a>

            <a
              href="/host"
              onClick={(e) => {
                if (onNavigateToPortal) {
                  e.preventDefault();
                  onNavigateToPortal('host');
                }
              }}
              className="bg-white/10 hover:bg-white/15 p-3 rounded-xl border border-white/15 flex items-center justify-between transition group cursor-pointer"
            >
              <div className="flex items-center gap-2.5">
                <Calendar className="w-5 h-5 text-amber-400" />
                <div>
                  <span className="font-black text-xs text-white block">Event Host Portal</span>
                  <span className="text-[10.5px] text-slate-300 font-mono">app.vernunt.com/host</span>
                </div>
              </div>
              <ArrowRight className="w-4 h-4 text-slate-400 group-hover:text-white transition" />
            </a>

            <a
              href="/care"
              onClick={(e) => {
                if (onNavigateToPortal) {
                  e.preventDefault();
                  onNavigateToPortal('care');
                }
              }}
              className="bg-white/10 hover:bg-white/15 p-3 rounded-xl border border-white/15 flex items-center justify-between transition group cursor-pointer"
            >
              <div className="flex items-center gap-2.5">
                <Home className="w-5 h-5 text-emerald-400" />
                <div>
                  <span className="font-black text-xs text-white block">Daycare Partner Portal</span>
                  <span className="text-[10.5px] text-slate-300 font-mono">app.vernunt.com/care</span>
                </div>
              </div>
              <ArrowRight className="w-4 h-4 text-slate-400 group-hover:text-white transition" />
            </a>
          </div>
        </div>
      </div>

      {/* Main Content Layout */}
      <div className="max-w-6xl mx-auto px-4 py-8 grid grid-cols-1 lg:grid-cols-12 gap-8">
        {/* Left Sidebar: SOP Manual Directory */}
        <div className="lg:col-span-4 space-y-4">
          {/* Search Box */}
          <div className="relative">
            <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Search procedures, rules, registration..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-4 py-2.5 text-xs bg-white border border-slate-200 rounded-xl outline-hidden focus:border-rose-600 font-medium shadow-2xs"
            />
          </div>

          {/* SOP Cards Navigation List */}
          <div className="space-y-2">
            <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400 px-1">
              Select Operating Procedure
            </span>
            {filteredSops.map(sop => {
              const Icon = sop.icon;
              const isSelected = sop.id === activeSopId;
              return (
                <button
                  key={sop.id}
                  type="button"
                  onClick={() => setActiveSopId(sop.id)}
                  className={`w-full text-left p-3.5 rounded-2xl border transition-all cursor-pointer flex items-start gap-3 ${
                    isSelected
                      ? 'bg-white border-rose-600 shadow-md ring-2 ring-rose-100'
                      : 'bg-white border-slate-200 hover:border-slate-300 hover:bg-slate-50 shadow-2xs'
                  }`}
                >
                  <div className={`w-9 h-9 rounded-xl flex items-center justify-center shrink-0 ${
                    isSelected ? 'bg-rose-100 text-rose-700 font-bold' : 'bg-slate-100 text-slate-600'
                  }`}>
                    <Icon className="w-4 h-4" />
                  </div>
                  <div className="min-w-0 flex-1">
                    <span className="text-[10px] font-black uppercase text-slate-400 block tracking-wider">
                      {sop.category}
                    </span>
                    <h4 className={`text-xs font-black truncate mt-0.5 ${
                      isSelected ? 'text-rose-700' : 'text-slate-900'
                    }`}>
                      {sop.title.split(':')[0]}
                    </h4>
                    <p className="text-[11px] text-slate-500 line-clamp-1 mt-0.5">
                      {sop.title.split(':')[1]}
                    </p>
                  </div>
                </button>
              );
            })}
          </div>

          {/* Help Desk Contacts Card */}
          <div className="bg-white rounded-2xl border border-slate-200 p-4 space-y-3 shadow-2xs">
            <h4 className="text-xs font-black text-slate-900 flex items-center gap-1.5">
              <HelpCircle className="w-3.5 h-3.5 text-rose-600" />
              <span>Need Direct Operational Support?</span>
            </h4>
            <p className="text-[11px] text-slate-500 leading-relaxed">
              Our partner operations desk assists vendors, hosts, and daycares Monday to Saturday from 9 AM to 7 PM IST.
            </p>
            <div className="space-y-1.5 text-xs text-slate-700 pt-1">
              <div className="flex items-center gap-2">
                <Mail className="w-3.5 h-3.5 text-slate-400" />
                <span className="font-mono text-[11px] font-bold">support@vernunt.com</span>
              </div>
              <div className="flex items-center gap-2">
                <Phone className="w-3.5 h-3.5 text-slate-400" />
                <span className="font-mono text-[11px] font-bold">+91 80 4719 2200</span>
              </div>
            </div>
          </div>
        </div>

        {/* Right Content: Active SOP Document Reader */}
        <div className="lg:col-span-8">
          <div className="bg-white rounded-3xl border border-slate-200 p-6 sm:p-8 shadow-sm space-y-6">
            {/* Document Header */}
            <div className="border-b border-slate-100 pb-5 space-y-3">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <span className="text-xs font-black uppercase tracking-wider bg-rose-50 text-rose-800 border border-rose-200 px-3 py-1 rounded-full">
                  {currentSop.category}
                </span>

                {currentSop.portalUrl && (
                  <a
                    href={currentSop.portalUrl}
                    onClick={(e) => {
                      if (onNavigateToPortal && currentSop.portalKey) {
                        e.preventDefault();
                        onNavigateToPortal(currentSop.portalKey);
                      }
                    }}
                    className="text-xs font-bold text-rose-700 hover:underline flex items-center gap-1 font-mono"
                  >
                    <span>Open Portal: {currentSop.portalUrl}</span>
                    <ExternalLink className="w-3 h-3" />
                  </a>
                )}
              </div>

              <h2 className="text-xl sm:text-2xl font-black text-slate-900 leading-snug">
                {currentSop.title}
              </h2>

              <p className="text-xs sm:text-sm text-slate-600 leading-relaxed bg-slate-50 p-4 rounded-xl border border-slate-200/80">
                {currentSop.summary}
              </p>
            </div>

            {/* Document Sections */}
            <div className="space-y-8">
              {currentSop.sections.map((section, sIdx) => (
                <div key={sIdx} className="space-y-3">
                  <h3 className="text-sm sm:text-base font-black text-slate-900 flex items-center gap-2">
                    <span className="w-6 h-6 rounded-lg bg-slate-900 text-white text-xs font-mono font-bold flex items-center justify-center shrink-0">
                      {sIdx + 1}
                    </span>
                    <span>{section.heading}</span>
                  </h3>

                  <div className="pl-8 space-y-2.5">
                    {section.steps.map((step, stepIdx) => (
                      <div key={stepIdx} className="flex items-start gap-2.5 text-xs text-slate-700 leading-relaxed">
                        <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
                        <span>{step}</span>
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </div>

            {/* Quick Portal Action Card */}
            {currentSop.portalKey && (
              <div className="pt-6 border-t border-slate-100 flex flex-wrap items-center justify-between gap-4 bg-gradient-to-r from-slate-900 to-rose-950 text-white p-5 rounded-2xl">
                <div>
                  <h4 className="font-black text-sm">
                    Ready to operate or register for this service?
                  </h4>
                  <p className="text-xs text-slate-300">
                    Access with Indian mobile phone number and SMS OTP verification.
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => onNavigateToPortal && onNavigateToPortal(currentSop.portalKey!)}
                  className="px-5 py-2.5 bg-rose-600 hover:bg-rose-500 text-white font-black text-xs rounded-xl shadow-md transition flex items-center gap-1.5 cursor-pointer"
                >
                  <span>Launch Portal Now</span>
                  <ArrowRight className="w-4 h-4" />
                </button>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
