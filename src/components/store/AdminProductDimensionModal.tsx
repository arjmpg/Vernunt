import React, { useState } from 'react';
import { X, Scale, Box, Save, Sparkles, Check, AlertCircle } from 'lucide-react';
import type { StoreProduct } from '../../types/store.ts';

interface AdminProductDimensionModalProps {
  product: StoreProduct | null;
  onClose: () => void;
  onSave: (updatedProduct: StoreProduct) => void;
}

export const AdminProductDimensionModal: React.FC<AdminProductDimensionModalProps> = ({
  product,
  onClose,
  onSave
}) => {
  if (!product) return null;

  const [weightGrams, setWeightGrams] = useState<number>(product.weightGrams || 500);
  const [lengthCm, setLengthCm] = useState<number>(product.dimensionsCm?.length || 20);
  const [widthCm, setWidthCm] = useState<number>(product.dimensionsCm?.width || 15);
  const [heightCm, setHeightCm] = useState<number>(product.dimensionsCm?.height || 8);

  // Live volumetric weight in kg
  const volumetricKg = Number(((lengthCm * widthCm * heightCm) / 5000).toFixed(3));
  const deadWeightKg = Number((weightGrams / 1000).toFixed(3));
  const chargeableKg = Math.max(deadWeightKg, volumetricKg);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const updated: StoreProduct = {
      ...product,
      weightGrams: Number(weightGrams),
      dimensionsCm: {
        length: Number(lengthCm),
        width: Number(widthCm),
        height: Number(heightCm)
      }
    };
    onSave(updated);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-5 bg-slate-950/70 backdrop-blur-xs animate-fade-in">
      <div className="bg-white rounded-2xl shadow-2xl border border-slate-200 w-full max-w-lg overflow-hidden flex flex-col text-left">
        {/* Header */}
        <div className="p-4 bg-slate-900 text-white flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-rose-600 flex items-center justify-center text-white font-bold">
              <Scale className="w-4 h-4" />
            </div>
            <div>
              <h3 className="font-bold text-sm text-white">Product Weight &amp; Dimensions</h3>
              <p className="text-[11px] text-slate-300 truncate max-w-[280px]">{product.name}</p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="p-5 space-y-4 text-xs text-slate-800">
          <div>
            <label className="font-bold text-slate-700 block mb-1">
              Dead Weight (in Grams) *
            </label>
            <div className="flex items-center gap-2">
              <input
                type="number"
                min="10"
                step="10"
                required
                value={weightGrams}
                onChange={e => setWeightGrams(Number(e.target.value))}
                className="w-full p-2.5 bg-slate-50 border border-slate-300 rounded-xl font-mono font-bold text-slate-900 outline-hidden focus:border-rose-500"
              />
              <span className="font-bold text-slate-500 font-mono">({deadWeightKg} kg)</span>
            </div>
            <p className="text-[10px] text-slate-400 mt-1">Actual dead weight of product including retail packaging.</p>
          </div>

          <div className="space-y-1.5">
            <label className="font-bold text-slate-700 block">
              Package Dimensions (Length × Breadth × Height in cm) *
            </label>
            <div className="grid grid-cols-3 gap-2 font-mono">
              <div>
                <span className="text-[10px] text-slate-500 font-bold block mb-1">Length (L)</span>
                <input
                  type="number"
                  min="1"
                  step="0.5"
                  required
                  value={lengthCm}
                  onChange={e => setLengthCm(Number(e.target.value))}
                  className="w-full p-2 bg-slate-50 border border-slate-300 rounded-lg font-bold text-center outline-hidden focus:border-rose-500"
                />
              </div>
              <div>
                <span className="text-[10px] text-slate-500 font-bold block mb-1">Breadth / Width (B)</span>
                <input
                  type="number"
                  min="1"
                  step="0.5"
                  required
                  value={widthCm}
                  onChange={e => setWidthCm(Number(e.target.value))}
                  className="w-full p-2 bg-slate-50 border border-slate-300 rounded-lg font-bold text-center outline-hidden focus:border-rose-500"
                />
              </div>
              <div>
                <span className="text-[10px] text-slate-500 font-bold block mb-1">Height (H)</span>
                <input
                  type="number"
                  min="1"
                  step="0.5"
                  required
                  value={heightCm}
                  onChange={e => setHeightCm(Number(e.target.value))}
                  className="w-full p-2 bg-slate-50 border border-slate-300 rounded-lg font-bold text-center outline-hidden focus:border-rose-500"
                />
              </div>
            </div>
          </div>

          {/* Volumetric Calculation Card */}
          <div className="p-3.5 bg-indigo-50/70 border border-indigo-200 rounded-xl space-y-2">
            <div className="flex items-center justify-between text-indigo-950 font-bold text-xs">
              <span className="flex items-center gap-1.5">
                <Box className="w-3.5 h-3.5 text-indigo-600" />
                <span>Volumetric Logistics Weight:</span>
              </span>
              <span className="font-mono text-indigo-700">{volumetricKg} kg</span>
            </div>
            <div className="flex items-center justify-between text-[11px] text-indigo-900 border-t border-indigo-200/60 pt-1.5">
              <span>Chargeable Courier Weight:</span>
              <span className="font-mono font-black text-rose-700 bg-white px-2 py-0.5 rounded border border-rose-200">
                {chargeableKg} kg ({chargeableKg === deadWeightKg ? 'Dead Weight Applied' : 'Volumetric Applied'})
              </span>
            </div>
            <p className="text-[9.5px] text-indigo-700">
              Formula: (Length {lengthCm}cm × Breadth {widthCm}cm × Height {heightCm}cm) / 5000 = {volumetricKg} kg.
            </p>
          </div>

          {/* Actions */}
          <div className="flex items-center justify-end gap-2 pt-2">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 rounded-xl text-slate-600 hover:bg-slate-100 font-bold transition"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-5 py-2.5 bg-rose-700 hover:bg-rose-800 text-white rounded-xl font-bold flex items-center gap-1.5 shadow-md transition cursor-pointer"
            >
              <Save className="w-3.5 h-3.5" />
              <span>Update Weight &amp; Dimensions</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
