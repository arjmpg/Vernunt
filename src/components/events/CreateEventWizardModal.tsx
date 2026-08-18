import React, { useState } from 'react';
import { CommunityEvent, TicketTier, EventScheduleItem } from '../../types.ts';
import { 
  X, Plus, Trash2, Calendar, Clock, MapPin, Ticket, 
  Sparkles, Image, Tag, ShieldCheck, DollarSign, Check, Users
} from 'lucide-react';
import AestheticImageUploader from '../AestheticImageUploader.tsx';

interface CreateEventWizardModalProps {
  userProfile: any;
  onClose: () => void;
  onAddEvent: (newEvent: CommunityEvent) => void;
  customCategories?: any[];
}

export default function CreateEventWizardModal({
  userProfile,
  onClose,
  onAddEvent,
  customCategories = []
}: CreateEventWizardModalProps) {
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [category, setCategory] = useState('Event');
  const [date, setDate] = useState('');
  const [time, setTime] = useState('');
  const [location, setLocation] = useState('');
  const [venueDetails, setVenueDetails] = useState('');
  const [googleMapsUrl, setGoogleMapsUrl] = useState('');
  const [photoUrl, setPhotoUrl] = useState('');
  const [targetAgeRange, setTargetAgeRange] = useState('3 - 10 Years');
  const [tagsStr, setTagsStr] = useState('Weekend, Kids Play, Creative, Workshop');
  
  // Recurring slots
  const [isRecurring, setIsRecurring] = useState(false);
  const [recurringSlots, setRecurringSlots] = useState<string[]>([
    '10:00 AM - 11:30 AM (Morning Batch)',
    '03:00 PM - 04:30 PM (Evening Batch)'
  ]);
  const [newSlotInput, setNewSlotInput] = useState('');

  // Ticket Tiers Builder (WooEvents)
  const [ticketTiers, setTicketTiers] = useState<TicketTier[]>([
    {
      id: 'tier-1',
      name: 'General Admission (1 Kid + 1 Parent)',
      price: 199,
      capacity: 40,
      remainingStock: 40,
      description: 'Standard event pass with access to all activities.',
      maxPerOrder: 4,
      includesKit: false
    },
    {
      id: 'tier-2',
      name: 'VIP Family Pass + Take-Home Activity Kit',
      price: 399,
      capacity: 15,
      remainingStock: 15,
      description: 'Priority seating, dedicated craft coach, and premium materials kit.',
      maxPerOrder: 2,
      includesKit: true
    }
  ]);

  // Schedule Timeline Builder
  const [scheduleAgenda, setScheduleAgenda] = useState<EventScheduleItem[]>([
    { id: 'sch-1', time: '10:00 AM', title: 'Welcome & Icebreaker Storytelling', speaker: 'Host', description: 'Fun interactive games for kids' },
    { id: 'sch-2', time: '10:30 AM', title: 'Hands-on Workshop & Challenges', speaker: 'Coach', description: 'Guided activity session' },
    { id: 'sch-3', time: '11:15 AM', title: 'Snacks & Certificates Distribution', description: 'Healthy refreshments provided' }
  ]);

  const [newAgendaTime, setNewAgendaTime] = useState('');
  const [newAgendaTitle, setNewAgendaTitle] = useState('');

  // Active Tab in Wizard
  const [wizardStep, setWizardStep] = useState<'basics' | 'tickets' | 'agenda'>('basics');

  const handleAddTier = () => {
    const newTier: TicketTier = {
      id: `tier-${Date.now()}`,
      name: 'New Ticket Tier',
      price: 299,
      capacity: 25,
      remainingStock: 25,
      description: 'Admission tier details',
      maxPerOrder: 4,
      includesKit: false
    };
    setTicketTiers([...ticketTiers, newTier]);
  };

  const handleRemoveTier = (tierId: string) => {
    if (ticketTiers.length <= 1) return;
    setTicketTiers(ticketTiers.filter(t => t.id !== tierId));
  };

  const handleUpdateTier = (tierId: string, field: keyof TicketTier, value: any) => {
    setTicketTiers(ticketTiers.map(t => t.id === tierId ? { ...t, [field]: value } : t));
  };

  const handleAddRecurringSlot = () => {
    if (!newSlotInput.trim()) return;
    setRecurringSlots([...recurringSlots, newSlotInput.trim()]);
    setNewSlotInput('');
  };

  const handleAddAgendaItem = () => {
    if (!newAgendaTime || !newAgendaTitle) return;
    setScheduleAgenda([
      ...scheduleAgenda,
      {
        id: `sch-${Date.now()}`,
        time: newAgendaTime,
        title: newAgendaTitle
      }
    ]);
    setNewAgendaTime('');
    setNewAgendaTitle('');
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!title || !date || !time || !location) {
      alert('Please fill in required fields: Title, Date, Time, and Location.');
      return;
    }

    const basePrice = ticketTiers[0]?.price || 0;
    const totalCapacity = ticketTiers.reduce((acc, t) => acc + (t.capacity || 0), 0);

    const newEvent: CommunityEvent = {
      id: `evt-${Date.now()}`,
      title,
      description: description || 'Exciting community event for kids and families.',
      category,
      date,
      time,
      location,
      hostName: userProfile?.parentName || 'Community Organizer',
      attendeesCount: 0,
      joined: false,
      photoUrl: photoUrl || 'https://images.unsplash.com/photo-1544717305-2782549b5136?auto=format&fit=crop&w=600&q=80',
      tags: tagsStr.split(',').map(t => t.trim()).filter(Boolean),
      ticketPrice: basePrice,
      maxCapacity: totalCapacity,
      targetAgeRange,
      venueAddressDetails: venueDetails,
      googleMapsUrl: googleMapsUrl || `https://maps.google.com/?q=${encodeURIComponent(location)}`,
      ticketTiers: ticketTiers,
      scheduleAgenda: scheduleAgenda,
      isRecurring: isRecurring,
      recurringSlots: isRecurring ? recurringSlots : undefined,
      organizerContact: {
        name: userProfile?.parentName || 'Organizer',
        phone: userProfile?.phoneNumber,
        email: userProfile?.email
      }
    };

    onAddEvent(newEvent);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-950/80 backdrop-blur-md overflow-y-auto animate-fadeIn">
      <div className="relative w-full max-w-2xl bg-white rounded-3xl shadow-2xl border border-slate-200 overflow-hidden my-auto flex flex-col max-h-[90vh]">
        
        {/* Header */}
        <div className="bg-gradient-to-r from-orange-600 to-amber-600 p-5 text-white flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-white/20 backdrop-blur-sm flex items-center justify-center text-white border border-white/30">
              <Sparkles className="w-5 h-5" />
            </div>
            <div>
              <span className="text-[10px] font-extrabold uppercase tracking-widest text-orange-200 block">
                WooEvents Publishing Wizard
              </span>
              <h3 className="text-lg font-black text-white leading-tight">
                Create & Publish New Event
              </h3>
            </div>
          </div>
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-full bg-black/20 hover:bg-black/40 text-white flex items-center justify-center transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Wizard Step Tabs */}
        <div className="bg-slate-100 px-6 py-2.5 border-b border-slate-200 flex gap-2 text-xs font-bold">
          <button
            type="button"
            onClick={() => setWizardStep('basics')}
            className={`px-3 py-1.5 rounded-xl transition-colors ${
              wizardStep === 'basics' ? 'bg-orange-600 text-white shadow-xs' : 'text-slate-600 hover:bg-slate-200'
            }`}
          >
            1. Event Info & Schedule
          </button>
          <button
            type="button"
            onClick={() => setWizardStep('tickets')}
            className={`px-3 py-1.5 rounded-xl transition-colors ${
              wizardStep === 'tickets' ? 'bg-orange-600 text-white shadow-xs' : 'text-slate-600 hover:bg-slate-200'
            }`}
          >
            2. Ticket Tiers & Capacity ({ticketTiers.length})
          </button>
          <button
            type="button"
            onClick={() => setWizardStep('agenda')}
            className={`px-3 py-1.5 rounded-xl transition-colors ${
              wizardStep === 'agenda' ? 'bg-orange-600 text-white shadow-xs' : 'text-slate-600 hover:bg-slate-200'
            }`}
          >
            3. Schedule Agenda ({scheduleAgenda.length})
          </button>
        </div>

        {/* Body Form */}
        <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto p-6 space-y-4">
          
          {/* STEP 1: BASICS & LOCATION */}
          {wizardStep === 'basics' && (
            <div className="space-y-3.5 text-xs">
              <div>
                <label className="block font-bold text-slate-700 mb-1">
                  Event Title *
                </label>
                <input
                  type="text"
                  required
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  placeholder="e.g. Lego Robotics & Fun Science Workshop"
                  className="w-full p-2.5 rounded-xl border border-slate-300 focus:ring-2 focus:ring-orange-500 focus:outline-none"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-slate-700 mb-1">
                    Event Category
                  </label>
                  <select
                    value={category}
                    onChange={(e) => setCategory(e.target.value)}
                    className="w-full p-2.5 rounded-xl border border-slate-300 focus:ring-2 focus:ring-orange-500 focus:outline-none bg-white"
                  >
                    <option value="Event">Event</option>
                    <option value="Workshop">Workshop</option>
                    <option value="Activity">Activity</option>
                    <option value="Competition">Competition</option>
                    <option value="Class">Class</option>
                    {customCategories.map(c => (
                      <option key={c.id} value={c.name}>{c.name}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block font-bold text-slate-700 mb-1">
                    Target Age Range
                  </label>
                  <input
                    type="text"
                    value={targetAgeRange}
                    onChange={(e) => setTargetAgeRange(e.target.value)}
                    placeholder="e.g. 3 - 8 Years"
                    className="w-full p-2.5 rounded-xl border border-slate-300 focus:ring-2 focus:ring-orange-500 focus:outline-none"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-slate-700 mb-1">
                    Event Date *
                  </label>
                  <input
                    type="date"
                    required
                    value={date}
                    onChange={(e) => setDate(e.target.value)}
                    className="w-full p-2.5 rounded-xl border border-slate-300 focus:ring-2 focus:ring-orange-500 focus:outline-none bg-white"
                  />
                </div>
                <div>
                  <label className="block font-bold text-slate-700 mb-1">
                    Primary Time *
                  </label>
                  <input
                    type="text"
                    required
                    value={time}
                    onChange={(e) => setTime(e.target.value)}
                    placeholder="e.g. 10:00 AM - 12:30 PM"
                    className="w-full p-2.5 rounded-xl border border-slate-300 focus:ring-2 focus:ring-orange-500 focus:outline-none"
                  />
                </div>
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">
                  Venue & Address *
                </label>
                <input
                  type="text"
                  required
                  value={location}
                  onChange={(e) => setLocation(e.target.value)}
                  placeholder="e.g. Indiranagar Community Center, 100ft Road, Bengaluru"
                  className="w-full p-2.5 rounded-xl border border-slate-300 focus:ring-2 focus:ring-orange-500 focus:outline-none"
                />
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">
                  Event Banner Image URL
                </label>
                <AestheticImageUploader
                  currentImageUrl={photoUrl}
                  onImageSelected={(url) => setPhotoUrl(url)}
                />
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">
                  Event Description & What to Bring
                </label>
                <textarea
                  rows={3}
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="Provide an overview of the activities, safety guidelines, and what parents should bring..."
                  className="w-full p-2.5 rounded-xl border border-slate-300 focus:ring-2 focus:ring-orange-500 focus:outline-none"
                />
              </div>
            </div>
          )}

          {/* STEP 2: TICKET TIERS BUILDER */}
          {wizardStep === 'tickets' && (
            <div className="space-y-4 text-xs">
              <div className="flex items-center justify-between">
                <div>
                  <span className="font-bold text-slate-900 block">Multiple Ticket Tiers & Capacity</span>
                  <span className="text-[11px] text-slate-500">Configure ticket passes, prices, and stock limits.</span>
                </div>
                <button
                  type="button"
                  onClick={handleAddTier}
                  className="px-3 py-1.5 bg-orange-600 text-white font-bold rounded-xl hover:bg-orange-700 flex items-center gap-1 shadow-xs"
                >
                  <Plus className="w-3.5 h-3.5" />
                  <span>Add Tier</span>
                </button>
              </div>

              <div className="space-y-3">
                {ticketTiers.map((tier, idx) => (
                  <div key={tier.id} className="p-4 rounded-2xl border border-slate-200 bg-slate-50 space-y-2.5">
                    <div className="flex items-center justify-between">
                      <span className="font-extrabold text-orange-600 text-[11px]">Tier #{idx + 1}</span>
                      {ticketTiers.length > 1 && (
                        <button
                          type="button"
                          onClick={() => handleRemoveTier(tier.id)}
                          className="text-rose-500 hover:text-rose-700 p-1"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      )}
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                      <div className="sm:col-span-2">
                        <label className="block text-[10px] font-bold text-slate-700 uppercase">Tier Name</label>
                        <input
                          type="text"
                          value={tier.name}
                          onChange={(e) => handleUpdateTier(tier.id, 'name', e.target.value)}
                          placeholder="e.g. VIP Family Pass"
                          className="w-full p-2 bg-white rounded-lg border border-slate-300"
                        />
                      </div>
                      <div>
                        <label className="block text-[10px] font-bold text-slate-700 uppercase">Price (₹ INR)</label>
                        <input
                          type="number"
                          min={0}
                          value={tier.price}
                          onChange={(e) => handleUpdateTier(tier.id, 'price', Number(e.target.value))}
                          className="w-full p-2 bg-white rounded-lg border border-slate-300"
                        />
                      </div>
                    </div>

                    <div className="grid grid-cols-2 gap-2">
                      <div>
                        <label className="block text-[10px] font-bold text-slate-700 uppercase">Total Capacity / Seats</label>
                        <input
                          type="number"
                          min={1}
                          value={tier.capacity}
                          onChange={(e) => {
                            const val = Number(e.target.value);
                            handleUpdateTier(tier.id, 'capacity', val);
                            handleUpdateTier(tier.id, 'remainingStock', val);
                          }}
                          className="w-full p-2 bg-white rounded-lg border border-slate-300"
                        />
                      </div>
                      <div>
                        <label className="block text-[10px] font-bold text-slate-700 uppercase">Max Tickets Per Order</label>
                        <input
                          type="number"
                          min={1}
                          max={10}
                          value={tier.maxPerOrder || 4}
                          onChange={(e) => handleUpdateTier(tier.id, 'maxPerOrder', Number(e.target.value))}
                          className="w-full p-2 bg-white rounded-lg border border-slate-300"
                        />
                      </div>
                    </div>

                    <div className="flex items-center gap-2 pt-1">
                      <input
                        type="checkbox"
                        id={`kit-${tier.id}`}
                        checked={tier.includesKit || false}
                        onChange={(e) => handleUpdateTier(tier.id, 'includesKit', e.target.checked)}
                        className="rounded text-orange-600 focus:ring-orange-500"
                      />
                      <label htmlFor={`kit-${tier.id}`} className="text-[11px] font-semibold text-slate-700">
                        Includes Take-Home Activity Kit / Materials
                      </label>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* STEP 3: SCHEDULE AGENDA */}
          {wizardStep === 'agenda' && (
            <div className="space-y-4 text-xs">
              <div>
                <span className="font-bold text-slate-900 block">Event Schedule & Program Timeline</span>
                <span className="text-[11px] text-slate-500">Provide an itinerary so parents know the activity plan.</span>
              </div>

              <div className="space-y-2">
                {scheduleAgenda.map((item, idx) => (
                  <div key={item.id} className="p-3 bg-slate-50 rounded-xl border border-slate-200 flex items-center justify-between gap-3">
                    <div className="flex items-center gap-3">
                      <span className="font-mono font-bold text-orange-600 text-xs">{item.time}</span>
                      <div>
                        <h6 className="font-bold text-slate-900">{item.title}</h6>
                        {item.description && <p className="text-[11px] text-slate-500">{item.description}</p>}
                      </div>
                    </div>
                    <button
                      type="button"
                      onClick={() => setScheduleAgenda(scheduleAgenda.filter(a => a.id !== item.id))}
                      className="text-slate-400 hover:text-rose-600 p-1"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                ))}
              </div>

              {/* Add Agenda Item Inputs */}
              <div className="p-3.5 bg-orange-50/50 rounded-2xl border border-orange-200 space-y-2">
                <span className="font-bold text-orange-950 text-[11px] block">Add Timeline Slot</span>
                <div className="grid grid-cols-3 gap-2">
                  <div>
                    <input
                      type="text"
                      value={newAgendaTime}
                      onChange={(e) => setNewAgendaTime(e.target.value)}
                      placeholder="e.g. 10:30 AM"
                      className="w-full p-2 bg-white rounded-lg border border-slate-300 text-xs"
                    />
                  </div>
                  <div className="col-span-2 flex gap-1.5">
                    <input
                      type="text"
                      value={newAgendaTitle}
                      onChange={(e) => setNewAgendaTitle(e.target.value)}
                      placeholder="e.g. Science Experiment Demo"
                      className="w-full p-2 bg-white rounded-lg border border-slate-300 text-xs flex-1"
                    />
                    <button
                      type="button"
                      onClick={handleAddAgendaItem}
                      className="px-3 py-2 bg-orange-600 text-white rounded-lg font-bold text-xs hover:bg-orange-700"
                    >
                      Add
                    </button>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Footer Wizard Controls */}
          <div className="pt-4 border-t border-slate-200 flex items-center justify-between">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 rounded-xl border border-slate-200 text-xs font-semibold text-slate-600 hover:bg-slate-50"
            >
              Cancel
            </button>

            <div className="flex gap-2">
              {wizardStep !== 'agenda' ? (
                <button
                  type="button"
                  onClick={() => setWizardStep(wizardStep === 'basics' ? 'tickets' : 'agenda')}
                  className="px-5 py-2.5 rounded-xl bg-slate-900 text-white font-bold text-xs hover:bg-slate-800"
                >
                  Next Step →
                </button>
              ) : (
                <button
                  type="submit"
                  className="px-6 py-2.5 rounded-xl bg-orange-600 text-white font-bold text-xs hover:bg-orange-700 shadow-md shadow-orange-600/20"
                >
                  Publish Event & Open Ticket Sales
                </button>
              )}
            </div>
          </div>

        </form>

      </div>
    </div>
  );
}
