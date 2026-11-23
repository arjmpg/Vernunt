import React, { useState } from 'react';
import { EventAddOn } from '../../types.ts';
import {
  Plus, Trash2, Edit3, ShieldCheck, Check, X, Sparkles, AlertCircle
} from 'lucide-react';
import {
  saveCustomEventAddOn,
  deleteCustomEventAddOn,
  isAdminProfile
} from '../../utils/eventAddOnsStorage.ts';

interface AdminEventAddOnsManagerProps {
  eventId: string;
  eventTitle: string;
  userProfile: any;
  customAddOns: EventAddOn[];
  onAddOnsUpdated: (updated: EventAddOn[]) => void;
  compact?: boolean;
}

export default function AdminEventAddOnsManager({
  eventId,
  eventTitle,
  userProfile,
  customAddOns,
  onAddOnsUpdated,
  compact = false
}: AdminEventAddOnsManagerProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [priceStr, setPriceStr] = useState('');
  const [chargeType, setChargeType] = useState<'per_student' | 'flat' | 'per_unit'>('per_student');
  const [unitLabel, setUnitLabel] = useState('');
  const [badge, setBadge] = useState('Optional Add-On');
  const [saving, setSaving] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  const [successMsg, setSuccessMsg] = useState('');

  if (!isAdminProfile(userProfile)) return null;

  const resetForm = () => {
    setEditingId(null);
    setName('');
    setDescription('');
    setPriceStr('');
    setChargeType('per_student');
    setUnitLabel('');
    setBadge('Optional Add-On');
    setErrorMsg('');
  };

  const handleStartEdit = (addon: EventAddOn) => {
    setEditingId(addon.id);
    setName(addon.name);
    setDescription(addon.description || '');
    setPriceStr(String(addon.price));
    setChargeType(addon.chargeType);
    setUnitLabel(addon.unitLabel || '');
    setBadge(addon.badge || 'Optional Add-On');
    setErrorMsg('');
    setSuccessMsg('');
    setIsOpen(true);
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg('');
    setSuccessMsg('');

    const cleanName = name.trim();
    const parsedPrice = Number(priceStr);
    if (!cleanName) {
      setErrorMsg('Please enter an add-on title.');
      return;
    }
    if (priceStr.trim() === '' || !Number.isFinite(parsedPrice)) {
      setErrorMsg('Please enter a valid charge amount in ₹ (e.g. 400 or -200).');
      return;
    }

    setSaving(true);
    const result = await saveCustomEventAddOn(
      eventId,
      {
        id: editingId || undefined,
        name: cleanName,
        description: description.trim(),
        price: Math.round(parsedPrice),
        chargeType,
        unitLabel: chargeType === 'per_unit' ? (unitLabel.trim() || 'unit') : undefined,
        badge: badge.trim() || 'Admin Add-On'
      },
      userProfile
    );
    setSaving(false);

    if (!result.success) {
      setErrorMsg(result.error || 'Could not save custom add-on.');
      return;
    }

    onAddOnsUpdated(result.addons);
    setSuccessMsg(editingId ? 'Custom add-on updated!' : 'Custom add-on created & live for bookings!');
    resetForm();
    setTimeout(() => setSuccessMsg(''), 3000);
  };

  const handleDelete = async (addonId: string) => {
    setErrorMsg('');
    setSaving(true);
    const result = await deleteCustomEventAddOn(eventId, addonId, userProfile);
    setSaving(false);
    if (!result.success) {
      setErrorMsg(result.error || 'Failed to delete add-on.');
      return;
    }
    onAddOnsUpdated(result.addons);
    if (editingId === addonId) resetForm();
  };

  const chargeTypeLabel = (type: EventAddOn['chargeType'], uLabel?: string) => {
    if (type === 'per_student') return 'per student';
    if (type === 'flat') return 'flat per booking';
    return `per ${uLabel || 'unit'}`;
  };

  return (
    <div className="rounded-2xl border border-indigo-200 bg-indigo-50/70 p-3.5 space-y-3">
      <div className="flex items-center justify-between gap-2 flex-wrap">
        <div className="flex items-center gap-2 min-w-0">
          <div className="w-7 h-7 rounded-xl bg-indigo-600 text-white flex items-center justify-center shrink-0">
            <ShieldCheck className="w-4 h-4" />
          </div>
          <div className="min-w-0">
            <span className="text-[10px] font-black uppercase tracking-wider text-indigo-700 block">
              Admin Controls
            </span>
            <h4 className="text-xs font-extrabold text-slate-900 truncate">
              Custom Add-Ons &amp; Charges ({customAddOns.length})
            </h4>
          </div>
        </div>

        <button
          type="button"
          onClick={() => {
            setIsOpen(!isOpen);
            if (isOpen) resetForm();
          }}
          className="px-3 py-1.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-[11px] font-bold flex items-center gap-1.5 transition cursor-pointer shrink-0"
        >
          {isOpen ? (
            <>
              <X className="w-3.5 h-3.5" />
              <span>Close Editor</span>
            </>
          ) : (
            <>
              <Plus className="w-3.5 h-3.5" />
              <span>Create Custom Add-On</span>
            </>
          )}
        </button>
      </div>

      {successMsg && (
        <div className="flex items-center gap-1.5 text-[11px] font-bold text-emerald-800 bg-emerald-100/90 border border-emerald-200 px-3 py-2 rounded-xl">
          <Check className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
          <span>{successMsg}</span>
        </div>
      )}

      {errorMsg && (
        <div className="flex items-center gap-1.5 text-[11px] font-semibold text-rose-800 bg-rose-100 border border-rose-200 px-3 py-2 rounded-xl">
          <AlertCircle className="w-3.5 h-3.5 text-rose-600 shrink-0" />
          <span>{errorMsg}</span>
        </div>
      )}

      {/* Existing Admin Custom Add-Ons List */}
      {customAddOns.length > 0 && (
        <div className="space-y-1.5">
          {customAddOns.map((addon) => (
            <div
              key={addon.id}
              className="flex items-center justify-between gap-2 bg-white border border-indigo-100 rounded-xl px-3 py-2 text-xs"
            >
              <div className="min-w-0">
                <div className="flex items-center gap-1.5 flex-wrap">
                  <span className="font-bold text-slate-900 truncate">{addon.name}</span>
                  <span className={`text-[10px] font-extrabold px-1.5 py-0.5 rounded-md ${
                    addon.price < 0
                      ? 'bg-emerald-100 text-emerald-800'
                      : 'bg-amber-100 text-amber-800'
                  }`}>
                    {addon.price >= 0 ? `+₹${addon.price}` : `-₹${Math.abs(addon.price)}`} {chargeTypeLabel(addon.chargeType, addon.unitLabel)}
                  </span>
                </div>
                {addon.description && (
                  <p className="text-[11px] text-slate-500 truncate">{addon.description}</p>
                )}
              </div>
              <div className="flex items-center gap-1 shrink-0">
                <button
                  type="button"
                  onClick={() => handleStartEdit(addon)}
                  className="p-1.5 rounded-lg text-slate-500 hover:text-indigo-700 hover:bg-indigo-50 transition cursor-pointer"
                  title="Edit custom add-on"
                >
                  <Edit3 className="w-3.5 h-3.5" />
                </button>
                <button
                  type="button"
                  onClick={() => handleDelete(addon.id)}
                  disabled={saving}
                  className="p-1.5 rounded-lg text-slate-500 hover:text-rose-700 hover:bg-rose-50 transition cursor-pointer disabled:opacity-40"
                  title="Delete custom add-on"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Create / Edit Form */}
      {isOpen && (
        <form onSubmit={handleSave} className="bg-white rounded-xl border border-indigo-200 p-3.5 space-y-3 text-xs">
          <div className="flex items-center justify-between">
            <span className="font-extrabold text-indigo-950 flex items-center gap-1.5">
              <Sparkles className="w-3.5 h-3.5 text-indigo-600" />
              {editingId ? 'Edit Custom Add-On' : `New Custom Add-On for ${compact ? 'Event' : eventTitle}`}
            </span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
            <div>
              <label className="block text-[11px] font-bold text-slate-700 mb-1">
                Add-On Title *
              </label>
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="e.g. Science Kit / Photographer / Extra Snacks"
                className="w-full px-3 py-2 rounded-xl border border-slate-300 focus:ring-2 focus:ring-indigo-500 focus:outline-none text-xs"
                required
              />
            </div>

            <div>
              <label className="block text-[11px] font-bold text-slate-700 mb-1">
                Charge in ₹ (use negative for discount) *
              </label>
              <input
                type="number"
                value={priceStr}
                onChange={(e) => setPriceStr(e.target.value)}
                placeholder="e.g. 250 or -150"
                className="w-full px-3 py-2 rounded-xl border border-slate-300 focus:ring-2 focus:ring-indigo-500 focus:outline-none text-xs font-mono"
                required
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
            <div>
              <label className="block text-[11px] font-bold text-slate-700 mb-1">
                Billing Mode *
              </label>
              <select
                value={chargeType}
                onChange={(e) => setChargeType(e.target.value as 'per_student' | 'flat' | 'per_unit')}
                className="w-full px-3 py-2 rounded-xl border border-slate-300 bg-white focus:ring-2 focus:ring-indigo-500 focus:outline-none text-xs"
              >
                <option value="per_student">Per Student / Attendee</option>
                <option value="flat">Flat Charge per Booking</option>
                <option value="per_unit">Per Unit (Qty selector e.g. Guide / Kit)</option>
              </select>
            </div>

            {chargeType === 'per_unit' ? (
              <div>
                <label className="block text-[11px] font-bold text-slate-700 mb-1">
                  Unit Label
                </label>
                <input
                  type="text"
                  value={unitLabel}
                  onChange={(e) => setUnitLabel(e.target.value)}
                  placeholder="e.g. guide, kit, bus"
                  className="w-full px-3 py-2 rounded-xl border border-slate-300 focus:ring-2 focus:ring-indigo-500 focus:outline-none text-xs"
                />
              </div>
            ) : (
              <div>
                <label className="block text-[11px] font-bold text-slate-700 mb-1">
                  Badge Label (Optional)
                </label>
                <input
                  type="text"
                  value={badge}
                  onChange={(e) => setBadge(e.target.value)}
                  placeholder="e.g. Optional Add-On, Recommended"
                  className="w-full px-3 py-2 rounded-xl border border-slate-300 focus:ring-2 focus:ring-indigo-500 focus:outline-none text-xs"
                />
              </div>
            )}
          </div>

          <div>
            <label className="block text-[11px] font-bold text-slate-700 mb-1">
              Description (shown to parents/schools at checkout)
            </label>
            <input
              type="text"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Briefly describe what is included in this add-on"
              className="w-full px-3 py-2 rounded-xl border border-slate-300 focus:ring-2 focus:ring-indigo-500 focus:outline-none text-xs"
            />
          </div>

          <div className="flex items-center justify-end gap-2 pt-1">
            {editingId && (
              <button
                type="button"
                onClick={resetForm}
                className="px-3 py-2 rounded-xl border border-slate-200 text-slate-600 font-bold text-xs hover:bg-slate-50 cursor-pointer"
              >
                Cancel Edit
              </button>
            )}
            <button
              type="submit"
              disabled={saving}
              className="px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs shadow-sm transition cursor-pointer disabled:opacity-50"
            >
              {saving ? 'Saving...' : editingId ? 'Update Add-On' : 'Save & Publish Add-On'}
            </button>
          </div>
        </form>
      )}
    </div>
  );
}
