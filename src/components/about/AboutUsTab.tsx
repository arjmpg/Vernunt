import {
  ShieldCheck,
  Award,
  Briefcase,
  GraduationCap,
  MapPin,
  Heart,
  Sparkles,
  CheckCircle2,
  Building2,
  Lock,
  FileCheck2,
  Users,
  ArrowRight,
  Compass,
  PhoneCall,
  Activity,
  Brain,
  Trees,
  Smile,
  BookOpen,
  Footprints,
  Clock,
  Eye,
  SlidersHorizontal,
  Layers,
  Baby
} from 'lucide-react';
import { LEADERSHIP_TEAM, TeamMember } from './AboutUsModal';

interface AboutUsTabProps {
  onOpenSafetyCompliance?: () => void;
  onOpenContactUs?: () => void;
}

export const AboutUsTab: React.FC<AboutUsTabProps> = ({
  onOpenSafetyCompliance,
  onOpenContactUs
}) => {
  const [selectedMember, setSelectedMember] = useState<TeamMember | null>(null);

  return (
    <div className="space-y-12 animate-fadeIn pb-12">
      {/* Hero Header */}
      <div className="relative rounded-3xl overflow-hidden bg-gradient-to-br from-slate-950 via-indigo-950 to-slate-900 text-white p-6 sm:p-10 shadow-xl border border-white/10">
        <div className="max-w-3xl space-y-4">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/10 text-indigo-300 text-xs font-semibold backdrop-blur-md border border-white/15">
            <Sparkles className="w-3.5 h-3.5 text-indigo-400" />
            <span>India's 1st Verified Neighborhood Kids Ecosystem</span>
          </div>

          <h1 className="text-2xl sm:text-4xl font-extrabold tracking-tight text-white leading-tight">
            Building Trusted Neighborhoods for India's Next Generation
          </h1>

          <p className="text-sm sm:text-base text-slate-300 leading-relaxed font-normal">
            Vernunt connects verified parents, pediatric specialists, certified daycares, and local sports playmates within a safe walking radius. Founded in Bengaluru, we are driven by the belief that every child deserves active, outdoor playmates without safety compromises.
          </p>

          <div className="flex flex-wrap items-center gap-3 pt-2 text-xs">
            <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-white/10 backdrop-blur-md border border-white/10">
              <ShieldCheck className="w-4 h-4 text-emerald-400" />
              <span>DigiLocker Govt ID Verification</span>
            </div>
            <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-white/10 backdrop-blur-md border border-white/10">
              <Lock className="w-4 h-4 text-indigo-400" />
              <span>DPDP Act 2023 Child Privacy Compliant</span>
            </div>
            <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-white/10 backdrop-blur-md border border-white/10">
              <Building2 className="w-4 h-4 text-amber-400" />
              <span>Bengaluru Headquarters &bull; Pan-India Reach</span>
            </div>
          </div>
        </div>
      </div>

      {/* ========================================================================= */}
      {/* EARLY CHILDHOOD DEVELOPMENT (ECD) SCIENCE & PEDIATRIC FRAMEWORK SECTION   */}
      {/* ========================================================================= */}
      <section id="ecd-framework" className="space-y-8 bg-gradient-to-b from-indigo-50/70 via-slate-50 to-white rounded-3xl p-6 sm:p-10 border border-indigo-100 shadow-sm">
        {/* Section Header */}
        <div className="max-w-3xl space-y-3">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-indigo-100 text-indigo-800 text-xs font-bold border border-indigo-200">
            <Baby className="w-4 h-4 text-indigo-600" />
            <span>Pediatric Science &amp; Child Growth</span>
          </div>
          <h2 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight">
            How Vernunt Empowers Early Childhood Development (ECD)
          </h2>
          <p className="text-sm text-slate-600 leading-relaxed">
            During early childhood (ages 0 to 8), a child's brain forms over 1 million new neural connections every second. World Health Organization (WHO) and pediatric guidelines consistently show that excessive passive screen time crowds out sensory exploration, face-to-face language exchanges, and gross motor exercise. Vernunt is purposefully engineered to reverse this trend by bridging digital discovery with tangible, outdoor neighborhood reality.
          </p>
        </div>

        {/* 4 PEDIATRIC IMPACT PILLARS */}
        <div>
          <div className="flex items-center gap-2 mb-4">
            <span className="text-xs font-black uppercase tracking-wider text-slate-400">Pillar 1 of 2</span>
            <span className="text-sm font-bold text-slate-800">The 4 Pediatric Pillars of Vernunt</span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
            {/* 1. Reduces Screen Time */}
            <div className="bg-white p-6 rounded-2xl border border-slate-200/90 shadow-sm hover:shadow-md transition space-y-3">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-rose-50 text-rose-600 flex items-center justify-center font-bold">
                  <Clock className="w-5 h-5" />
                </div>
                <div>
                  <span className="text-[11px] font-bold uppercase tracking-wider text-rose-600">Screen Time Reduction</span>
                  <h3 className="text-base font-bold text-slate-900">
                    Mitigation of Passive Sedentary Behavior &amp; Cognitive Crowding Out
                  </h3>
                </div>
              </div>
              <p className="text-xs text-slate-600 leading-relaxed">
                Directly addresses <strong className="text-slate-800">World Health Organization (WHO)</strong> and pediatric guidelines by actively substituting passive media exposure with physical reality. Screens overstimulate rapid visual dopamine loops while depriving toddlers of bodily movement; Vernunt redirects child energy into multi-sensory physical environments.
              </p>
              <div className="pt-2 flex items-center gap-2 text-[11px] font-semibold text-rose-700 bg-rose-50/60 px-3 py-1.5 rounded-lg border border-rose-100">
                <CheckCircle2 className="w-3.5 h-3.5" />
                <span>WHO Guideline Compliant: Replaces sedentary screen hours with active play</span>
              </div>
            </div>

            {/* 2. Connects Kids for Play Time */}
            <div className="bg-white p-6 rounded-2xl border border-slate-200/90 shadow-sm hover:shadow-md transition space-y-3">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-indigo-50 text-indigo-600 flex items-center justify-center font-bold">
                  <Smile className="w-5 h-5" />
                </div>
                <div>
                  <span className="text-[11px] font-bold uppercase tracking-wider text-indigo-600">Peer Socialization</span>
                  <h3 className="text-base font-bold text-slate-900">
                    Peer-to-Peer Prosocial Socialization &amp; Peer-Led Co-Regulation
                  </h3>
                </div>
              </div>
              <p className="text-xs text-slate-600 leading-relaxed">
                Builds essential non-cognitive life skills like turn-taking, empathetic communication, active listening, and peer conflict resolution. Through real-world playdates, children practice <strong className="text-slate-800">co-regulation</strong>—learning how to calm down, negotiate rules, share toys, and read subtle emotional micro-expressions.
              </p>
              <div className="pt-2 flex items-center gap-2 text-[11px] font-semibold text-indigo-700 bg-indigo-50/60 px-3 py-1.5 rounded-lg border border-indigo-100">
                <CheckCircle2 className="w-3.5 h-3.5" />
                <span>Emotional Resilience: Fosters peer-led self-regulation and lifelong empathy</span>
              </div>
            </div>

            {/* 3. Finds Outdoor Activities */}
            <div className="bg-white p-6 rounded-2xl border border-slate-200/90 shadow-sm hover:shadow-md transition space-y-3">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center font-bold">
                  <Trees className="w-5 h-5" />
                </div>
                <div>
                  <span className="text-[11px] font-bold uppercase tracking-wider text-emerald-600">Outdoor Exploration</span>
                  <h3 className="text-base font-bold text-slate-900">
                    Gross Motor Skill Acquisition &amp; Nature-Based Experiential Learning
                  </h3>
                </div>
              </div>
              <p className="text-xs text-slate-600 leading-relaxed">
                Moving freely outdoors in neighborhood parks stimulates <strong className="text-slate-800">vestibulo-ocular and sensory-rich neural pathways</strong> that screens cannot replicate. Climbing playground ropes, sprinting across natural grass, and balancing on park benches develops spatial proprioception, hand-eye coordination, and protects eyesight against early myopia.
              </p>
              <div className="pt-2 flex items-center gap-2 text-[11px] font-semibold text-emerald-700 bg-emerald-50/60 px-3 py-1.5 rounded-lg border border-emerald-100">
                <CheckCircle2 className="w-3.5 h-3.5" />
                <span>Sensory Integration: Activates deep vestibular balance and spatial awareness</span>
              </div>
            </div>

            {/* 4. Parent Control Panel */}
            <div className="bg-white p-6 rounded-2xl border border-slate-200/90 shadow-sm hover:shadow-md transition space-y-3">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-amber-50 text-amber-600 flex items-center justify-center font-bold">
                  <SlidersHorizontal className="w-5 h-5" />
                </div>
                <div>
                  <span className="text-[11px] font-bold uppercase tracking-wider text-amber-600">Caregiver Enablement</span>
                  <h3 className="text-base font-bold text-slate-900">
                    Caregiver Habit Mapping &amp; Family Media Agreement Systems
                  </h3>
                </div>
              </div>
              <p className="text-xs text-slate-600 leading-relaxed">
                Empowers parents to co-view, establish shared screen boundaries, and actively monitor developmental milestones rather than relying on strict, isolating policing. Families build sustainable daily play habits, celebrate offline achievements, and coordinate safe play dates with verified neighborhood guardians.
              </p>
              <div className="pt-2 flex items-center gap-2 text-[11px] font-semibold text-amber-700 bg-amber-50/60 px-3 py-1.5 rounded-lg border border-amber-100">
                <CheckCircle2 className="w-3.5 h-3.5" />
                <span>Family Collaboration: Constructive milestone tracking over restrictive surveillance</span>
              </div>
            </div>
          </div>
        </div>

        {/* THE 5 PILLARS OF AN ECD FRAMEWORK */}
        <div className="pt-4 border-t border-slate-200/80 space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
            <div>
              <span className="text-xs font-black uppercase tracking-wider text-indigo-600">Pillar 2 of 2</span>
              <h3 className="text-xl font-bold text-slate-900">
                The 5 Pillars of the Early Childhood Development (ECD) Framework
              </h3>
            </div>
            <span className="text-xs text-slate-500 font-medium">
              Aligned with global pediatric &amp; developmental benchmarks
            </span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
            {/* 1. Physical & Motor Development */}
            <div className="bg-white p-5 rounded-2xl border border-slate-200 flex flex-col justify-between space-y-3">
              <div className="space-y-2">
                <div className="w-8 h-8 rounded-lg bg-blue-100 text-blue-700 flex items-center justify-center font-bold">
                  <Activity className="w-4 h-4" />
                </div>
                <h4 className="text-sm font-bold text-slate-900">
                  1. Physical &amp; Motor Development
                </h4>
                <p className="text-xs text-slate-600 leading-relaxed">
                  How kids develop muscle control. Includes <strong className="text-slate-800">gross motor skills</strong> (running, climbing, balancing) and <strong className="text-slate-800">fine motor skills</strong> (holding a crayon, buttoning, manipulating wooden toys).
                </p>
              </div>
              <div className="text-[11px] font-semibold text-blue-800 bg-blue-50 p-2 rounded-lg border border-blue-100">
                <strong>Vernunt Action:</strong> Bangalore park exploration + Montessori non-plastic wooden toys.
              </div>
            </div>

            {/* 2. Social & Emotional Development */}
            <div className="bg-white p-5 rounded-2xl border border-slate-200 flex flex-col justify-between space-y-3">
              <div className="space-y-2">
                <div className="w-8 h-8 rounded-lg bg-rose-100 text-rose-700 flex items-center justify-center font-bold">
                  <Heart className="w-4 h-4" />
                </div>
                <h4 className="text-sm font-bold text-slate-900">
                  2. Social &amp; Emotional Development
                </h4>
                <p className="text-xs text-slate-600 leading-relaxed">
                  How children understand feelings and interact with others. Covers <strong className="text-slate-800">co-regulation</strong> (calming down with help), sharing, empathy, and making trusted friends.
                </p>
              </div>
              <div className="text-[11px] font-semibold text-rose-800 bg-rose-50 p-2 rounded-lg border border-rose-100">
                <strong>Vernunt Action:</strong> Verified neighborhood parent matching for safe recurring playdates.
              </div>
            </div>

            {/* 3. Cognitive Development */}
            <div className="bg-white p-5 rounded-2xl border border-slate-200 flex flex-col justify-between space-y-3">
              <div className="space-y-2">
                <div className="w-8 h-8 rounded-lg bg-amber-100 text-amber-700 flex items-center justify-center font-bold">
                  <Brain className="w-4 h-4" />
                </div>
                <h4 className="text-sm font-bold text-slate-900">
                  3. Cognitive Development
                </h4>
                <p className="text-xs text-slate-600 leading-relaxed">
                  How the brain processes information. Encompasses creative problem-solving, spatial imagination, working memory, and tactile exploration of the physical world.
                </p>
              </div>
              <div className="text-[11px] font-semibold text-amber-800 bg-amber-50 p-2 rounded-lg border border-amber-100">
                <strong>Vernunt Action:</strong> Free-form outdoor play that stimulates bilateral brain integration.
              </div>
            </div>

            {/* 4. Language & Literacy Development */}
            <div className="bg-white p-5 rounded-2xl border border-slate-200 flex flex-col justify-between space-y-3">
              <div className="space-y-2">
                <div className="w-8 h-8 rounded-lg bg-emerald-100 text-emerald-700 flex items-center justify-center font-bold">
                  <BookOpen className="w-4 h-4" />
                </div>
                <h4 className="text-sm font-bold text-slate-900">
                  4. Language &amp; Literacy Development
                </h4>
                <p className="text-xs text-slate-600 leading-relaxed">
                  How children communicate. Covers active listening, spoken vocabulary, expressive phrasing, and narrative storytelling through social peer pretend-play.
                </p>
              </div>
              <div className="text-[11px] font-semibold text-emerald-800 bg-emerald-50 p-2 rounded-lg border border-emerald-100">
                <strong>Vernunt Action:</strong> Real dialogue during group games expands vocabulary 3x faster than video.
              </div>
            </div>

            {/* 5. Approaches to Learning */}
            <div className="bg-white p-5 rounded-2xl border border-slate-200 flex flex-col justify-between space-y-3">
              <div className="space-y-2">
                <div className="w-8 h-8 rounded-lg bg-indigo-100 text-indigo-700 flex items-center justify-center font-bold">
                  <Compass className="w-4 h-4" />
                </div>
                <h4 className="text-sm font-bold text-slate-900">
                  5. Approaches to Learning
                </h4>
                <p className="text-xs text-slate-600 leading-relaxed">
                  A child’s natural curiosity, emotional persistence, resilience when falling down, and sustained focus when tackling new real-world activities.
                </p>
              </div>
              <div className="text-[11px] font-semibold text-indigo-800 bg-indigo-50 p-2 rounded-lg border border-indigo-100">
                <strong>Vernunt Action:</strong> Curiosity-driven outdoor challenges free from algorithm dopamine loops.
              </div>
            </div>
          </div>
        </div>

        {/* Tangible O2O Summary Banner */}
        <div className="bg-gradient-to-r from-indigo-900 via-slate-900 to-indigo-950 text-white rounded-2xl p-5 sm:p-6 flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="space-y-1 text-center sm:text-left">
            <h4 className="text-base font-bold text-white flex items-center justify-center sm:justify-start gap-2">
              <Sparkles className="w-4 h-4 text-amber-300" />
              <span>Why Vernunt Matters for Early Childhood Development</span>
            </h4>
            <p className="text-xs text-slate-300 max-w-2xl leading-relaxed">
              Vernunt is not just a directory—it is a preventative pediatric intervention. By replacing screen isolation with neighborhood play dates, Bangalore nature parks, and sustainable non-plastic wooden toys, we give children the sensory, social, and motor foundation required for lifelong health.
            </p>
          </div>
          <a
            href="#leadership"
            className="px-4 py-2 rounded-xl bg-white text-slate-900 text-xs font-bold hover:bg-slate-100 transition shrink-0 cursor-pointer"
          >
            Meet the Team &darr;
          </a>
        </div>
      </section>

      {/* LEADERSHIP & OUR TEAM SECTION */}
      <section id="leadership" className="space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 border-b border-slate-200 pb-4">
          <div>
            <span className="text-xs font-bold uppercase tracking-wider text-indigo-600 bg-indigo-50 px-3 py-1 rounded-full border border-indigo-100">
              Meet Our Leadership Team
            </span>
            <h2 className="text-2xl sm:text-3xl font-extrabold text-slate-900 mt-2">
              Visionary Leadership &amp; Governance
            </h2>
            <p className="text-xs sm:text-sm text-slate-600 mt-1">
              Guided by top-tier investment banking, Chartered Accountancy audit mastery, and 15+ years of retail marketing excellence.
            </p>
          </div>
          <div className="flex items-center gap-2">
            <span className="text-xs font-semibold text-slate-500">
              3 Senior Executives &bull; Bengaluru HQ
            </span>
          </div>
        </div>

        {/* 3 Executive Cards Grid */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 sm:gap-8 items-stretch">
          {LEADERSHIP_TEAM.map((member) => (
            <div
              key={member.id}
              className="bg-white rounded-3xl border border-slate-200/90 shadow-sm hover:shadow-xl transition-all duration-300 flex flex-col overflow-hidden group hover:border-indigo-300"
            >
              {/* Photo Banner with subtle zoom */}
              <div className="relative aspect-[4/5] bg-slate-100 overflow-hidden">
                <img
                  src={member.photoUrl}
                  alt={member.name}
                  className="w-full h-full object-cover object-top transition duration-500 group-hover:scale-105"
                  onError={(e) => {
                    (e.target as HTMLImageElement).src = `https://ui-avatars.com/api/?name=${encodeURIComponent(member.name)}&background=4F46E5&color=fff&size=512`;
                  }}
                />
                <div className="absolute inset-0 bg-gradient-to-t from-slate-950/85 via-slate-950/20 to-transparent" />
                
                {/* Overlay Text */}
                <div className="absolute bottom-4 left-4 right-4 text-white">
                  <div className="inline-block px-2.5 py-1 rounded-lg bg-white/20 backdrop-blur-md text-[11px] font-semibold text-white mb-1.5 border border-white/20">
                    {member.titleBadge}
                  </div>
                  <h3 className="text-xl font-bold text-white tracking-tight">
                    {member.name}
                  </h3>
                  <p className="text-xs text-indigo-200 font-medium mt-0.5">
                    {member.role}
                  </p>
                </div>

                {/* Top Badge */}
                <div className="absolute top-3 right-3">
                  <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-emerald-500/95 text-white text-[11px] font-bold shadow-md backdrop-blur-sm">
                    <CheckCircle2 className="w-3.5 h-3.5" />
                    <span>Verified</span>
                  </span>
                </div>
              </div>

              {/* Bio & Details */}
              <div className="p-5 sm:p-6 flex-1 flex flex-col justify-between space-y-5">
                
                {/* Meta details */}
                <div className="space-y-3">
                  <div className="flex items-center gap-2 text-xs text-slate-500">
                    <MapPin className="w-4 h-4 text-rose-500 shrink-0" />
                    <span>{member.location}</span>
                  </div>

                  <div className="flex items-center gap-2 text-xs font-semibold text-slate-800">
                    <GraduationCap className="w-4 h-4 text-indigo-600 shrink-0" />
                    <span>{member.education}</span>
                  </div>

                  {/* Attractive, easy-to-read bio paragraphs */}
                  <div className="space-y-2 pt-2 border-t border-slate-100">
                    {member.detailedParagraphs.map((paragraph, pIdx) => (
                      <p key={pIdx} className="text-xs text-slate-600 leading-relaxed font-normal">
                        {paragraph}
                      </p>
                    ))}
                  </div>
                </div>

                {/* Key competencies tags */}
                <div className="space-y-2 pt-3 border-t border-slate-100">
                  <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
                    Core Specializations &amp; Leadership
                  </span>
                  <div className="flex flex-wrap gap-1.5">
                    {member.coreCompetencies.map((comp, idx) => (
                      <span
                        key={idx}
                        className="px-2.5 py-1 rounded-lg bg-indigo-50/70 text-indigo-900 text-[11px] font-medium border border-indigo-100"
                      >
                        {comp}
                      </span>
                    ))}
                  </div>
                </div>

                {/* Verified credentials badge row */}
                <div className="flex flex-wrap gap-1.5 pt-1">
                  {member.verifiedBadges.map((badge, bIdx) => (
                    <span
                      key={bIdx}
                      className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-emerald-50 text-emerald-800 text-[10px] font-semibold border border-emerald-200"
                    >
                      <ShieldCheck className="w-3 h-3 text-emerald-600" />
                      <span>{badge}</span>
                    </span>
                  ))}
                </div>

              </div>
            </div>
          ))}
        </div>
      </section>

      {/* Vernunt Values & Safety Pillar Section */}
      <section className="bg-slate-50 rounded-3xl p-6 sm:p-10 border border-slate-200/80 space-y-6">
        <div className="text-center max-w-2xl mx-auto space-y-2">
          <span className="text-xs font-bold uppercase tracking-wider text-emerald-600 bg-emerald-50 px-3 py-1 rounded-full border border-emerald-100">
            Our Core Pillars
          </span>
          <h3 className="text-2xl font-bold text-slate-900">
            Why Indian Families Trust Vernunt
          </h3>
          <p className="text-xs sm:text-sm text-slate-600">
            Engineered from ground up with parent peace-of-mind, cryptographic child identity protection, and real-world neighborhood camaraderie.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 pt-2">
          <div className="bg-white p-5 rounded-2xl border border-slate-200 space-y-3 shadow-sm">
            <div className="w-10 h-10 rounded-xl bg-indigo-100 text-indigo-600 flex items-center justify-center font-bold">
              <ShieldCheck className="w-5 h-5" />
            </div>
            <h4 className="text-sm font-bold text-slate-900">Zero Anonymous Profiles</h4>
            <p className="text-xs text-slate-600 leading-relaxed">
              Every parent profile connects through Aadhaar/DigiLocker identity attestation. Verified badge guarantees you are speaking with a real neighborhood parent.
            </p>
          </div>

          <div className="bg-white p-5 rounded-2xl border border-slate-200 space-y-3 shadow-sm">
            <div className="w-10 h-10 rounded-xl bg-emerald-100 text-emerald-600 flex items-center justify-center font-bold">
              <Lock className="w-5 h-5" />
            </div>
            <h4 className="text-sm font-bold text-slate-900">DPDP Act 2023 Compliance</h4>
            <p className="text-xs text-slate-600 leading-relaxed">
              Strict compliance with India’s Digital Personal Data Protection Act. We never sell contact information, display phone numbers publicly, or run ad trackers.
            </p>
          </div>

          <div className="bg-white p-5 rounded-2xl border border-slate-200 space-y-3 shadow-sm">
            <div className="w-10 h-10 rounded-xl bg-amber-100 text-amber-600 flex items-center justify-center font-bold">
              <FileCheck2 className="w-5 h-5" />
            </div>
            <h4 className="text-sm font-bold text-slate-900">Escrow-Backed Commerce</h4>
            <p className="text-xs text-slate-600 leading-relaxed">
              Curated, non-toxic toys and certified kids’ essentials. Buyer funds stay protected in compliance escrow until items arrive verified and safe.
            </p>
          </div>
        </div>
      </section>

      {/* Contact & Support Section */}
      <div className="bg-gradient-to-r from-indigo-900 via-indigo-950 to-slate-900 rounded-3xl p-6 sm:p-8 text-white flex flex-col sm:flex-row items-center justify-between gap-6">
        <div className="space-y-2 text-center sm:text-left">
          <h4 className="text-lg font-bold text-white">Have questions or want to partner with Vernunt?</h4>
          <p className="text-xs text-slate-300 max-w-xl">
            Our leadership team and child safety officers are based at our Indiranagar, Bengaluru campus and are accessible to parents, pediatricians, and certified educators.
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-3 shrink-0">
          {onOpenContactUs && (
            <button
              type="button"
              onClick={onOpenContactUs}
              className="px-5 py-2.5 rounded-xl bg-white hover:bg-slate-100 text-slate-900 text-xs font-bold transition shadow-sm cursor-pointer"
            >
              Contact Leadership
            </button>
          )}
          {onOpenSafetyCompliance && (
            <button
              type="button"
              onClick={onOpenSafetyCompliance}
              className="px-5 py-2.5 rounded-xl bg-white/10 hover:bg-white/20 text-white text-xs font-bold transition border border-white/20 cursor-pointer"
            >
              Child Safety Protocol
            </button>
          )}
        </div>
      </div>
    </div>
  );
};
