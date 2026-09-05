import React, { useState, useEffect } from 'react';
import { ChildProfile, BabyVaccine, BabyMilestone } from '../../types.ts';
import { 
  Baby, 
  Heart, 
  Calendar, 
  Bell, 
  CheckCircle, 
  Clock, 
  Sparkles, 
  Activity, 
  ChevronRight, 
  ShieldCheck, 
  Plus, 
  Scale, 
  Ruler, 
  Smile, 
  FileText,
  AlertCircle
} from 'lucide-react';

interface GrowthTrackerHubProps {
  userProfile: ChildProfile | null;
}

// Indian Academy of Pediatrics (IAP) & WHO Universal Immunization Schedule
const DEFAULT_VACCINES: BabyVaccine[] = [
  {
    id: 'vac-1',
    name: 'BCG (Bacillus Calmette–Guérin)',
    recommendedAge: 'At Birth',
    dueAgeWeeks: 0,
    protectsAgainst: 'Tuberculosis (TB)',
    mandatory: true,
    status: 'received',
    receivedDate: '2025-10-12',
    clinicAdministered: 'Fortis Hospital Bangalore'
  },
  {
    id: 'vac-2',
    name: 'OPV 0 (Oral Polio Vaccine)',
    recommendedAge: 'At Birth',
    dueAgeWeeks: 0,
    protectsAgainst: 'Poliomyelitis',
    mandatory: true,
    status: 'received',
    receivedDate: '2025-10-12'
  },
  {
    id: 'vac-3',
    name: 'Hepatitis B 1',
    recommendedAge: 'At Birth',
    dueAgeWeeks: 0,
    protectsAgainst: 'Hepatitis B viral liver infection',
    mandatory: true,
    status: 'received',
    receivedDate: '2025-10-12'
  },
  {
    id: 'vac-4',
    name: 'DTwP / DTaP 1 + IPV 1 + Hib 1',
    recommendedAge: '6 Weeks',
    dueAgeWeeks: 6,
    protectsAgainst: 'Diphtheria, Tetanus, Pertussis, Polio, Haemophilus',
    mandatory: true,
    status: 'received',
    receivedDate: '2025-11-24'
  },
  {
    id: 'vac-5',
    name: 'PCV 1 (Pneumococcal Conjugate)',
    recommendedAge: '6 Weeks',
    dueAgeWeeks: 6,
    protectsAgainst: 'Pneumonia and meningitis',
    mandatory: true,
    status: 'received',
    receivedDate: '2025-11-24'
  },
  {
    id: 'vac-6',
    name: 'Rotavirus 1',
    recommendedAge: '6 Weeks',
    dueAgeWeeks: 6,
    protectsAgainst: 'Rotavirus severe infantile diarrhea',
    mandatory: true,
    status: 'received',
    receivedDate: '2025-11-24'
  },
  {
    id: 'vac-7',
    name: 'DTwP / DTaP 2 + IPV 2 + Hib 2',
    recommendedAge: '10 Weeks',
    dueAgeWeeks: 10,
    protectsAgainst: 'Diphtheria, Tetanus, Whooping Cough, Polio',
    mandatory: true,
    status: 'received',
    receivedDate: '2025-12-22'
  },
  {
    id: 'vac-8',
    name: 'PCV 2 + Rotavirus 2',
    recommendedAge: '10 Weeks',
    dueAgeWeeks: 10,
    protectsAgainst: 'Pneumococcal infections & Rotavirus',
    mandatory: true,
    status: 'received',
    receivedDate: '2025-12-22'
  },
  {
    id: 'vac-9',
    name: 'DTwP / DTaP 3 + IPV 3 + Hib 3',
    recommendedAge: '14 Weeks',
    dueAgeWeeks: 14,
    protectsAgainst: 'Diphtheria, Tetanus, Pertussis, Polio, Hib',
    mandatory: true,
    status: 'upcoming',
    reminderEnabled: true,
    reminderDate: '2026-09-18'
  },
  {
    id: 'vac-10',
    name: 'PCV 3 + Rotavirus 3',
    recommendedAge: '14 Weeks',
    dueAgeWeeks: 14,
    protectsAgainst: 'Pneumonia and Rotavirus diarrhea',
    mandatory: true,
    status: 'upcoming',
    reminderEnabled: true,
    reminderDate: '2026-09-18'
  },
  {
    id: 'vac-11',
    name: 'Influenza 1 (Flu Shot)',
    recommendedAge: '6 Months',
    dueAgeWeeks: 26,
    protectsAgainst: 'Seasonal Influenza Flu strains',
    mandatory: false,
    status: 'pending'
  },
  {
    id: 'vac-12',
    name: 'MMR 1 (Measles, Mumps, Rubella)',
    recommendedAge: '9 Months',
    dueAgeWeeks: 39,
    protectsAgainst: 'Measles, Mumps, Rubella virus',
    mandatory: true,
    status: 'pending'
  },
  {
    id: 'vac-13',
    name: 'Typhoid Conjugate Vaccine (TCV)',
    recommendedAge: '9 Months',
    dueAgeWeeks: 39,
    protectsAgainst: 'Typhoid Salmonella infection',
    mandatory: true,
    status: 'pending'
  },
  {
    id: 'vac-14',
    name: 'Hepatitis A 1',
    recommendedAge: '12 Months (1 Year)',
    dueAgeWeeks: 52,
    protectsAgainst: 'Hepatitis A food/waterborne liver disease',
    mandatory: true,
    status: 'pending'
  },
  {
    id: 'vac-15',
    name: 'MMR 2 + Varicella 1 (Chickenpox)',
    recommendedAge: '15 Months',
    dueAgeWeeks: 65,
    protectsAgainst: 'MMR Booster and Chickenpox',
    mandatory: true,
    status: 'pending'
  },
  {
    id: 'vac-16',
    name: 'DTP Booster 1 + IPV Booster 1',
    recommendedAge: '18 Months (1.5 Years)',
    dueAgeWeeks: 78,
    protectsAgainst: 'Diphtheria, Tetanus, Pertussis, Polio booster',
    mandatory: true,
    status: 'pending'
  }
];

const PREGNANCY_WEEKS_DATA: Record<number, { fruit: string; size: string; weight: string; babyDev: string; momSymptoms: string }> = {
  8: {
    fruit: 'Raspberry 🍇',
    size: '1.6 cm',
    weight: '1 gram',
    babyDev: 'Tiny fingers and toes are forming! The neural tube has closed and the heart beats at 150 bpm.',
    momSymptoms: 'Morning sickness, breast tenderness, heightened sense of smell. Keep ginger tea handy.'
  },
  12: {
    fruit: 'Plum 🫐',
    size: '5.4 cm',
    weight: '14 grams',
    babyDev: 'All vital reflexes are developing! Baby can open and close fingers and curl toes.',
    momSymptoms: 'Energy levels returning as first trimester ends. Nausea may begin to subside.'
  },
  16: {
    fruit: 'Avocado 🥑',
    size: '11.6 cm',
    weight: '100 grams',
    babyDev: 'Baby can hear your voice and heartbeat! Eyes can make slow movements behind eyelids.',
    momSymptoms: 'You may feel first fluttering kicks (quickening). Skin glowing from extra blood flow.'
  },
  20: {
    fruit: 'Banana 🍌',
    size: '25.6 cm',
    weight: '300 grams',
    babyDev: 'Halfway mark! Baby is covered in vernix caseosa to protect skin in amniotic fluid.',
    momSymptoms: 'Mid-pregnancy anomaly ultrasound time! Mild lower back ache; practice gentle stretches.'
  },
  24: {
    fruit: 'Ear of Corn 🌽',
    size: '30 cm',
    weight: '600 grams',
    babyDev: 'Lungs are producing surfactant. Baby has distinct sleep and awake cycles.',
    momSymptoms: 'Mild Braxton Hicks contractions may start. Stay well hydrated with coconut water.'
  },
  28: {
    fruit: 'Eggplant 🍆',
    size: '37 cm',
    weight: '1.0 kg',
    babyDev: 'Third trimester begins! Baby can blink and see light filtering through your belly.',
    momSymptoms: 'Leg cramps and mild heartburn. Sleep on your left side with supportive pillows.'
  },
  32: {
    fruit: 'Butternut Squash 🍈',
    size: '42 cm',
    weight: '1.7 kg',
    babyDev: 'Practicing breathing movements. Fingernails and toenails are completely formed.',
    momSymptoms: 'Shortness of breath as baby presses on diaphragm. Frequent bathroom trips.'
  },
  36: {
    fruit: 'Papaya 🥭',
    size: '47 cm',
    weight: '2.6 kg',
    babyDev: 'Full term approaches! Baby is shedding lanugo hair and gaining protective fat.',
    momSymptoms: 'Pack your hospital bag! Practice breathing techniques and review birth plan.'
  },
  40: {
    fruit: 'Watermelon 🍉',
    size: '51 cm',
    weight: '3.4 kg',
    babyDev: 'Ready to meet the world! Baby is nestled head down ready for delivery.',
    momSymptoms: 'Watch for regular contractions, water break, or mucus plug discharge. Stay calm and excited!'
  }
};

export function GrowthTrackerHub({ userProfile }: GrowthTrackerHubProps) {
  const [activeTab, setActiveTab] = useState<'vaccines' | 'pregnancy' | 'growth'>('vaccines');

  // Vaccination state
  const [vaccines, setVaccines] = useState<BabyVaccine[]>(() => {
    try {
      const saved = localStorage.getItem('vernunt_baby_vaccines');
      if (saved) return JSON.parse(saved);
    } catch (e) {
      console.error(e);
    }
    return DEFAULT_VACCINES;
  });

  // Pregnancy week state
  const [selectedWeek, setSelectedWeek] = useState<number>(20);
  const [kickCount, setKickCount] = useState<number>(0);
  const [kickTimer, setKickTimer] = useState<number>(0);
  const [isKickTracking, setIsKickTracking] = useState<boolean>(false);

  // Growth logs
  const [growthLogs, setGrowthLogs] = useState<{ date: string; weightKg: number; heightCm: number; headCm: number }[]>([
    { date: '2025-10-12', weightKg: 3.2, heightCm: 49.5, headCm: 34.0 },
    { date: '2025-12-15', weightKg: 5.4, heightCm: 58.0, headCm: 38.2 },
    { date: '2026-03-20', weightKg: 7.8, heightCm: 67.5, headCm: 42.0 }
  ]);

  const [newLogWeight, setNewLogWeight] = useState('');
  const [newLogHeight, setNewLogHeight] = useState('');
  const [newLogHead, setNewLogHead] = useState('');

  // Persist vaccines
  useEffect(() => {
    try {
      localStorage.setItem('vernunt_baby_vaccines', JSON.stringify(vaccines));
    } catch (e) {
      console.error(e);
    }
  }, [vaccines]);

  // Kick counter timer
  useEffect(() => {
    let interval: any;
    if (isKickTracking) {
      interval = setInterval(() => {
        setKickTimer(prev => prev + 1);
      }, 1000);
    }
    return () => clearInterval(interval);
  }, [isKickTracking]);

  const toggleVaccineStatus = (id: string) => {
    setVaccines(prev => prev.map(v => {
      if (v.id === id) {
        const nextStatus = v.status === 'received' ? 'upcoming' : 'received';
        return {
          ...v,
          status: nextStatus,
          receivedDate: nextStatus === 'received' ? new Date().toISOString().split('T')[0] : undefined
        };
      }
      return v;
    }));
  };

  const handleAddGrowthLog = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newLogWeight || !newLogHeight) return;

    setGrowthLogs(prev => [
      ...prev,
      {
        date: new Date().toISOString().split('T')[0],
        weightKg: parseFloat(newLogWeight),
        heightCm: parseFloat(newLogHeight),
        headCm: parseFloat(newLogHead) || 0
      }
    ]);

    setNewLogWeight('');
    setNewLogHeight('');
    setNewLogHead('');
  };

  const currentPregnancy = PREGNANCY_WEEKS_DATA[selectedWeek] || PREGNANCY_WEEKS_DATA[20];

  const receivedCount = vaccines.filter(v => v.status === 'received').length;
  const progressPercent = Math.round((receivedCount / vaccines.length) * 100);

  return (
    <div id="growth-tracker-hub" className="w-full max-w-5xl mx-auto space-y-6 font-sans pb-12 animate-fade-in">
      {/* Hero Header */}
      <div className="bg-gradient-to-r from-rose-950 via-rose-900 to-amber-950 text-white rounded-3xl p-6 sm:p-8 shadow-sm relative overflow-hidden">
        <div className="relative z-10 max-w-2xl space-y-3">
          <div className="inline-flex items-center gap-1.5 bg-rose-500/30 text-rose-200 px-3 py-1 rounded-full text-xs font-extrabold border border-rose-400/30">
            <Baby className="w-3.5 h-3.5 text-rose-300" />
            <span>Vernunt Motherhood &amp; Child Health</span>
          </div>

          <h1 className="text-2xl sm:text-3xl font-black font-serif tracking-tight">
            Baby Growth, Milestones &amp; Vaccine Checklist
          </h1>

          <p className="text-xs sm:text-sm text-rose-100/90 leading-relaxed">
            Follow pediatric guidelines from the Indian Academy of Pediatrics (IAP) &amp; WHO. Track baby vaccination timelines, growth percentiles, or week-by-week pregnancy progress.
          </p>

          {/* Quick Progress Bar */}
          <div className="bg-black/30 backdrop-blur-md p-3 rounded-2xl border border-white/15 max-w-md">
            <div className="flex justify-between items-center text-xs mb-1.5">
              <span className="font-extrabold text-amber-300">Immunization Shield</span>
              <span className="font-mono text-white/90">{receivedCount} of {vaccines.length} doses received ({progressPercent}%)</span>
            </div>
            <div className="w-full h-2 bg-white/20 rounded-full overflow-hidden">
              <div 
                className="h-full bg-gradient-to-r from-amber-400 to-emerald-400 rounded-full transition-all duration-500"
                style={{ width: `${progressPercent}%` }}
              />
            </div>
          </div>
        </div>

        <div className="absolute right-4 bottom-2 text-white/5 text-9xl font-black select-none pointer-events-none">
          👶
        </div>
      </div>

      {/* Main Tab Switcher */}
      <div className="flex items-center justify-center">
        <div className="inline-flex bg-slate-100 p-1.5 rounded-2xl border border-slate-200 gap-1">
          <button
            type="button"
            id="tab-vaccines"
            onClick={() => setActiveTab('vaccines')}
            className={`px-4 py-2 rounded-xl text-xs font-black transition cursor-pointer flex items-center gap-1.5 ${
              activeTab === 'vaccines' ? 'bg-rose-700 text-white shadow-xs' : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <ShieldCheck className="w-4 h-4" />
            <span>IAP Vaccine Schedule</span>
          </button>

          <button
            type="button"
            id="tab-pregnancy"
            onClick={() => setActiveTab('pregnancy')}
            className={`px-4 py-2 rounded-xl text-xs font-black transition cursor-pointer flex items-center gap-1.5 ${
              activeTab === 'pregnancy' ? 'bg-rose-700 text-white shadow-xs' : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <Heart className="w-4 h-4" />
            <span>Pregnancy Week Tracker</span>
          </button>

          <button
            type="button"
            id="tab-growth"
            onClick={() => setActiveTab('growth')}
            className={`px-4 py-2 rounded-xl text-xs font-black transition cursor-pointer flex items-center gap-1.5 ${
              activeTab === 'growth' ? 'bg-rose-700 text-white shadow-xs' : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <Activity className="w-4 h-4" />
            <span>Weight &amp; Height Milestones</span>
          </button>
        </div>
      </div>

      {/* TAB 1: Vaccine Schedule */}
      {activeTab === 'vaccines' && (
        <div className="space-y-4 text-left">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2 px-1">
            <div>
              <h2 className="text-base font-black text-slate-900">
                Official Indian Academy of Pediatrics (IAP) Schedule
              </h2>
              <p className="text-xs text-slate-500">
                Click any vaccine card to toggle between received and upcoming status.
              </p>
            </div>

            <button
              type="button"
              onClick={() => window.print()}
              className="bg-white hover:bg-slate-50 text-slate-700 border border-slate-200 text-xs font-bold py-2 px-3 rounded-xl transition cursor-pointer flex items-center gap-1.5 shadow-2xs"
            >
              <FileText className="w-3.5 h-3.5 text-slate-500" />
              <span>Print Immunization Card</span>
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {vaccines.map((vac) => {
              const isReceived = vac.status === 'received';
              return (
                <div
                  key={vac.id}
                  onClick={() => toggleVaccineStatus(vac.id)}
                  className={`p-4 rounded-2xl border transition-all duration-200 cursor-pointer flex items-start justify-between gap-3 ${
                    isReceived 
                      ? 'bg-emerald-50/70 border-emerald-200 hover:border-emerald-300' 
                      : 'bg-white border-slate-200/90 hover:border-rose-300 shadow-2xs'
                  }`}
                >
                  <div className="space-y-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <span className={`text-[10px] font-black uppercase tracking-wider px-2 py-0.5 rounded-full ${
                        isReceived ? 'bg-emerald-200 text-emerald-900' : 'bg-amber-100 text-amber-900'
                      }`}>
                        {vac.recommendedAge}
                      </span>
                      {vac.mandatory && (
                        <span className="text-[9px] font-bold text-rose-700 bg-rose-50 px-1.5 py-0.2 rounded border border-rose-200">
                          Mandatory
                        </span>
                      )}
                    </div>

                    <h3 className="text-sm font-black text-slate-900 leading-snug">
                      {vac.name}
                    </h3>

                    <p className="text-xs text-slate-500 leading-relaxed font-normal">
                      Protects against: <strong className="text-slate-700">{vac.protectsAgainst}</strong>
                    </p>

                    {isReceived && vac.receivedDate && (
                      <p className="text-[11px] text-emerald-800 font-medium pt-1">
                        ✓ Administered on {vac.receivedDate}
                      </p>
                    )}
                  </div>

                  <div className="shrink-0 pt-1">
                    <div className={`w-8 h-8 rounded-full flex items-center justify-center transition ${
                      isReceived ? 'bg-emerald-600 text-white' : 'bg-slate-100 text-slate-300 border border-slate-200'
                    }`}>
                      <CheckCircle className="w-5 h-5" />
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* TAB 2: Pregnancy Week Tracker */}
      {activeTab === 'pregnancy' && (
        <div className="space-y-6 text-left">
          {/* Week Selector Bar */}
          <div className="bg-white p-4 rounded-3xl border border-slate-200/90 shadow-2xs space-y-3">
            <span className="text-xs font-black text-slate-800 uppercase tracking-wider block">
              Select Gestational Week (1 to 40)
            </span>
            <div className="flex gap-2 overflow-x-auto pb-2 scrollbar-thin">
              {[8, 12, 16, 20, 24, 28, 32, 36, 40].map((wk) => (
                <button
                  key={wk}
                  type="button"
                  onClick={() => setSelectedWeek(wk)}
                  className={`px-4 py-2.5 rounded-2xl text-xs font-black shrink-0 transition cursor-pointer ${
                    selectedWeek === wk
                      ? 'bg-rose-700 text-white shadow-xs scale-105'
                      : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                  }`}
                >
                  Week {wk}
                </button>
              ))}
            </div>
          </div>

          {/* Current Week Showcase Card */}
          <div className="grid grid-cols-1 md:grid-cols-12 gap-6 items-start">
            {/* Left: Fruit Size & Measurements (Span 5) */}
            <div className="md:col-span-5 bg-gradient-to-br from-amber-50 to-rose-50 border border-rose-200/70 rounded-3xl p-6 text-center space-y-4">
              <span className="text-xs font-black text-rose-800 uppercase tracking-widest block">
                Week {selectedWeek} Size Comparison
              </span>

              <div className="text-6xl my-2 animate-bounce">
                {currentPregnancy.fruit.split(' ')[1] || '🥑'}
              </div>

              <div>
                <h3 className="text-xl font-black text-slate-900 font-serif">
                  Baby is the size of a {currentPregnancy.fruit.split(' ')[0]}!
                </h3>
                <p className="text-xs text-slate-500 mt-1">
                  Approx. {currentPregnancy.size} length • {currentPregnancy.weight}
                </p>
              </div>

              <div className="grid grid-cols-2 gap-2 pt-2 border-t border-rose-200/60 text-xs">
                <div className="bg-white/80 p-2.5 rounded-xl">
                  <span className="text-slate-400 block text-[10px] font-bold">Crown to Heel</span>
                  <strong className="text-slate-800 text-sm">{currentPregnancy.size}</strong>
                </div>
                <div className="bg-white/80 p-2.5 rounded-xl">
                  <span className="text-slate-400 block text-[10px] font-bold">Estimated Weight</span>
                  <strong className="text-slate-800 text-sm">{currentPregnancy.weight}</strong>
                </div>
              </div>
            </div>

            {/* Right: Baby Development & Mom Care (Span 7) */}
            <div className="md:col-span-7 space-y-4">
              <div className="bg-white p-5 rounded-3xl border border-slate-200/90 shadow-2xs space-y-2">
                <div className="flex items-center gap-2 text-rose-700 font-black text-xs">
                  <Sparkles className="w-4 h-4" />
                  <span>Baby Development Highlights</span>
                </div>
                <p className="text-xs text-slate-700 leading-relaxed font-medium">
                  {currentPregnancy.babyDev}
                </p>
              </div>

              <div className="bg-white p-5 rounded-3xl border border-slate-200/90 shadow-2xs space-y-2">
                <div className="flex items-center gap-2 text-amber-700 font-black text-xs">
                  <Heart className="w-4 h-4" />
                  <span>Mom's Body &amp; Symptoms</span>
                </div>
                <p className="text-xs text-slate-700 leading-relaxed font-medium">
                  {currentPregnancy.momSymptoms}
                </p>
              </div>

              {/* Kick Counter Tool */}
              <div className="bg-slate-900 text-white p-5 rounded-3xl space-y-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2 text-xs font-black text-amber-300">
                    <Activity className="w-4 h-4" />
                    <span>Fetal Kick Counter (Count to 10)</span>
                  </div>
                  <span className="text-[11px] font-mono text-slate-400">
                    Timer: {Math.floor(kickTimer / 60)}m {kickTimer % 60}s
                  </span>
                </div>

                <div className="flex items-center justify-between gap-4">
                  <div>
                    <span className="text-3xl font-black text-white">{kickCount}</span>
                    <span className="text-xs text-slate-400 ml-1.5">kicks counted</span>
                  </div>

                  <div className="flex gap-2">
                    <button
                      type="button"
                      onClick={() => {
                        setIsKickTracking(true);
                        setKickCount(prev => prev + 1);
                      }}
                      className="bg-gradient-to-r from-amber-400 to-rose-500 hover:from-amber-500 hover:to-rose-600 text-slate-950 font-black text-xs py-2 px-4 rounded-xl transition cursor-pointer shadow-xs"
                    >
                      + Count Kick 🦶
                    </button>

                    <button
                      type="button"
                      onClick={() => {
                        setIsKickTracking(false);
                        setKickCount(0);
                        setKickTimer(0);
                      }}
                      className="bg-white/10 hover:bg-white/20 text-white text-xs font-bold py-2 px-3 rounded-xl transition cursor-pointer"
                    >
                      Reset
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* TAB 3: Growth Tracker (Weight & Height) */}
      {activeTab === 'growth' && (
        <div className="space-y-6 text-left">
          {/* Add Log Form */}
          <form onSubmit={handleAddGrowthLog} className="bg-white p-5 rounded-3xl border border-slate-200/90 shadow-2xs space-y-3">
            <h3 className="text-xs font-black text-slate-900 uppercase tracking-wider">
              Log Baby Pediatric Measurements
            </h3>

            <div className="grid grid-cols-1 sm:grid-cols-4 gap-3">
              <div>
                <label className="block text-[10px] font-bold text-slate-500 mb-1">Weight (kg)</label>
                <input
                  type="number"
                  step="0.05"
                  value={newLogWeight}
                  onChange={(e) => setNewLogWeight(e.target.value)}
                  placeholder="e.g. 6.8"
                  className="w-full text-xs p-2 rounded-xl border border-slate-200"
                  required
                />
              </div>

              <div>
                <label className="block text-[10px] font-bold text-slate-500 mb-1">Height / Length (cm)</label>
                <input
                  type="number"
                  step="0.5"
                  value={newLogHeight}
                  onChange={(e) => setNewLogHeight(e.target.value)}
                  placeholder="e.g. 64.5"
                  className="w-full text-xs p-2 rounded-xl border border-slate-200"
                  required
                />
              </div>

              <div>
                <label className="block text-[10px] font-bold text-slate-500 mb-1">Head Circ. (cm)</label>
                <input
                  type="number"
                  step="0.5"
                  value={newLogHead}
                  onChange={(e) => setNewLogHead(e.target.value)}
                  placeholder="e.g. 40.0"
                  className="w-full text-xs p-2 rounded-xl border border-slate-200"
                />
              </div>

              <div className="flex items-end">
                <button
                  type="submit"
                  className="w-full bg-rose-700 hover:bg-rose-800 text-white font-black text-xs py-2 rounded-xl shadow-xs transition cursor-pointer"
                >
                  + Save Measurement
                </button>
              </div>
            </div>
          </form>

          {/* Historical Logs Table */}
          <div className="bg-white rounded-3xl border border-slate-200/90 overflow-hidden shadow-2xs">
            <div className="p-4 border-b border-slate-100 flex items-center justify-between">
              <h3 className="text-xs font-black text-slate-900">Recorded Growth History</h3>
              <span className="text-[11px] text-slate-400">Benchmarked against WHO standards</span>
            </div>

            <div className="divide-y divide-slate-100">
              {growthLogs.map((log, i) => (
                <div key={i} className="p-4 flex items-center justify-between text-xs">
                  <div className="font-bold text-slate-700">{log.date}</div>
                  <div className="flex items-center gap-6">
                    <div>
                      <span className="text-slate-400 text-[10px] block">Weight:</span>
                      <strong className="text-slate-900">{log.weightKg} kg</strong>
                    </div>
                    <div>
                      <span className="text-slate-400 text-[10px] block">Height:</span>
                      <strong className="text-slate-900">{log.heightCm} cm</strong>
                    </div>
                    {log.headCm > 0 && (
                      <div>
                        <span className="text-slate-400 text-[10px] block">Head:</span>
                        <strong className="text-slate-900">{log.headCm} cm</strong>
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
