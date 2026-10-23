import React, { useState } from 'react';
import { X, Truck, Save, RotateCcw, Plus, Trash2, ShieldCheck, Scale, Box, MapPin, AlertCircle, Sparkles } from 'lucide-react';
import { DimensionalShippingRules, DEFAULT_DIMENSIONAL_SHIPPING_RULES } from '../../types/store.ts';
import { getStoredShippingRules, saveStoredShippingRules } from '../../utils/pincodeChecker.ts';

interface AdminShippingRulesModalProps {
  isOpen: boolean;
  onClose: () => void;
  onRulesUpdated?: (rules: DimensionalShippingRules) => void;
}

export const AdminShippingRulesModal: React.FC<AdminShippingRulesModalProps> = ({
  isOpen,
  onClose,
  onRulesUpdated
}) => {
  const [rules, setRules] = useState<DimensionalShippingRules>(getStoredShippingRules);
  const [newPin, setNewPin] = useState<string>('');
  const [newPinRate, setNewPinRate] = useState<number>(39);
  const [saveSuccess, setSaveSuccess] = useState<boolean>(false);

  if (!isOpen) return null;

  const handleSave = () => {
    saveStoredShippingRules(rules);
    if (onRulesUpdated) onRulesUpdated(rules);
    setSaveSuccess(true);
    setTimeout(() => setSaveSuccess(false), 2500);
  };

  const handleResetDefaults = () => {
    setRules(DEFAULT_DIMENSIONAL_SHIPPING_RULES);
    saveStoredShippingRules(DEFAULT_DIMENSIONAL_SHIPPING_RULES);
    if (onRulesUpdated) onRulesUpdated(DEFAULT_DIMENSIONAL_SHIPPING_RULES);
    setSaveSuccess(true);
    setTimeout(() => setSaveSuccess(false), 2000);
  };

  const handleAddCustomPin = (e: React.FormEvent) => {
    e.preventDefault();
    const clean = newPin.trim().replace(/\D/g, '').slice(0, 6);
    if (clean.length !== 6) return;

    setRules(prev => ({
      ...prev,
      customPincodeRates: {
        ...(prev.customPincodeRates || {}),
        [clean]: Number(newPinRate)
      }
    }));
    setNewPin('');
  };

  const handleRemoveCustomPin = (pin: string) => {
    setRules(prev => {
      const copy = { ...(prev.customPincodeRates || {}) };
      delete copy[pin];
      return { ...prev, customPincodeRates: copy };
    });
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-5 bg-slate-950/75 backdrop-blur-xs animate-fade-in overflow-y-auto">
      <div className="bg-white rounded-3xl shadow-2xl border border-slate-200 w-full max-w-3xl max-h-[92vh] flex flex-col overflow-hidden text-left">
        {/* Header */}
        <div className="px-6 py-4 bg-gradient-to-r from-slate-900 via-rose-950 to-slate-900 text-white flex items-center justify-between border-b border-rose-900/40 shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-rose-600/30 border border-rose-500/40 text-amber-300 flex items-center justify-center font-bold text-lg shadow-sm">
              <Truck className="w-5 h-5 text-amber-400" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-base sm:text-lg font-black tracking-tight text-white">
                  Admin Shipping &amp; Logistics Rate Desk
                </h3>
                <span className="text-[10px] font-black uppercase px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
                  Live Engine
                </span>
              </div>
              <p className="text-xs text-slate-300">
                Configure dynamic shipping charges by product weight, dimensions (L×B×H), and customer PIN codes
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="w-8 h-8 rounded-full bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-white flex items-center justify-center transition cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Content Body */}
        <div className="p-6 overflow-y-auto space-y-6 text-xs text-slate-800">
          {saveSuccess && (
            <div className="p-3 bg-emerald-50 border border-emerald-200 text-emerald-800 font-bold rounded-xl flex items-center gap-2 animate-fadeIn">
              <ShieldCheck className="w-4 h-4 text-emerald-600 shrink-0" />
              <span>✓ Shipping rules saved successfully! Live checkout calculations updated.</span>
            </div>
          )}

          {/* Section 1: Base Rates by PIN Code Region */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <h4 className="font-black text-sm text-slate-900 flex items-center gap-2 uppercase tracking-wide">
                <MapPin className="w-4 h-4 text-rose-600" /> 1. Base Shipping Rates by PIN Code Region
              </h4>
              <span className="text-[11px] text-slate-500">
                Base Weight: <strong className="font-mono text-slate-900">{rules.baseWeightGrams}g (0.5 kg)</strong>
              </span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
              <div className="p-3.5 bg-slate-50 border border-slate-200 rounded-xl space-y-1">
                <label className="font-bold text-slate-700 block">
                  Local Bengaluru Hub (560xxx)
                </label>
                <div className="flex items-center gap-1.5 font-mono">
                  <span className="font-bold text-slate-400 text-sm">₹</span>
                  <input
                    type="number"
                    min="0"
                    value={rules.baseRateLocal}
                    onChange={e => setRules({ ...rules, baseRateLocal: Number(e.target.value) })}
                    className="w-full bg-white border border-slate-300 rounded-lg p-2 font-bold text-slate-900 text-sm outline-hidden focus:border-rose-500"
                  />
                </div>
                <span className="text-[10px] text-slate-500 block">Bangalore central &amp; tech suburbs</span>
              </div>

              <div className="p-3.5 bg-slate-50 border border-slate-200 rounded-xl space-y-1">
                <label className="font-bold text-slate-700 block">
                  South India Regional (KA, TN, AP, KL)
                </label>
                <div className="flex items-center gap-1.5 font-mono">
                  <span className="font-bold text-slate-400 text-sm">₹</span>
                  <input
                    type="number"
                    min="0"
                    value={rules.baseRateRegional}
                    onChange={e => setRules({ ...rules, baseRateRegional: Number(e.target.value) })}
                    className="w-full bg-white border border-slate-300 rounded-lg p-2 font-bold text-slate-900 text-sm outline-hidden focus:border-rose-500"
                  />
                </div>
                <span className="text-[10px] text-slate-500 block">PINs 57, 58, 60-64, 50-53, 67-69</span>
              </div>

              <div className="p-3.5 bg-slate-50 border border-slate-200 rounded-xl space-y-1">
                <label className="font-bold text-slate-700 block">
                  Tier-1 Metros (DEL, BOM, CCU, PNQ)
                </label>
                <div className="flex items-center gap-1.5 font-mono">
                  <span className="font-bold text-slate-400 text-sm">₹</span>
                  <input
                    type="number"
                    min="0"
                    value={rules.baseRateMetro}
                    onChange={e => setRules({ ...rules, baseRateMetro: Number(e.target.value) })}
                    className="w-full bg-white border border-slate-300 rounded-lg p-2 font-bold text-slate-900 text-sm outline-hidden focus:border-rose-500"
                  />
                </div>
                <span className="text-[10px] text-slate-500 block">Delhi, Mumbai, Kolkata, Pune</span>
              </div>

              <div className="p-3.5 bg-slate-50 border border-slate-200 rounded-xl space-y-1">
                <label className="font-bold text-slate-700 block">
                  National Interstate (Rest of India)
                </label>
                <div className="flex items-center gap-1.5 font-mono">
                  <span className="font-bold text-slate-400 text-sm">₹</span>
                  <input
                    type="number"
                    min="0"
                    value={rules.baseRateNational}
                    onChange={e => setRules({ ...rules, baseRateNational: Number(e.target.value) })}
                    className="w-full bg-white border border-slate-300 rounded-lg p-2 font-bold text-slate-900 text-sm outline-hidden focus:border-rose-500"
                  />
                </div>
                <span className="text-[10px] text-slate-500 block">All standard domestic zones</span>
              </div>

              <div className="p-3.5 bg-slate-50 border border-slate-200 rounded-xl space-y-1">
                <label className="font-bold text-slate-700 block">
                  Remote / Hills / North-East
                </label>
                <div className="flex items-center gap-1.5 font-mono">
                  <span className="font-bold text-slate-400 text-sm">₹</span>
                  <input
                    type="number"
                    min="0"
                    value={rules.baseRateSpecial}
                    onChange={e => setRules({ ...rules, baseRateSpecial: Number(e.target.value) })}
                    className="w-full bg-white border border-slate-300 rounded-lg p-2 font-bold text-slate-900 text-sm outline-hidden focus:border-rose-500"
                  />
                </div>
                <span className="text-[10px] text-slate-500 block">J&amp;K, Himachal, Assam, NE</span>
              </div>

              <div className="p-3.5 bg-rose-50/60 border border-rose-200 rounded-xl space-y-1">
                <label className="font-bold text-rose-900 block">
                  Free Shipping Minimum Cart Total
                </label>
                <div className="flex items-center gap-1.5 font-mono">
                  <span className="font-bold text-rose-400 text-sm">₹</span>
                  <input
                    type="number"
                    min="0"
                    value={rules.freeShippingThreshold}
                    onChange={e => setRules({ ...rules, freeShippingThreshold: Number(e.target.value) })}
                    className="w-full bg-white border border-rose-300 rounded-lg p-2 font-bold text-rose-900 text-sm outline-hidden focus:border-rose-600"
                  />
                </div>
                <span className="text-[10px] text-rose-700 block">Cart subtotal for ₹0 FREE Delivery</span>
              </div>
            </div>
          </div>

          {/* Section 2: Weight & Dimensional Rules */}
          <div className="space-y-3 pt-4 border-t border-slate-200">
            <h4 className="font-black text-sm text-slate-900 flex items-center gap-2 uppercase tracking-wide">
              <Scale className="w-4 h-4 text-rose-600" /> 2. Incremental Weight &amp; Dimension Rules
            </h4>

            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-3">
              <div className="p-3 bg-slate-50 border border-slate-200 rounded-xl space-y-1">
                <label className="font-bold text-slate-700 block">Additional Weight Step</label>
                <div className="flex items-center gap-1">
                  <input
                    type="number"
                    min="100"
                    step="100"
                    value={rules.additionalWeightStepGrams}
                    onChange={e => setRules({ ...rules, additionalWeightStepGrams: Number(e.target.value) })}
                    className="w-full bg-white border border-slate-300 rounded-lg p-2 font-mono font-bold text-slate-900"
                  />
                  <span className="text-slate-500 font-bold">g</span>
                </div>
                <span className="text-[10px] text-slate-400">Extra interval (e.g. 500g)</span>
              </div>

              <div className="p-3 bg-slate-50 border border-slate-200 rounded-xl space-y-1">
                <label className="font-bold text-slate-700 block">Rate per Additional Step</label>
                <div className="flex items-center gap-1">
                  <span className="text-slate-400 font-bold">₹</span>
                  <input
                    type="number"
                    min="0"
                    value={rules.additionalRatePerStep}
                    onChange={e => setRules({ ...rules, additionalRatePerStep: Number(e.target.value) })}
                    className="w-full bg-white border border-slate-300 rounded-lg p-2 font-mono font-bold text-slate-900"
                  />
                </div>
                <span className="text-[10px] text-slate-400">Charge per extra 500g</span>
              </div>

              <div className="p-3 bg-slate-50 border border-slate-200 rounded-xl space-y-1">
                <label className="font-bold text-slate-700 block">Volumetric Divisor</label>
                <input
                  type="number"
                  min="1000"
                  step="500"
                  value={rules.volumetricDivisor}
                  onChange={e => setRules({ ...rules, volumetricDivisor: Number(e.target.value) })}
                  className="w-full bg-white border border-slate-300 rounded-lg p-2 font-mono font-bold text-slate-900"
                />
                <span className="text-[10px] text-slate-400">(L × B × H cm) / Divisor = kg</span>
              </div>

              <div className="p-3 bg-slate-50 border border-slate-200 rounded-xl space-y-1">
                <label className="font-bold text-slate-700 block">Oversize Surcharge</label>
                <div className="flex items-center gap-1">
                  <span className="text-slate-400 font-bold">₹</span>
                  <input
                    type="number"
                    min="0"
                    value={rules.oversizeSurcharge}
                    onChange={e => setRules({ ...rules, oversizeSurcharge: Number(e.target.value) })}
                    className="w-full bg-white border border-slate-300 rounded-lg p-2 font-mono font-bold text-slate-900"
                  />
                </div>
                <span className="text-[10px] text-slate-400">If any side &gt; {rules.oversizeLengthThresholdCm} cm</span>
              </div>
            </div>
          </div>

          {/* Section 3: Custom Pincode Overrides */}
          <div className="space-y-3 pt-4 border-t border-slate-200">
            <div className="flex items-center justify-between">
              <div>
                <h4 className="font-black text-sm text-slate-900 flex items-center gap-2 uppercase tracking-wide">
                  <Box className="w-4 h-4 text-rose-600" /> 3. Specific PIN Code Custom Rate Overrides
                </h4>
                <p className="text-[11px] text-slate-500">
                  Override standard regional rates for high-volume societies, local daycare clusters, or remote PINs
                </p>
              </div>
            </div>

            <form onSubmit={handleAddCustomPin} className="flex items-center gap-2 bg-slate-50 p-3 rounded-xl border border-slate-200">
              <div className="flex-1">
                <input
                  type="text"
                  maxLength={6}
                  placeholder="Enter 6-digit PIN (e.g. 560102)"
                  value={newPin}
                  onChange={e => setNewPin(e.target.value)}
                  className="w-full bg-white border border-slate-300 rounded-lg p-2 text-xs font-mono font-bold outline-hidden focus:border-rose-500"
                />
              </div>
              <div className="w-32 flex items-center gap-1">
                <span className="font-bold text-slate-500">₹</span>
                <input
                  type="number"
                  min="0"
                  value={newPinRate}
                  onChange={e => setNewPinRate(Number(e.target.value))}
                  className="w-full bg-white border border-slate-300 rounded-lg p-2 text-xs font-mono font-bold outline-hidden focus:border-rose-500"
                />
              </div>
              <button
                type="submit"
                disabled={newPin.trim().length !== 6}
                className="px-4 py-2 bg-slate-900 hover:bg-rose-700 text-white rounded-lg text-xs font-bold transition flex items-center gap-1 cursor-pointer disabled:opacity-40"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>Add Override</span>
              </button>
            </form>

            {/* List of active custom PIN code rates */}
            {rules.customPincodeRates && Object.keys(rules.customPincodeRates).length > 0 ? (
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-2">
                {Object.entries(rules.customPincodeRates).map(([pin, rate]) => (
                  <div key={pin} className="p-2.5 rounded-xl bg-white border border-slate-200 flex items-center justify-between shadow-2xs">
                    <div>
                      <span className="font-mono font-bold text-slate-900 text-xs block">{pin}</span>
                      <span className="font-mono font-bold text-rose-700 text-[11px]">₹{rate} flat rate</span>
                    </div>
                    <button
                      type="button"
                      onClick={() => handleRemoveCustomPin(pin)}
                      className="p-1 text-slate-400 hover:text-rose-600 rounded-md hover:bg-rose-50 transition cursor-pointer"
                      title="Remove PIN override"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-slate-400 text-xs italic">No custom PIN overrides added. Using standard regional zone rates.</p>
            )}
          </div>
        </div>

        {/* Footer Actions */}
        <div className="p-4 bg-slate-50 border-t border-slate-200 flex items-center justify-between gap-3 shrink-0">
          <button
            type="button"
            onClick={handleResetDefaults}
            className="flex items-center gap-1.5 px-3 py-2 rounded-xl border border-slate-300 hover:bg-slate-100 text-slate-600 text-xs font-bold transition cursor-pointer"
          >
            <RotateCcw className="w-3.5 h-3.5" />
            <span>Reset to Standard Defaults</span>
          </button>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 rounded-xl text-slate-600 hover:bg-slate-200 text-xs font-bold transition cursor-pointer"
            >
              Cancel
            </button>
            <button
              type="button"
              onClick={handleSave}
              className="flex items-center gap-1.5 px-5 py-2.5 rounded-xl bg-rose-700 hover:bg-rose-800 text-white text-xs font-black uppercase tracking-wider transition shadow-md cursor-pointer active:scale-95"
            >
              <Save className="w-4 h-4" />
              <span>Save &amp; Apply Shipping Rules</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
