import {
  X,
  ShieldCheck,
  Award,
  Briefcase,
  GraduationCap,
  MapPin,
  Heart,
  Sparkles,
  CheckCircle2,
  Building2,
  Scale,
  ShoppingBag,
  TrendingUp,
  FileCheck2,
  Lock,
  Mail,
  Phone,
  ArrowRight,
  ExternalLink,
  Users,
  Share2,
  Baby,
  Activity,
  Brain,
  Compass,
  Trees,
  Smile,
  BookOpen,
  Clock,
  SlidersHorizontal
} from 'lucide-react';
import VernuntLogo from '../VernuntLogo.tsx';

export interface TeamMember {
  id: string;
  name: string;
  role: string;
  titleBadge: string;
  location: string;
  experienceYears: number;
  education: string;
  photoUrl: string;
  shortBio: string;
  detailedParagraphs: string[];
  coreCompetencies: string[];
  verifiedBadges: string[];
  contactEmail?: string;
  linkedinUrl?: string;
}

export const LEADERSHIP_TEAM: TeamMember[] = [
  {
    id: 'dharshik-mp',
    name: 'Dharshik MP',
    role: 'Founder & Managing Director',
    titleBadge: 'IIM Indore Alumnus • 12+ Yrs Experience',
    location: 'Bengaluru, Karnataka, India',
    experienceYears: 12,
    education: 'Indian Institute of Management Indore (IIM Indore)',
    photoUrl: '/assets/aistudio/file_00000000e534821087602a3d8bff43c9_933b7568.png',
    shortBio: 'Visionary entrepreneur and IIM Indore alumnus leading the mission to build India’s safest verified neighborhood parenting and kids ecosystem.',
    detailedParagraphs: [
      'Dharshik MP is the founder and driving force behind Vernunt. As an alumnus of the prestigious Indian Institute of Management Indore (IIM Indore), Dharshik brings over 12 years of executive experience spanning investment banking, high-growth e-commerce ventures, and multi-generational family enterprise governance.',
      'Recognizing the acute urban challenge of kids being isolated behind screens, Dharshik conceived Vernunt to give modern Indian parents an ironclad, trusted radar to find verified local playmates, pediatricians, and community sports in their immediate neighborhood.',
      'His background in institutional finance and digital commerce ensures Vernunt operates with disciplined governance, world-class unit economics, and uncompromising child-safety benchmarks across pan-India metros.'
    ],
    coreCompetencies: [
      'Investment Banking & Capital Strategy',
      'E-Commerce & Platform Scaling',
      'Family Enterprise Governance',
      'Neighborhood Community Architecture',
      'Strategic Partnerships & M&A'
    ],
    verifiedBadges: [
      'IIM Indore Alumni',
      'Verified Founder',
      'Bengaluru HQ Desk'
    ],
    contactEmail: 'founder@vernunt.com'
  },
  {
    id: 'niranjan-kumar',
    name: 'Niranjan Kumar',
    role: 'Finance & Compliance Head',
    titleBadge: 'Engineer turned CA • 15+ Yrs Experience',
    location: 'Bengaluru, Karnataka, India',
    experienceYears: 15,
    education: 'Chartered Accountant (ICAI) & B.Tech / Engineering',
    photoUrl: '/assets/aistudio/file_00000000eedc81fabca620cd8cd35916_e06f2e63.png',
    shortBio: 'Engineer turned Chartered Accountant with 15+ years overseeing audits, financial governance, risk mitigation, and regulatory compliance.',
    detailedParagraphs: [
      'Niranjan Kumar steers financial architecture, compliance, and risk governance at Vernunt. As a uniquely skilled engineer turned Chartered Accountant (CA) with over 15 years of industry leadership, Niranjan fuses analytical engineering methodology with forensic financial mastery.',
      'Throughout his illustrious 15-year career across premier audit and financial service advisory firms, he has directed comprehensive statutory audits, internal financial controls (IFC), direct & indirect taxation (including GST frameworks), corporate restructuring, enterprise risk management (ERM), and strict statutory filings with MCA and RBI.',
      'At Vernunt, Niranjan ensures every commercial transaction, parent escrow holding, vendor payout, and kid-safety data policy rigorously complies with India’s Digital Personal Data Protection (DPDP) Act 2023 and industry accounting standards.'
    ],
    coreCompetencies: [
      'Statutory & Forensic Financial Audit',
      'Enterprise Risk Management (ERM)',
      'Direct & Indirect Taxation (GST)',
      'DPDP Act 2023 & MCA/RBI Compliance',
      'Escrow Architecture & Financial Controls'
    ],
    verifiedBadges: [
      'Fellow Chartered Accountant',
      'Engineering Alumni',
      'Compliance Officer'
    ],
    contactEmail: 'compliance@vernunt.com'
  },
  {
    id: 'krishna-prasad',
    name: 'Krishna Prasad',
    role: 'Head of Retail Marketing & Growth',
    titleBadge: 'MBA in Marketing • 15+ Yrs Experience',
    location: 'Bengaluru, Karnataka, India',
    experienceYears: 15,
    education: 'Master of Business Administration (MBA - Marketing)',
    photoUrl: '/assets/aistudio/file_0000000023ac81fa9163b9eb41cb3696_0321fb4b.png',
    shortBio: 'Senior retail marketing strategist with 15+ years orchestrating brand expansion, consumer psychology, and omnichannel marketplace operations.',
    detailedParagraphs: [
      'Krishna Prasad leads Retail Marketing and Consumer Growth at Vernunt. Backed by a Master of Business Administration (MBA) in Marketing and over 15 years of frontline leadership in India’s fast-moving retail and lifestyle sectors, Krishna is a master of consumer behavior and omnichannel brand scaling.',
      'Over the past decade and a half, he has designed and executed expansive retail go-to-market strategies, vendor distribution alliances, hyper-local marketing campaigns, and customer retention programs for celebrated retail brands.',
      'At Vernunt, Krishna oversees merchant curation for safe children’s toys, verified learning kits, pediatric health essentials, and neighborhood events—ensuring Indian parents enjoy authentic, high-quality, and transparently priced offerings with seamless doorstep logistics.'
    ],
    coreCompetencies: [
      'Retail Marketing & Go-To-Market',
      'Omnichannel Consumer Acquisition',
      'Vendor Onboarding & Quality Curation',
      'Brand Alliances & Category Management',
      'Customer Retention & Community Growth'
    ],
    verifiedBadges: [
      'MBA Marketing',
      '15+ Yrs Retail Veteran',
      'Growth Strategist'
    ],
    contactEmail: 'growth@vernunt.com'
  }
];

interface AboutUsModalProps {
  isOpen: boolean;
  onClose: () => void;
  onOpenContactUs?: () => void;
  onOpenSafetyCompliance?: () => void;
  onOpenShare?: () => void;
}

export const AboutUsModal: React.FC<AboutUsModalProps> = ({
  isOpen,
  onClose,
  onOpenContactUs,
  onOpenSafetyCompliance,
  onOpenShare
}) => {
  const [selectedMember, setSelectedMember] = useState<TeamMember | null>(null);
  const [activeTab, setActiveTab] = useState<'leadership' | 'ecd' | 'mission' | 'compliance'>('leadership');

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-900/70 backdrop-blur-sm flex items-center justify-center p-2 sm:p-4 animate-fadeIn">
      <div 
        className="bg-white rounded-3xl w-full max-w-5xl shadow-2xl overflow-hidden border border-slate-100 flex flex-col max-h-[92vh]"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header Strip */}
        <div className="px-6 py-5 bg-gradient-to-r from-slate-900 via-indigo-950 to-slate-900 text-white flex items-center justify-between shrink-0 border-b border-white/10">
          <div className="flex items-center gap-3">
            <VernuntLogo size="sm" />
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-lg font-bold tracking-tight text-white">About Vernunt &amp; Leadership Team</h2>
                <span className="px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 text-[10px] font-semibold border border-emerald-400/30">
                  Verified Executive Desk
                </span>
              </div>
              <p className="text-xs text-slate-300">
                Pioneering safe neighborhood connections, child wellness, and verified parent networks in India.
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            {onOpenShare && (
              <button
                type="button"
                onClick={onOpenShare}
                className="px-3 py-1.5 rounded-full bg-white/10 hover:bg-white/20 text-indigo-200 hover:text-white transition cursor-pointer flex items-center gap-1.5 text-xs font-bold"
                title="Share About Us page"
              >
                <Share2 className="w-3.5 h-3.5" />
                <span className="hidden sm:inline">Share</span>
              </button>
            )}
            <button
              type="button"
              onClick={onClose}
              className="p-2 rounded-full bg-white/10 hover:bg-white/20 text-white transition cursor-pointer"
              aria-label="Close modal"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Sub-navigation tabs */}
        <div className="flex items-center gap-2 px-6 pt-3 pb-2 bg-slate-50 border-b border-slate-200/80 text-xs font-semibold overflow-x-auto shrink-0">
          <button
            type="button"
            onClick={() => setActiveTab('leadership')}
            className={`px-4 py-2 rounded-xl transition flex items-center gap-2 cursor-pointer ${
              activeTab === 'leadership'
                ? 'bg-indigo-600 text-white shadow-sm'
                : 'bg-white text-slate-600 hover:text-slate-900 border border-slate-200'
            }`}
          >
            <Users className="w-4 h-4" />
            <span>Leadership Team ({LEADERSHIP_TEAM.length})</span>
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('ecd')}
            className={`px-4 py-2 rounded-xl transition flex items-center gap-2 cursor-pointer ${
              activeTab === 'ecd'
                ? 'bg-indigo-600 text-white shadow-sm'
                : 'bg-white text-slate-600 hover:text-slate-900 border border-slate-200'
            }`}
          >
            <Baby className="w-4 h-4" />
            <span>ECD Pediatric Science</span>
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('mission')}
            className={`px-4 py-2 rounded-xl transition flex items-center gap-2 cursor-pointer ${
              activeTab === 'mission'
                ? 'bg-indigo-600 text-white shadow-sm'
                : 'bg-white text-slate-600 hover:text-slate-900 border border-slate-200'
            }`}
          >
            <Sparkles className="w-4 h-4" />
            <span>Our Mission &amp; Story</span>
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('compliance')}
            className={`px-4 py-2 rounded-xl transition flex items-center gap-2 cursor-pointer ${
              activeTab === 'compliance'
                ? 'bg-indigo-600 text-white shadow-sm'
                : 'bg-white text-slate-600 hover:text-slate-900 border border-slate-200'
            }`}
          >
            <ShieldCheck className="w-4 h-4" />
            <span>Safety, Trust &amp; Legal Governance</span>
          </button>
        </div>

        {/* Body content */}
        <div className="p-4 sm:p-6 overflow-y-auto flex-1 space-y-8">
          
          {/* TAB 1: LEADERSHIP TEAM */}
          {activeTab === 'leadership' && (
            <div className="space-y-6">
              <div className="text-center max-w-2xl mx-auto space-y-2">
                <span className="text-[11px] font-bold uppercase tracking-wider text-indigo-600 bg-indigo-50 px-3 py-1 rounded-full border border-indigo-100">
                  Executive Leadership &amp; Board
                </span>
                <h3 className="text-xl sm:text-2xl font-bold text-slate-900">
                  The Team Behind Vernunt
                </h3>
                <p className="text-xs sm:text-sm text-slate-600 leading-relaxed">
                  Combining world-class investment banking, Chartered Accountancy governance, and 15+ years of retail marketing excellence—united by a passion to give India’s kids safe, active childhoods.
                </p>
              </div>

              {/* Leadership Grid */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6 items-stretch">
                {LEADERSHIP_TEAM.map((member) => (
                  <div
                    key={member.id}
                    className="bg-white border border-slate-200 rounded-2xl shadow-sm hover:shadow-md transition flex flex-col overflow-hidden group hover:border-indigo-300"
                  >
                    {/* Portrait container */}
                    <div className="relative aspect-[4/5] sm:aspect-[3/4] bg-slate-100 overflow-hidden">
                      <img
                        src={member.photoUrl}
                        alt={member.name}
                        className="w-full h-full object-cover object-top transition duration-300 group-hover:scale-[1.02]"
                        loading="lazy"
                        onError={(e) => {
                          // Fallback to high quality avatar if any path issue occurs
                          (e.target as HTMLImageElement).src = `https://ui-avatars.com/api/?name=${encodeURIComponent(member.name)}&background=4F46E5&color=fff&size=512`;
                        }}
                      />
                      <div className="absolute inset-0 bg-gradient-to-t from-slate-950/80 via-transparent to-transparent opacity-90" />
                      
                      <div className="absolute bottom-3 left-3 right-3 text-white">
                        <span className="inline-block px-2 py-0.5 rounded-md bg-white/20 backdrop-blur-md text-[10px] font-semibold text-white mb-1 border border-white/20">
                          {member.titleBadge}
                        </span>
                        <h4 className="text-base font-bold text-white leading-tight drop-shadow-sm">
                          {member.name}
                        </h4>
                        <p className="text-xs text-indigo-200 font-medium">
                          {member.role}
                        </p>
                      </div>

                      <div className="absolute top-3 right-3">
                        <span className="inline-flex items-center gap-1 px-2 py-1 rounded-full bg-emerald-500/90 text-white text-[10px] font-bold shadow-sm backdrop-blur-sm">
                          <CheckCircle2 className="w-3 h-3" />
                          <span>Verified</span>
                        </span>
                      </div>
                    </div>

                    {/* Content Section */}
                    <div className="p-4 sm:p-5 flex-1 flex flex-col justify-between space-y-4">
                      
                      {/* Meta badges */}
                      <div className="space-y-2">
                        <div className="flex items-center gap-1.5 text-[11px] text-slate-500 font-medium">
                          <MapPin className="w-3.5 h-3.5 text-rose-500 shrink-0" />
                          <span>{member.location}</span>
                        </div>

                        <div className="flex items-center gap-1.5 text-[11px] text-slate-700 font-semibold">
                          <GraduationCap className="w-3.5 h-3.5 text-indigo-600 shrink-0" />
                          <span className="truncate">{member.education}</span>
                        </div>

                        <p className="text-xs text-slate-600 leading-relaxed pt-1 line-clamp-3">
                          {member.shortBio}
                        </p>
                      </div>

                      {/* Key competencies tags */}
                      <div className="space-y-2 pt-2 border-t border-slate-100">
                        <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
                          Areas of Expertise
                        </span>
                        <div className="flex flex-wrap gap-1.5">
                          {member.coreCompetencies.slice(0, 3).map((comp, idx) => (
                            <span
                              key={idx}
                              className="px-2 py-0.5 rounded-md bg-slate-100 text-slate-700 text-[10px] font-medium"
                            >
                              {comp}
                            </span>
                          ))}
                        </div>
                      </div>

                      {/* Action trigger */}
                      <button
                        type="button"
                        onClick={() => setSelectedMember(member)}
                        className="w-full py-2 px-3 rounded-xl bg-indigo-50 hover:bg-indigo-100 text-indigo-700 text-xs font-bold transition flex items-center justify-center gap-1.5 cursor-pointer mt-2"
                      >
                        <span>Read Full Profile</span>
                        <ArrowRight className="w-3.5 h-3.5" />
                      </button>

                    </div>
                  </div>
                ))}
              </div>

              {/* Company Credibility Callout */}
              <div className="bg-gradient-to-br from-indigo-50 via-white to-purple-50 rounded-2xl p-5 border border-indigo-100 flex flex-col sm:flex-row items-center justify-between gap-4 mt-6">
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <Building2 className="w-4 h-4 text-indigo-600" />
                    <h5 className="text-xs font-bold text-slate-900 uppercase tracking-wider">
                      Bengaluru Corporate Headquarters
                    </h5>
                  </div>
                  <p className="text-xs text-slate-600">
                    Vernunt Ventures Pvt. Ltd. &bull; Indiranagar, Bengaluru, Karnataka 560038
                  </p>
                  <p className="text-[11px] text-slate-500">
                    Compliant with DPDP Act 2023, MeitY Guidelines, and DigiLocker Govt of India ID Verification.
                  </p>
                </div>
                {onOpenContactUs && (
                  <button
                    type="button"
                    onClick={() => {
                      onClose();
                      onOpenContactUs();
                    }}
                    className="px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold transition whitespace-nowrap shadow-sm cursor-pointer"
                  >
                    Contact Leadership Desk
                  </button>
                )}
              </div>
            </div>
          )}

          {/* TAB: EARLY CHILDHOOD DEVELOPMENT (ECD) SCIENCE */}
          {activeTab === 'ecd' && (
            <div className="space-y-8 animate-fadeIn max-w-4xl mx-auto">
              {/* Introduction Banner */}
              <div className="bg-gradient-to-br from-indigo-900 via-slate-900 to-indigo-950 text-white p-6 sm:p-8 rounded-3xl space-y-4 shadow-lg border border-white/10">
                <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/10 text-indigo-300 text-xs font-semibold backdrop-blur-md border border-white/15">
                  <Baby className="w-3.5 h-3.5 text-indigo-400" />
                  <span>Early Childhood Development (ECD) Science</span>
                </div>
                <h3 className="text-xl sm:text-3xl font-extrabold text-white tracking-tight leading-tight">
                  How Vernunt Empowers Early Childhood Development (ECD)
                </h3>
                <p className="text-xs sm:text-sm text-slate-300 leading-relaxed font-normal">
                  Between birth and age 8, 90% of human brain architecture is formed. The World Health Organization (WHO) and leading pediatric associations warn that passive screen exposure crowds out vital sensory-motor feedback, peer communication, and outdoor exploration. Vernunt was engineered from ground-up to substitute isolating screen time with active, real-world development.
                </p>
                <div className="flex flex-wrap items-center gap-3 pt-2 text-xs">
                  <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-white/10 backdrop-blur-md">
                    <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                    <span>WHO Screen Guidelines Aligned</span>
                  </div>
                  <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-white/10 backdrop-blur-md">
                    <Trees className="w-4 h-4 text-emerald-400" />
                    <span>Nature &amp; Gross Motor Focus</span>
                  </div>
                  <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-white/10 backdrop-blur-md">
                    <Heart className="w-4 h-4 text-rose-400" />
                    <span>Peer Social-Emotional Learning</span>
                  </div>
                </div>
              </div>

              {/* The 4 Pediatric Pillars of Vernunt */}
              <div className="space-y-4">
                <div className="flex items-center gap-2">
                  <span className="text-xs font-black uppercase tracking-wider text-slate-400">Pillar 1 of 2</span>
                  <h4 className="text-lg font-bold text-slate-900">The 4 Pediatric Pillars of Vernunt</h4>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                  {/* 1. Reduces Screen Time */}
                  <div className="bg-slate-50/70 p-5 rounded-2xl border border-slate-200 space-y-3 shadow-2xs">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-xl bg-rose-100 text-rose-700 flex items-center justify-center font-bold">
                        <Clock className="w-5 h-5" />
                      </div>
                      <div>
                        <span className="text-[10px] font-bold uppercase tracking-wider text-rose-600">Reduces Screen Time</span>
                        <h5 className="text-sm font-bold text-slate-900">
                          Mitigation of Passive Sedentary Behavior &amp; Cognitive Crowding Out
                        </h5>
                      </div>
                    </div>
                    <p className="text-xs text-slate-600 leading-relaxed">
                      Directly addresses <strong className="text-slate-800">World Health Organization (WHO)</strong> and pediatric guidelines by actively substituting passive media exposure with physical reality. Screens over-stimulate rapid visual dopamine loops while starving sensory motor development; Vernunt replaces sedentary hours with rich physical interaction.
                    </p>
                  </div>

                  {/* 2. Connects Kids for Play Time */}
                  <div className="bg-slate-50/70 p-5 rounded-2xl border border-slate-200 space-y-3 shadow-2xs">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-xl bg-indigo-100 text-indigo-700 flex items-center justify-center font-bold">
                        <Smile className="w-5 h-5" />
                      </div>
                      <div>
                        <span className="text-[10px] font-bold uppercase tracking-wider text-indigo-600">Connects Kids for Play</span>
                        <h5 className="text-sm font-bold text-slate-900">
                          Peer-to-Peer Prosocial Socialization &amp; Peer-Led Co-Regulation
                        </h5>
                      </div>
                    </div>
                    <p className="text-xs text-slate-600 leading-relaxed">
                      Builds essential non-cognitive skills like turn-taking, empathetic communication, active listening, and peer conflict resolution. Through real-world playdates, children practice <strong className="text-slate-800">co-regulation</strong>—calming down with help, sharing, empathy, and making genuine neighborhood friends.
                    </p>
                  </div>

                  {/* 3. Finds Outdoor Activities */}
                  <div className="bg-slate-50/70 p-5 rounded-2xl border border-slate-200 space-y-3 shadow-2xs">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-xl bg-emerald-100 text-emerald-700 flex items-center justify-center font-bold">
                        <Trees className="w-5 h-5" />
                      </div>
                      <div>
                        <span className="text-[10px] font-bold uppercase tracking-wider text-emerald-600">Finds Outdoor Activities</span>
                        <h5 className="text-sm font-bold text-slate-900">
                          Gross Motor Skill Acquisition &amp; Nature-Based Experiential Learning
                        </h5>
                      </div>
                    </div>
                    <p className="text-xs text-slate-600 leading-relaxed">
                      Moving freely outdoors stimulates <strong className="text-slate-800">vestibulo-ocular and sensory-rich neural pathways</strong> that screens cannot replicate. Climbing, balancing, and running across Bangalore's curated parks strengthens balance, spatial proprioception, and protects against juvenile myopia.
                    </p>
                  </div>

                  {/* 4. Parent Control Panel */}
                  <div className="bg-slate-50/70 p-5 rounded-2xl border border-slate-200 space-y-3 shadow-2xs">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-xl bg-amber-100 text-amber-700 flex items-center justify-center font-bold">
                        <SlidersHorizontal className="w-5 h-5" />
                      </div>
                      <div>
                        <span className="text-[10px] font-bold uppercase tracking-wider text-amber-600">Parent Control Panel</span>
                        <h5 className="text-sm font-bold text-slate-900">
                          Caregiver Habit Mapping &amp; Family Media Agreement Systems
                        </h5>
                      </div>
                    </div>
                    <p className="text-xs text-slate-600 leading-relaxed">
                      Empowers parents to co-view and actively monitor developmental milestones rather than relying on strict, isolating policing. Parents can collaboratively set positive family media agreements, coordinate play sessions, and celebrate real-world offline milestones.
                    </p>
                  </div>
                </div>
              </div>

              {/* The 5 Pillars of the ECD Framework */}
              <div className="space-y-4 pt-4 border-t border-slate-200">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-black uppercase tracking-wider text-indigo-600">Pillar 2 of 2</span>
                    <h4 className="text-lg font-bold text-slate-900">The 5 Pillars of an ECD Framework</h4>
                  </div>
                  <span className="text-xs text-slate-500 font-medium hidden sm:inline">
                    International Child Growth Model
                  </span>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3">
                  {/* Pillar 1 */}
                  <div className="p-4 rounded-2xl bg-white border border-slate-200 space-y-2 shadow-2xs">
                    <div className="w-7 h-7 rounded-lg bg-blue-100 text-blue-700 flex items-center justify-center font-bold">
                      <Activity className="w-3.5 h-3.5" />
                    </div>
                    <h5 className="text-xs font-bold text-slate-900">Physical &amp; Motor</h5>
                    <p className="text-[11px] text-slate-600 leading-relaxed">
                      How kids develop muscle control. Includes <strong className="text-slate-800">gross motor skills</strong> (running, balancing) and <strong className="text-slate-800">fine motor skills</strong> (holding crayons, stacking wooden blocks).
                    </p>
                  </div>

                  {/* Pillar 2 */}
                  <div className="p-4 rounded-2xl bg-white border border-slate-200 space-y-2 shadow-2xs">
                    <div className="w-7 h-7 rounded-lg bg-rose-100 text-rose-700 flex items-center justify-center font-bold">
                      <Heart className="w-3.5 h-3.5" />
                    </div>
                    <h5 className="text-xs font-bold text-slate-900">Social &amp; Emotional</h5>
                    <p className="text-[11px] text-slate-600 leading-relaxed">
                      How children understand feelings and interact with others. Covers <strong className="text-slate-800">co-regulation</strong> (calming down with help), sharing, empathy, and making friends.
                    </p>
                  </div>

                  {/* Pillar 3 */}
                  <div className="p-4 rounded-2xl bg-white border border-slate-200 space-y-2 shadow-2xs">
                    <div className="w-7 h-7 rounded-lg bg-amber-100 text-amber-700 flex items-center justify-center font-bold">
                      <Brain className="w-3.5 h-3.5" />
                    </div>
                    <h5 className="text-xs font-bold text-slate-900">Cognitive Development</h5>
                    <p className="text-[11px] text-slate-600 leading-relaxed">
                      How the brain processes information. Includes problem-solving, imagination, memory, and exploring the 3D physical world.
                    </p>
                  </div>

                  {/* Pillar 4 */}
                  <div className="p-4 rounded-2xl bg-white border border-slate-200 space-y-2 shadow-2xs">
                    <div className="w-7 h-7 rounded-lg bg-emerald-100 text-emerald-700 flex items-center justify-center font-bold">
                      <BookOpen className="w-3.5 h-3.5" />
                    </div>
                    <h5 className="text-xs font-bold text-slate-900">Language &amp; Literacy</h5>
                    <p className="text-[11px] text-slate-600 leading-relaxed">
                      How children communicate. Covers active listening, speaking, vocabulary, and early narrative storytelling during peer play.
                    </p>
                  </div>

                  {/* Pillar 5 */}
                  <div className="p-4 rounded-2xl bg-white border border-slate-200 space-y-2 shadow-2xs">
                    <div className="w-7 h-7 rounded-lg bg-indigo-100 text-indigo-700 flex items-center justify-center font-bold">
                      <Compass className="w-3.5 h-3.5" />
                    </div>
                    <h5 className="text-xs font-bold text-slate-900">Approaches to Learning</h5>
                    <p className="text-[11px] text-slate-600 leading-relaxed">
                      A child's natural curiosity, persistence, and focus when tackling new real-world activities without algorithmic distraction.
                    </p>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* TAB 2: OUR MISSION & STORY */}
          {activeTab === 'mission' && (
            <div className="space-y-6 max-w-3xl mx-auto">
              <div className="space-y-3">
                <span className="text-[11px] font-bold uppercase tracking-wider text-emerald-600 bg-emerald-50 px-3 py-1 rounded-full border border-emerald-100">
                  Our Founding Story
                </span>
                <h3 className="text-xl sm:text-2xl font-bold text-slate-900">
                  Reviving Screen-Free, Safe Neighborhood Play Across India
                </h3>
                <p className="text-xs sm:text-sm text-slate-600 leading-relaxed">
                  In today's fast-paced urban landscape, parents face a paradox: children spend hours on smartphones and tablets, while the nearest park or society playground feels disconnected from trusted peers.
                </p>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="p-4 rounded-2xl bg-indigo-50/60 border border-indigo-100 space-y-2">
                  <div className="w-8 h-8 rounded-xl bg-indigo-600 text-white flex items-center justify-center font-bold text-sm">
                    1
                  </div>
                  <h4 className="text-sm font-bold text-slate-900">Neighborhood Playmate Radar</h4>
                  <p className="text-xs text-slate-600 leading-relaxed">
                    Connect your children with age-matched peers within a 500m to 5km radius for badminton, cycling, cricket, and weekend science clubs.
                  </p>
                </div>

                <div className="p-4 rounded-2xl bg-emerald-50/60 border border-emerald-100 space-y-2">
                  <div className="w-8 h-8 rounded-xl bg-emerald-600 text-white flex items-center justify-center font-bold text-sm">
                    2
                  </div>
                  <h4 className="text-sm font-bold text-slate-900">100% DigiLocker Verified</h4>
                  <p className="text-xs text-slate-600 leading-relaxed">
                    Every parent, daycare specialist, and activity coach undergoes government ID verification. No anonymous profiles or bots.
                  </p>
                </div>

                <div className="p-4 rounded-2xl bg-amber-50/60 border border-amber-100 space-y-2">
                  <div className="w-8 h-8 rounded-xl bg-amber-600 text-white flex items-center justify-center font-bold text-sm">
                    3
                  </div>
                  <h4 className="text-sm font-bold text-slate-900">Curated Safe Kids Commerce</h4>
                  <p className="text-xs text-slate-600 leading-relaxed">
                    Non-toxic, BIS-certified wooden toys, STEM kits, and sustainable children's goods with transparent pricing and verified buyer protection.
                  </p>
                </div>

                <div className="p-4 rounded-2xl bg-rose-50/60 border border-rose-100 space-y-2">
                  <div className="w-8 h-8 rounded-xl bg-rose-600 text-white flex items-center justify-center font-bold text-sm">
                    4
                  </div>
                  <h4 className="text-sm font-bold text-slate-900">15-Min Emergency SOS &amp; Care</h4>
                  <p className="text-xs text-slate-600 leading-relaxed">
                    Integrated panic safety assistance, verified pediatric emergency contacts, and safe community babysitting handshakes.
                  </p>
                </div>
              </div>
            </div>
          )}

          {/* TAB 3: SAFETY, TRUST & LEGAL */}
          {activeTab === 'compliance' && (
            <div className="space-y-6 max-w-3xl mx-auto">
              <div className="space-y-3">
                <span className="text-[11px] font-bold uppercase tracking-wider text-rose-600 bg-rose-50 px-3 py-1 rounded-full border border-rose-100">
                  Trust &amp; Regulatory Compliance
                </span>
                <h3 className="text-xl sm:text-2xl font-bold text-slate-900">
                  Built to the Highest Standards of Indian &amp; Global Child Protection
                </h3>
                <p className="text-xs sm:text-sm text-slate-600 leading-relaxed">
                  Vernunt is engineered under the direct oversight of our Finance &amp; Compliance Head (Niranjan Kumar, CA) to uphold strict Indian data protection and child safety laws.
                </p>
              </div>

              <div className="space-y-3 text-xs text-slate-700">
                <div className="p-4 rounded-xl border border-slate-200 bg-white flex items-start gap-3">
                  <ShieldCheck className="w-5 h-5 text-emerald-600 shrink-0 mt-0.5" />
                  <div>
                    <h5 className="font-bold text-slate-900">DPDP Act 2023 Full Adherence</h5>
                    <p className="text-slate-600 leading-relaxed mt-1">
                      Vernunt strictly prohibits behavioral tracking, targeted advertising, or data reselling involving minors. Parental consent is cryptographically bound and revocable at any time.
                    </p>
                  </div>
                </div>

                <div className="p-4 rounded-xl border border-slate-200 bg-white flex items-start gap-3">
                  <Lock className="w-5 h-5 text-indigo-600 shrink-0 mt-0.5" />
                  <div>
                    <h5 className="font-bold text-slate-900">Zero-Knowledge Contact Ghosting</h5>
                    <p className="text-slate-600 leading-relaxed mt-1">
                      Parent phone numbers and precise home addresses are never exposed publicly. Mutual encrypted handshakes are required before any meetup coordination.
                    </p>
                  </div>
                </div>

                <div className="p-4 rounded-xl border border-slate-200 bg-white flex items-start gap-3">
                  <FileCheck2 className="w-5 h-5 text-amber-600 shrink-0 mt-0.5" />
                  <div>
                    <h5 className="font-bold text-slate-900">Escrow &amp; Merchant Settlement Integrity</h5>
                    <p className="text-slate-600 leading-relaxed mt-1">
                      All marketplace orders and daycare reservations are held in regulatory-compliant escrow accounts until successful verification and delivery.
                    </p>
                  </div>
                </div>
              </div>
            </div>
          )}

        </div>

        {/* Footer */}
        <div className="px-6 py-4 bg-slate-50 border-t border-slate-200/80 flex flex-col sm:flex-row items-center justify-between gap-3 text-xs text-slate-500 shrink-0">
          <div className="flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
            <span>Bengaluru HQ &bull; Vernunt Community Operations Active</span>
          </div>
          <div className="flex items-center gap-3">
            {onOpenSafetyCompliance && (
              <button
                type="button"
                onClick={() => {
                  onClose();
                  onOpenSafetyCompliance();
                }}
                className="text-slate-700 hover:text-indigo-600 font-semibold cursor-pointer underline"
              >
                Child Safety Policy
              </button>
            )}
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 bg-slate-900 hover:bg-slate-800 text-white font-bold rounded-xl transition cursor-pointer"
            >
              Close
            </button>
          </div>
        </div>
      </div>

      {/* DETAIL MODAL FOR INDIVIDUAL MEMBER */}
      {selectedMember && (
        <div 
          className="fixed inset-0 z-60 bg-slate-950/80 backdrop-blur-md flex items-center justify-center p-3 sm:p-6 animate-fadeIn"
          onClick={() => setSelectedMember(null)}
        >
          <div 
            className="bg-white rounded-3xl w-full max-w-2xl shadow-2xl overflow-hidden border border-slate-100 max-h-[90vh] flex flex-col"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Modal Header */}
            <div className="p-5 sm:p-6 bg-gradient-to-r from-slate-900 to-indigo-950 text-white flex items-start justify-between">
              <div className="flex items-center gap-4">
                <img
                  src={selectedMember.photoUrl}
                  alt={selectedMember.name}
                  className="w-16 h-16 sm:w-20 sm:h-20 rounded-2xl object-cover object-top border-2 border-white/20 shadow-lg"
                  onError={(e) => {
                    (e.target as HTMLImageElement).src = `https://ui-avatars.com/api/?name=${encodeURIComponent(selectedMember.name)}&background=4F46E5&color=fff&size=512`;
                  }}
                />
                <div className="space-y-1">
                  <span className="px-2.5 py-0.5 rounded-full bg-indigo-500/30 text-indigo-200 text-[10px] font-bold border border-indigo-400/30">
                    {selectedMember.titleBadge}
                  </span>
                  <h3 className="text-xl sm:text-2xl font-bold text-white">
                    {selectedMember.name}
                  </h3>
                  <p className="text-xs sm:text-sm text-indigo-300 font-medium">
                    {selectedMember.role}
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setSelectedMember(null)}
                className="p-2 rounded-full bg-white/10 hover:bg-white/20 text-white transition cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Modal Body */}
            <div className="p-6 overflow-y-auto space-y-5 text-slate-700">
              
              {/* Meta Stats Bar */}
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-2.5 bg-slate-50 p-3 rounded-2xl border border-slate-200/80 text-xs">
                <div>
                  <span className="block text-[10px] text-slate-400 font-bold uppercase">Experience</span>
                  <span className="font-bold text-slate-800">{selectedMember.experienceYears}+ Years</span>
                </div>
                <div>
                  <span className="block text-[10px] text-slate-400 font-bold uppercase">Base Location</span>
                  <span className="font-bold text-slate-800">Bengaluru, IN</span>
                </div>
                <div className="col-span-2 sm:col-span-1">
                  <span className="block text-[10px] text-slate-400 font-bold uppercase">Education / Credential</span>
                  <span className="font-bold text-slate-800 truncate block">{selectedMember.education}</span>
                </div>
              </div>

              {/* Attractive, easy-to-read paragraphs */}
              <div className="space-y-3">
                <h4 className="text-xs font-bold uppercase tracking-wider text-slate-900 border-b border-slate-200 pb-1.5 flex items-center gap-1.5">
                  <Award className="w-4 h-4 text-indigo-600" />
                  <span>Executive Bio &amp; Leadership Focus</span>
                </h4>
                {selectedMember.detailedParagraphs.map((para, i) => (
                  <p key={i} className="text-xs sm:text-sm text-slate-700 leading-relaxed font-normal">
                    {para}
                  </p>
                ))}
              </div>

              {/* Core Competencies */}
              <div className="space-y-2.5 pt-2">
                <h4 className="text-xs font-bold uppercase tracking-wider text-slate-900 flex items-center gap-1.5">
                  <Briefcase className="w-4 h-4 text-indigo-600" />
                  <span>Key Domain Strengths &amp; Governance</span>
                </h4>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs">
                  {selectedMember.coreCompetencies.map((comp, i) => (
                    <div key={i} className="flex items-center gap-2 p-2 rounded-xl bg-slate-50 border border-slate-100">
                      <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                      <span className="text-slate-800 font-medium">{comp}</span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Verified Trust Badges */}
              <div className="pt-2">
                <div className="flex flex-wrap gap-2">
                  {selectedMember.verifiedBadges.map((b, i) => (
                    <span
                      key={i}
                      className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-emerald-50 text-emerald-800 border border-emerald-200 text-xs font-semibold"
                    >
                      <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" />
                      <span>{b}</span>
                    </span>
                  ))}
                </div>
              </div>

            </div>

            {/* Modal Bottom CTA */}
            <div className="p-4 bg-slate-50 border-t border-slate-200 flex items-center justify-between gap-3 text-xs">
              <span className="text-slate-500 text-[11px]">
                Vernunt Executive Board &bull; Bengaluru
              </span>
              <button
                type="button"
                onClick={() => setSelectedMember(null)}
                className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white font-bold rounded-xl transition cursor-pointer"
              >
                Back to Team Overview
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
