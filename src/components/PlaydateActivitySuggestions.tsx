import React, { useState } from 'react';
import { ChildProfile } from '../types.ts';
import { Sparkles, Compass, MapPin, Clock, CalendarCheck2, Lightbulb, Users, CheckCircle2, ChevronRight, Layers, Award } from 'lucide-react';
import Markdown from 'react-markdown';

interface SuggestedActivity {
  id: string;
  title: string;
  category: string;
  resource: string;
  estimatedTime: string;
  energyLevel: 'Low (Calm)' | 'Medium (Active)' | 'High (Energetic)';
  ageGroupFit: string;
  materialsNeeded: string[];
  cooperativeSteps: string[];
  developmentalBenefits: string[];
  safetyTips: string;
}

interface PlaydateActivitySuggestionsProps {
  userProfile: ChildProfile | null;
  targetChild: ChildProfile | null;
  allPlaymates?: ChildProfile[];
  onSelectActivityForPlaydate?: (activityTitle: string, location: string, notes: string, companionId: string) => void;
  onClose?: () => void;
}

const NEARBY_RESOURCES = [
  { id: 'park', name: '🌳 Local Outdoor Park & Grass Lawn', icon: '🌳', locationHint: 'Neighborhood Public Park' },
  { id: 'home', name: '🏡 Home Playroom / Living Room / Backyard', icon: '🏡', locationHint: 'Host Residence' },
  { id: 'library', name: '📚 Public Library / Children Story Corner', icon: '📚', locationHint: 'Community Library' },
  { id: 'sports', name: '⚽ Sports Court / Apartment Clubhouse Field', icon: '⚽', locationHint: 'Apartment Sports Ground' },
  { id: 'art', name: '🎨 Crafts & DIY Activity Space', icon: '🎨', locationHint: 'Art Corner / Patio' },
  { id: 'science', name: '🧪 Outdoor Nature & Discovery Trail', icon: '🧪', locationHint: 'Nature Trail / Garden' }
];

export function PlaydateActivitySuggestions({
  userProfile,
  targetChild,
  allPlaymates = [],
  onSelectActivityForPlaydate,
  onClose
}: PlaydateActivitySuggestionsProps) {
  const [selectedResource, setSelectedResource] = useState(NEARBY_RESOURCES[0]);
  const [selectedCompanionId, setSelectedCompanionId] = useState<string>(
    targetChild?.id || allPlaymates[0]?.id || ''
  );
  
  const companion = targetChild && targetChild.id === selectedCompanionId
    ? targetChild
    : allPlaymates.find(p => p.id === selectedCompanionId) || targetChild || null;

  const myChildName = userProfile?.childName || 'Your Child';
  const myChildAge = userProfile?.childAge || 5;
  const companionName = companion?.childName || 'Playmate';
  const companionAge = companion?.childAge || 5;

  const [aiGenerating, setAiGenerating] = useState(false);
  const [aiCustomIdeas, setAiCustomIdeas] = useState<string | null>(null);
  const [aiError, setAiError] = useState<string | null>(null);

  // Generate algorithmic instant suggested activities based on profiles & selected resource
  const getAlgorithmicSuggestions = (): SuggestedActivity[] => {
    const combinedInterests = Array.from(new Set([
      ...(userProfile?.interests || []),
      ...(companion?.interests || []),
      'Outdoor Play', 'Creative Crafts'
    ]));

    const isSporty = combinedInterests.some(i => /sport|football|soccer|run|cricket|skating|tag|outdoor/i.test(i));
    const isCreative = combinedInterests.some(i => /art|drawing|paint|craft|lego|puzzle|block|story|read/i.test(i));
    const isSTEM = combinedInterests.some(i => /science|lego|robot|coding|dinosaur|space|puzzle|math/i.test(i));

    const avgAge = Math.round((myChildAge + companionAge) / 2);

    const suggestions: SuggestedActivity[] = [
      {
        id: 'act-1',
        title: isSTEM ? 'Lego City Architecture & Storytelling Quest' : 'Creative Clay & Cardboard World Builder',
        category: 'Creative Arts & Building',
        resource: selectedResource.name,
        estimatedTime: '45 - 60 Mins',
        energyLevel: 'Low (Calm)',
        ageGroupFit: `Ideal for ${avgAge - 1}–${avgAge + 2} yrs old`,
        materialsNeeded: ['Building blocks / Lego set', 'Colored clay or crayons', 'Cardboard boxes or paper sheets'],
        cooperativeSteps: [
          `${myChildName} builds the foundation or structure layout while ${companionName} designs characters and vehicles.`,
          `Combine their creations into a shared story land!`,
          `Present the completed story world to both parents in a 2-minute show-and-tell.`
        ],
        developmentalBenefits: ['Fine Motor Coordination', 'Spoken Communication', 'Shared Spatial Planning'],
        safetyTips: 'Ensure all small blocks or clay pieces are non-toxic and age-appropriate.'
      },
      {
        id: 'act-2',
        title: isSporty ? 'Mini Champion Obstacle Relay & Balance Sprint' : 'Neighborhood Nature Treasure Hunt & Tag',
        category: 'Physical Outdoor Sports',
        resource: selectedResource.name,
        estimatedTime: '30 - 45 Mins',
        energyLevel: 'High (Energetic)',
        ageGroupFit: `Great for ${avgAge - 1}–${avgAge + 2} yrs old`,
        materialsNeeded: ['Mini cone markers or water bottles', 'Soft sponge ball', 'Treasure checklist card'],
        cooperativeSteps: [
          `Set up 3 friendly station cones (Zig-zag hop, Soft Ball Pass, High-Five finish).`,
          `${myChildName} and ${companionName} take turns as team captain to guide each other through the course!`,
          `Time both kids as a joint team working together to beat the 2-minute target!`
        ],
        developmentalBenefits: ['Gross Motor Agility', 'Peer Encouragement', 'Teamwork & Turn-taking'],
        safetyTips: 'Choose flat lawn grass away from traffic and ensure kids wear non-slip sneakers.'
      },
      {
        id: 'act-3',
        title: 'Interactive Board Game Tournament & Snack Social',
        category: 'Social & Strategic Fun',
        resource: selectedResource.name,
        estimatedTime: '40 - 50 Mins',
        energyLevel: 'Medium (Active)',
        ageGroupFit: `Perfect for ages ${Math.min(myChildAge, companionAge)}+`,
        materialsNeeded: ['Cooperative Board Game (e.g., Memory Match, Jenga, or Snakes & Ladders)', 'Healthy snack box & water'],
        cooperativeSteps: [
          `Kids sit together to decide the game rules with parent guidance.`,
          `Play in collaborative pairs or alternate turns with active cheers for each move.`,
          `Finish with a shared snack break sharing their favorite highlights of the match.`
        ],
        developmentalBenefits: ['Rule Following', 'Emotional Regulation', 'Social Bond Building'],
        safetyTips: 'Keep snacks allergen-friendly and verify food preferences with parents beforehand.'
      }
    ];

    if (isCreative || selectedResource.id === 'art') {
      suggestions.unshift({
        id: 'act-4',
        title: 'Sponge Stamp Painting & Giant Mural Canvas',
        category: 'Fine Arts & Self Expression',
        resource: selectedResource.name,
        estimatedTime: '45 Mins',
        energyLevel: 'Medium (Active)',
        ageGroupFit: `Ages ${avgAge - 1}–${avgAge + 2} yrs`,
        materialsNeeded: ['Washable finger paints', 'Large chart paper roll', 'Household sponges cut into shapes'],
        cooperativeSteps: [
          `Roll out chart paper on the floor or picnic table.`,
          `${myChildName} paints the sky and background while ${companionName} stamps trees, animals, and suns.`,
          `Sign their signatures together on the corner of the joint masterpiece!`
        ],
        developmentalBenefits: ['Tactile Sensory Exploration', 'Color Theory', 'Cooperative Creativity'],
        safetyTips: 'Use 100% washable non-toxic child safe paints and lay down protective sheets.'
      });
    }

    return suggestions.slice(0, 3);
  };

  const handleGeneratePlayIdeas = async () => {
    setAiGenerating(true);
    setAiError(null);
    setAiCustomIdeas(null);

    const kidsPayload = [
      {
        childName: myChildName,
        childAge: myChildAge,
        interests: userProfile?.interests || [],
        playStyle: userProfile?.playStyle || 'Cooperative'
      }
    ];

    if (companion) {
      kidsPayload.push({
        childName: companionName,
        childAge: companionAge,
        interests: companion.interests || [],
        playStyle: companion.playStyle || 'Friendly'
      });
    }

    try {
      const res = await fetch('/api/generate-play-ideas', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          kids: kidsPayload,
          category: `Nearby Resource: ${selectedResource.name}. Focus on screen-free, safe play.`
        })
      });

      const data = await res.json();
      if (data.success && data.text) {
        setAiCustomIdeas(data.text);
      } else {
        setAiError(data.error || 'Unable to generate custom AI activity right now.');
      }
    } catch (err: any) {
      console.error('AI Activity Error:', err);
      setAiError('Network error connecting to AI service. Using smart local recommendations below.');
    } finally {
      setAiGenerating(false);
    }
  };

  const suggestedList = getAlgorithmicSuggestions();

  return (
    <div id="playdate-activity-suggestions-card" className="bg-white rounded-3xl p-5 md:p-6 border border-slate-100 shadow-sm space-y-5">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-slate-100">
        <div className="flex items-center gap-2.5">
          <div className="p-2.5 bg-orange-500 text-white rounded-2xl shadow-xs">
            <Lightbulb className="w-5 h-5" />
          </div>
          <div>
            <h3 className="text-base font-bold text-slate-900 font-serif flex items-center gap-1.5">
              Playdate Activity Recommender
              <span className="text-[10px] font-sans font-bold bg-amber-100 text-amber-800 px-2 py-0.5 rounded-full border border-amber-200">
                ✨ AI Powered
              </span>
            </h3>
            <p className="text-xs text-slate-500 font-medium">
              Tailored screen-free games based on kids' profiles & nearby resources
            </p>
          </div>
        </div>

        {onClose && (
          <button
            type="button"
            onClick={onClose}
            className="text-xs font-bold text-slate-400 hover:text-slate-700 px-2.5 py-1 rounded-lg hover:bg-slate-100 transition cursor-pointer"
          >
            Close ✕
          </button>
        )}
      </div>

      {/* Profile & Resource Selection Bar */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 bg-slate-50 p-4 rounded-2xl border border-slate-150">
        {/* Child Companion Picker */}
        <div className="flex flex-col space-y-1">
          <label className="text-[11px] font-extrabold text-slate-600 uppercase tracking-wider flex items-center gap-1">
            <Users className="w-3.5 h-3.5 text-orange-500" /> Playmate Pair
          </label>
          <div className="flex items-center gap-2 bg-white px-3 py-2 rounded-xl border border-slate-200 text-xs">
            <span className="font-bold text-slate-800 truncate">{myChildName} ({myChildAge}y)</span>
            <span className="text-orange-500 font-bold shrink-0">+</span>
            {allPlaymates.length > 0 ? (
              <select
                id="select-companion-for-activities"
                value={selectedCompanionId}
                onChange={(e) => setSelectedCompanionId(e.target.value)}
                className="font-bold text-slate-800 bg-transparent outline-none flex-1 truncate cursor-pointer"
              >
                {allPlaymates.map(p => (
                  <option key={p.id} value={p.id}>
                    {p.childName} ({p.childAge}y)
                  </option>
                ))}
              </select>
            ) : (
              <span className="font-bold text-slate-800 truncate">{companionName} ({companionAge}y)</span>
            )}
          </div>
        </div>

        {/* Nearby Resource Picker */}
        <div className="flex flex-col space-y-1">
          <label className="text-[11px] font-extrabold text-slate-600 uppercase tracking-wider flex items-center gap-1">
            <MapPin className="w-3.5 h-3.5 text-orange-500" /> Available Nearby Resource
          </label>
          <select
            id="select-nearby-resource"
            value={selectedResource.id}
            onChange={(e) => {
              const res = NEARBY_RESOURCES.find(r => r.id === e.target.value);
              if (res) setSelectedResource(res);
            }}
            className="px-3 py-2 bg-white border border-slate-200 rounded-xl text-xs font-bold text-slate-800 outline-none focus:ring-2 focus:ring-orange-200 cursor-pointer"
          >
            {NEARBY_RESOURCES.map(r => (
              <option key={r.id} value={r.id}>
                {r.name}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* AI Fresh Generator Trigger Banner */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-3 p-3.5 bg-gradient-to-r from-orange-50 to-amber-50 rounded-2xl border border-orange-200/80">
        <div className="flex items-center gap-2.5">
          <div className="p-2 bg-white rounded-xl text-orange-600 border border-orange-100 shadow-2xs shrink-0">
            <Sparkles className="w-4 h-4 animate-spin-slow" />
          </div>
          <p className="text-xs text-slate-700 font-medium">
            Want a custom AI-designed activity for <strong className="text-slate-900">{myChildName}</strong> & <strong className="text-slate-900">{companionName}</strong>?
          </p>
        </div>

        <button
          id="btn-generate-ai-activity"
          type="button"
          onClick={handleGeneratePlayIdeas}
          disabled={aiGenerating}
          className="w-full sm:w-auto px-4 py-2 bg-slate-900 hover:bg-slate-800 text-white font-bold text-xs rounded-xl transition flex items-center justify-center gap-1.5 shrink-0 active:scale-95 cursor-pointer disabled:opacity-50"
        >
          {aiGenerating ? (
            <>
              <span className="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin"></span>
              <span>Generating AI Plan...</span>
            </>
          ) : (
            <>
              <Sparkles className="w-3.5 h-3.5 text-amber-400" />
              <span>Generate AI Activity</span>
            </>
          )}
        </button>
      </div>

      {/* Render AI Custom Response if available */}
      {aiCustomIdeas && (
        <div className="p-5 bg-amber-50/60 rounded-2xl border border-amber-200/80 space-y-3 animate-fade-in text-xs text-slate-800">
          <div className="flex items-center justify-between border-b border-amber-200/60 pb-2">
            <span className="font-serif font-bold text-sm text-slate-900 flex items-center gap-1.5">
              <Sparkles className="w-4 h-4 text-orange-500" /> AI Custom Activity Plan
            </span>
            <button
              type="button"
              onClick={() => setAiCustomIdeas(null)}
              className="text-[10px] text-slate-500 font-bold hover:underline"
            >
              Clear AI Output
            </button>
          </div>
          <div className="markdown-body text-xs leading-relaxed space-y-2">
            <Markdown>{aiCustomIdeas}</Markdown>
          </div>
        </div>
      )}

      {aiError && (
        <div className="p-3 bg-red-50 text-red-700 border border-red-200 text-xs font-semibold rounded-xl">
          ⚠️ {aiError}
        </div>
      )}

      {/* List of Suggested Activities */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h4 className="text-xs font-extrabold text-slate-600 uppercase tracking-wider flex items-center gap-1.5">
            <Compass className="w-3.5 h-3.5 text-orange-500" /> Recommended Playdate Games ({suggestedList.length})
          </h4>
          <span className="text-[10px] font-bold text-emerald-600 bg-emerald-50 px-2.5 py-0.5 rounded-full border border-emerald-100">
            Matched to {selectedResource.name.split(' ')[1] || 'Resource'}
          </span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {suggestedList.map((act) => (
            <div
              key={act.id}
              className="bg-slate-50/80 rounded-2xl border border-slate-200/80 p-4 flex flex-col justify-between hover:bg-white hover:shadow-md transition duration-200 space-y-3"
            >
              {/* Header Badges */}
              <div className="space-y-1">
                <div className="flex items-center justify-between text-[10px] font-extrabold">
                  <span className="text-orange-600 bg-orange-50 px-2 py-0.5 rounded-md border border-orange-100">
                    {act.category}
                  </span>
                  <span className="text-slate-500 flex items-center gap-0.5">
                    <Clock className="w-3 h-3 text-slate-400" />
                    {act.estimatedTime}
                  </span>
                </div>

                <h5 className="font-serif font-bold text-sm text-slate-900 pt-1 leading-snug">
                  {act.title}
                </h5>

                <p className="text-[10px] text-slate-500 font-medium">
                  {act.ageGroupFit} • <span className="text-slate-700 font-semibold">{act.energyLevel}</span>
                </p>
              </div>

              {/* Cooperative Game Steps */}
              <div className="bg-white p-3 rounded-xl border border-slate-150 space-y-1.5 text-[11px] text-slate-700">
                <span className="text-[9.5px] font-extrabold text-slate-400 uppercase tracking-wider block">
                  🎮 How Children Play Together:
                </span>
                <ul className="space-y-1 list-disc list-inside text-slate-600 font-medium leading-relaxed">
                  {act.cooperativeSteps.map((step, sIdx) => (
                    <li key={sIdx}>{step}</li>
                  ))}
                </ul>
              </div>

              {/* Materials Needed & Benefits */}
              <div className="space-y-1 text-[10.5px]">
                <div className="flex flex-wrap gap-1">
                  {act.materialsNeeded.map((mat, mIdx) => (
                    <span key={mIdx} className="bg-slate-100 text-slate-600 px-1.5 py-0.5 rounded text-[9.5px] font-medium">
                      📦 {mat}
                    </span>
                  ))}
                </div>
              </div>

              {/* Action Button */}
              {onSelectActivityForPlaydate && (
                <button
                  type="button"
                  id={`btn-schedule-activity-${act.id}`}
                  onClick={() => {
                    onSelectActivityForPlaydate(
                      act.title,
                      selectedResource.locationHint,
                      `Materials: ${act.materialsNeeded.join(', ')}. Age: ${act.ageGroupFit}.`,
                      companion?.id || ''
                    );
                  }}
                  className="w-full py-2 bg-gradient-to-r from-orange-500 to-amber-500 hover:from-orange-600 hover:to-amber-600 text-white font-bold rounded-xl text-xs transition flex items-center justify-center gap-1 active:scale-95 cursor-pointer shadow-xs mt-auto"
                >
                  <CalendarCheck2 className="w-3.5 h-3.5" />
                  <span>Schedule This Playdate</span>
                </button>
              )}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
