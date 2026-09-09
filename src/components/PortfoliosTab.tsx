import React, { useState } from 'react';
import { ChildProfile } from '../types.ts';
import { Award, ShieldCheck, Sparkles, Activity, Stethoscope, Building2, Star, ArrowRight, CheckCircle2 } from 'lucide-react';
import confettiDefault from 'canvas-confetti';
import { BANGALORE_PEDIATRICIANS } from '../data/bangalorePediatricians.ts';
import { FALLBACK_DOCTOR_PHOTO } from '../utils/specialistUrls.ts';

interface PortfoliosTabProps {
  currentProfile: ChildProfile | null;
  onNavigateToSpecialists?: () => void;
  onNavigateToPediatricians?: () => void;
}

export default function PortfoliosTab({ currentProfile, onNavigateToSpecialists, onNavigateToPediatricians }: PortfoliosTabProps) {
  const navSpecialists = onNavigateToSpecialists || onNavigateToPediatricians;
  const childName = currentProfile?.childName || 'Your Child';
  const gradeLevel = currentProfile?.gradeLevel || 'Kindergarten';
  const childAge = currentProfile?.childAge || 5;

  // Pediatric immunizations & child growth charts
  const [vaccines, setVaccines] = useState([
    { name: 'MMR (Measles, Mumps, Rubella) immunization', date: '2025-11-12', status: 'Cleared booster', reference: 'PED-MMR-1798' },
    { name: 'DTaP (Diphtheria, Tetanus, Pertussis) booster', date: '2026-02-15', status: 'Cleared booster', reference: 'PED-DTP-4412' },
    { name: 'Inactivated Polio Vaccine (IPV) school clearance', date: '2026-03-01', status: 'Cleared booster', reference: 'PED-IPV-9908' },
  ]);

  const [medals, setMedals] = useState([
    { title: 'Junior Swimming level-1 certificate', class: 'YMCA Play Athletics 2025', date: '2025-08-11' },
    { title: 'Master Crayon Sketch honor', class: 'Central Park Little Painters 2026', date: '2026-01-10' }
  ]);

  const [growthLogs, setGrowthLogs] = useState([
    { date: '2026-01-01', height: '105 cm', weight: '38 lbs' },
    { date: '2026-03-01', height: '108 cm', weight: '41 lbs' },
    { date: '2026-05-01', height: '110 cm', weight: '43 lbs' },
  ]);

  const [showAddMedal, setShowAddMedal] = useState(false);
  const [newMedalTitle, setNewMedalTitle] = useState('');
  const [newMedalClass, setNewMedalClass] = useState('');

  const handleAddMedal = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newMedalTitle.trim() || !newMedalClass.trim()) return;

    setMedals([...medals, {
      title: newMedalTitle.trim(),
      class: newMedalClass.trim(),
      date: new Date().toISOString().substring(0, 10)
    }]);

    setNewMedalTitle('');
    setNewMedalClass('');
    setShowAddMedal(false);

    confettiDefault({
      particleCount: 60,
      spread: 45,
      colors: ['#3b82f6', '#f59e0b']
    });
  };

  return (
    <div id="portfolios-tab" className="space-y-6">
      {/* Header */}
      <div>
        <h3 id="portfolio-title" className="text-xl font-bold text-slate-800 font-serif flex items-center gap-1.5">
          <Award className="w-6 h-6 text-orange-500" /> Digital Milestone Portfolio & Safety Vault
        </h3>
        <p id="portfolio-subtitle" className="text-xs text-slate-500">Document {childName}'s school health clearances, pediatric growth progress, and playground achievements.</p>
      </div>

      <div id="portfolio-grid-layout" className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Card 1: Core Health Credentials */}
        <div id="health-vault-card" className="bg-white rounded-3xl p-6 border border-slate-100 shadow-sm space-y-4">
          <div id="health-header" className="flex justify-between items-center">
            <h4 className="font-bold text-sm uppercase tracking-wider text-slate-400 font-serif flex items-center gap-1.5">
              <ShieldCheck className="w-5 h-5 text-emerald-500 fill-emerald-50" /> Pediatric clearance Log
            </h4>
            <span className="text-[10px] font-bold text-emerald-600 bg-emerald-50 border border-emerald-100 px-2 py-0.5 rounded-full uppercase">
              Form 100% Up to Date
            </span>
          </div>

          <div id="vaccines-list" className="space-y-3">
            {vaccines.map((vac, idx) => (
              <div id={`vac-item-${idx}`} key={idx} className="p-4 bg-slate-50 rounded-2xl border border-slate-100 flex items-center justify-between text-xs transition hover:bg-slate-100/50">
                <div className="space-y-1">
                  <span className="font-bold text-slate-800 block">{vac.name}</span>
                  <span className="text-[10px] text-slate-400 font-medium select-all">Clinic Record ID: {vac.reference}</span>
                </div>
                <div className="text-right">
                  <span className="block font-bold text-emerald-600">Cleared Boosters</span>
                  <span className="text-[10.5px] text-slate-400 font-medium">Recorded: {vac.date}</span>
                </div>
              </div>
            ))}
          </div>

          <p id="health-warning-spec" className="text-[10px] text-slate-400">
            * Health parameters are validated by parents using standard school/daycare entry checklists. Only fully cleared users receive the safety Green Verified identifier tag.
          </p>
        </div>

        {/* Card 2: Agility achievements & honors */}
        <div id="achievements-vault-card" className="bg-white rounded-3xl p-6 border border-slate-100 shadow-sm space-y-5">
          <div id="medals-header" className="flex justify-between items-center">
            <h4 className="font-bold text-sm uppercase tracking-wider text-slate-400 font-serif flex items-center gap-1.5">
              <Sparkles className="w-4 h-4 text-orange-500 animate-spin-slow" /> Creative Milestones & Awards
            </h4>
            
            <button
              id="btn-trigger-add-medal"
              onClick={() => setShowAddMedal(!showAddMedal)}
              type="button"
              className="text-xs font-bold text-orange-600 hover:text-orange-700 hover:underline flex items-center gap-1"
            >
              + Log Achievement
            </button>
          </div>

          {showAddMedal && (
            <form id="add-medal-form" onSubmit={handleAddMedal} className="p-4 bg-amber-50/50 rounded-2xl border border-amber-100 space-y-3 animate-fade-in">
              <p className="text-[11px] font-bold text-amber-800">Add custom child medal, certificate, or learning skill banner</p>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                <input
                  id="input-medal-title"
                  type="text"
                  required
                  placeholder="e.g. Master Lego Builder"
                  value={newMedalTitle}
                  onChange={(e) => setNewMedalTitle(e.target.value)}
                  className="px-3 py-2 bg-white border border-slate-200 rounded-xl text-xs outline-none focus:ring-4 focus:ring-amber-200"
                />
                <input
                  id="input-medal-class"
                  type="text"
                  required
                  placeholder="e.g. Daycare Painting Class 1"
                  value={newMedalClass}
                  onChange={(e) => setNewMedalClass(e.target.value)}
                  className="px-3 py-2 bg-white border border-slate-200 rounded-xl text-xs outline-none focus:ring-4 focus:ring-amber-200"
                />
              </div>
              <div className="flex justify-end gap-2 text-xs pt-1">
                <button 
                  id="btn-medal-cancel"
                  type="button" 
                  onClick={() => setShowAddMedal(false)} 
                  className="px-2.5 py-1 text-slate-500 hover:bg-slate-100 rounded-lg"
                >
                  Cancel
                </button>
                <button 
                  id="btn-medal-save"
                  type="submit" 
                  className="px-3 py-1 bg-gradient-to-r from-orange-500 to-amber-500 hover:from-orange-600 hover:to-amber-600 text-white font-bold rounded-lg shadow-sm"
                >
                  Confirm Award
                </button>
              </div>
            </form>
          )}

          <div id="medals-list" className="space-y-3">
            {medals.map((med, idx) => (
              <div id={`medal-item-${idx}`} key={idx} className="p-4 bg-slate-50 rounded-2xl border border-slate-100 flex items-center justify-between text-xs transition hover:bg-slate-100/50">
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-amber-100 text-amber-700 rounded-xl">
                    <Award className="w-5 h-5 animate-bounce" />
                  </div>
                  <div>
                    <span className="font-bold text-slate-800 block">{med.title}</span>
                    <span className="text-[10px] text-slate-400 font-semibold">{med.class}</span>
                  </div>
                </div>
                <span className="text-[10.5px] text-slate-400 font-medium">Earned: {med.date}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Card 3: Growth Tracker */}
        <div id="biometrics-card" className="bg-white rounded-3xl p-6 border border-slate-100 shadow-sm space-y-4 lg:col-span-2">
          <h4 className="font-bold text-sm uppercase tracking-wider text-slate-400 font-serif flex items-center gap-1.5">
            <Activity className="w-5 h-5 text-indigo-500" /> Pediatric Pediatric Growth & height tracking
          </h4>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {growthLogs.map((log, idx) => (
              <div id={`growth-log-${idx}`} key={idx} className="p-4 bg-indigo-50/30 rounded-2xl border border-indigo-150 flex justify-between items-center text-xs">
                <div>
                  <span className="text-slate-400 font-medium block text-[10px] uppercase">Record Date</span>
                  <span className="font-bold text-slate-700">{log.date}</span>
                </div>
                <div className="text-right">
                  <span className="text-slate-400 font-medium block text-[10px] uppercase">Height / Weight</span>
                  <span className="font-black text-indigo-700 text-base">{log.height} • {log.weight}</span>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Card 4: Recommended Specialists for Immunizations & Clearances */}
        <div id="specialist-clearance-card" className="bg-gradient-to-r from-rose-900 via-slate-900 to-amber-950 text-white rounded-3xl p-6 shadow-md space-y-4 lg:col-span-2">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div className="space-y-1">
              <div className="flex items-center gap-2">
                <span className="w-8 h-8 rounded-xl bg-rose-600 text-white flex items-center justify-center font-bold">
                  <Stethoscope className="w-4 h-4" />
                </span>
                <h4 className="font-bold text-base font-serif text-white flex items-center gap-2">
                  Recommended Specialists for Immunization, Health &amp; School Clearances
                </h4>
              </div>
              <p className="text-xs text-slate-300 max-w-2xl">
                Need doctor sign-off for school admission, daycare health clearances, or milestone evaluation? Connect directly with verified specialists across your city.
              </p>
            </div>

            {navSpecialists && (
              <button
                type="button"
                onClick={navSpecialists}
                className="px-4 py-2.5 bg-rose-600 hover:bg-rose-700 active:scale-95 text-white text-xs font-black uppercase tracking-wider rounded-xl transition flex items-center gap-2 self-start sm:self-auto cursor-pointer shadow-sm shrink-0"
              >
                <span>View All Specialists</span>
                <ArrowRight className="w-4 h-4" />
              </button>
            )}
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-3 pt-2">
            {BANGALORE_PEDIATRICIANS.slice(0, 4).map((doc) => (
              <div
                key={doc.id}
                onClick={navSpecialists}
                className="bg-white/10 hover:bg-white/15 border border-white/10 p-3 rounded-2xl transition cursor-pointer space-y-2 flex flex-col justify-between"
              >
                <div className="flex items-start gap-2.5">
                  <img
                    src={doc.photoUrl}
                    alt={doc.name}
                    onError={(e) => {
                      (e.currentTarget as HTMLImageElement).src = FALLBACK_DOCTOR_PHOTO;
                    }}
                    className="w-11 h-11 rounded-xl object-cover border border-white/20 shrink-0"
                    referrerPolicy="no-referrer"
                  />
                  <div className="min-w-0">
                    <h5 className="font-bold text-xs text-white truncate">{doc.name}</h5>
                    <p className="text-[10px] text-rose-300 truncate">{doc.title}</p>
                    <div className="flex items-center gap-1 text-[10px] text-amber-300 font-bold mt-0.5">
                      <Star className="w-3 h-3 fill-amber-300" />
                      <span>{doc.rating}</span>
                      <span className="text-white/60 font-normal">({doc.reviewsCount}+)</span>
                    </div>
                  </div>
                </div>

                <div className="pt-2 border-t border-white/10 flex items-center justify-between text-[10px] text-slate-300">
                  <span className="truncate max-w-[120px]">{doc.hospitalAffiliation || doc.location}</span>
                  <span className="font-bold text-amber-300">₹{doc.sessionFee}</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
