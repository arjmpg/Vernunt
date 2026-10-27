import React, { useState } from 'react';
import { X, Scale, Box, Save, Sparkles, Check, AlertCircle, Truck, HelpCircle } from 'lucide-react';
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

  const [weightGrams, setWeightGrams] = useState<string>(
    typeof product.weightGrams === 'number' && product.weightGrams > 0 ? String(product.weightGrams) : ''
  );
  const [lengthCm, setLengthCm] = useState<string>(
    product.dimensionsCm?.length ? String(product.dimensionsCm.length) : ''
  );
  const [widthCm, setWidthCm] = useState<string>(
    product.dimensionsCm?.width ? String(product.dimensionsCm.width) : ''
  );
  const [heightCm, setHeightCm] = useState<string>(
    product.dimensionsCm?.height ? String(product.dimensionsCm.height) : ''
  );
  const [isFreeShipping, setIsFreeShipping] = useState<boolean>(
    Boolean(product.isFreeShipping || product.badges?.some(b => b.toLowerCase().includes('free shipping')))
  );
  const [shippingFee, setShippingFee] = useState<number>(
    product.shippingFee ?? product.defaultShippingFee ?? 49
  );

  const numWeight = weightGrams ? Number(weightGrams) : 0;
  const numLength = lengthCm ? Number(lengthCm) : 0;
  const numWidth = widthCm ? Number(widthCm) : 0;
  const numHeight = heightCm ? Number(heightCm) : 0;

  // Live volumetric weight in kg
  const hasDimensions = numLength > 0 && numWidth > 0 && numHeight > 0;
  const volumetricKg = hasDimensions ? Number(((numLength * numWidth * numHeight) / 5000).toFixed(3)) : 0;
  const deadWeightKg = numWeight > 0 ? Number((numWeight / 1000).toFixed(3)) : 0;
  const chargeableKg = Math.max(deadWeightKg, volumetricKg);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    const baseBadges = (product.badges || ['100% Safe', 'BIS Certified']).filter(
      b => !b.toLowerCase().includes('free shipping')
    );
    const finalBadges = isFreeShipping ? [...baseBadges, 'Free Shipping'] : baseBadges;
    const finalFee = isFreeShipping ? 0 : Number(shippingFee ?? 49);

    const updated: StoreProduct = {
      ...product,
      weightGrams: numWeight > 0 ? numWeight : undefined,
      dimensionsCm: hasDimensions ? {
        length: numLength,
        width: numWidth,
        height: numHeight
      } : undefined,
      isFreeShipping,
      shippingFee: finalFee,
      defaultShippingFee: finalFee,
      badges: finalBadges
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
            <div className="w-8 h-8 rounded-lg bg-teal-600 flex items-center justify-center text-white font-bold">
              <Scale className="w-4 h-4" />
            </div>
            <div>
              <h3 className="font-bold text-sm text-white">Product Logistics &amp; Shipping Charges</h3>
              <p className="text-[11px] text-slate-300 truncate max-w-[280px]">{product.name}</p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="p-5 space-y-4 text-xs text-slate-800 max-h-[85vh] overflow-y-auto">
          {/* Free Shipping Toggle Option */}
          <div className="p-3 bg-gradient-to-r from-teal-50 to-emerald-50 border border-teal-200 rounded-xl space-y-2">
            <label className="flex items-center gap-2.5 text-xs font-bold text-teal-950 cursor-pointer">
              <input
                type="checkbox"
                checked={isFreeShipping}
                onChange={e => {
                  setIsFreeShipping(e.target.checked);
                  if (e.target.checked) setShippingFee(0);
                }}
                className="rounded text-teal-600 w-4 h-4 cursor-pointer"
              />
              <div>
                <span className="block font-black text-teal-900">🌟 Offer Free Shipping for this product</span>
                <span className="block text-[10.5px] text-teal-700 font-normal">
                  Zero delivery charge at checkout for customer regardless of weight.
                </span>
              </div>
            </label>

            {!isFreeShipping && (
              <div className="pt-2 border-t border-teal-200/60 flex items-center justify-between gap-3">
                <span className="text-[11px] font-bold text-slate-700">Custom Shipping Fee (₹):</span>
                <div className="flex items-center gap-1.5 w-32">
                  <span className="font-mono font-bold text-slate-500">₹</span>
                  <input
                    type="number"
                    min="0"
                    step="1"
                    value={shippingFee}
                    onChange={e => setShippingFee(Number(e.target.value))}
                    placeholder="e.g. 49"
                    className="w-full p-1.5 bg-white border border-slate-300 rounded-lg text-xs font-mono font-bold text-slate-900 outline-hidden"
                  />
                </div>
              </div>
            )}
          </div>

          {/* Optional Weight & Dimensions */}
          <div className="p-3 bg-slate-50 border border-slate-200 rounded-xl space-y-3">
            <div className="flex items-center justify-between">
              <span className="font-bold text-xs text-slate-800 flex items-center gap-1.5">
                <Scale className="w-3.5 h-3.5 text-indigo-600" />
                <span>Package Weight &amp; Dimensions (Optional)</span>
              </span>
              <span className="text-[10px] text-slate-500 font-mono">Used for PIN code rates</span>
            </div>

            <div>
              <label className="font-bold text-slate-700 block mb-1">
                Dead Weight (in Grams) <span className="font-normal text-slate-400">(Optional)</span>
              </label>
              <div className="flex items-center gap-2">
                <input
                  type="number"
                  min="0"
                  step="10"
                  value={weightGrams}
                  onChange={e => setWeightGrams(e.target.value)}
                  placeholder="e.g. 450 (Optional)"
                  className="w-full p-2 bg-white border border-slate-300 rounded-xl font-mono font-bold text-slate-900 outline-hidden focus:border-teal-500"
                />
                <span className="font-bold text-slate-500 font-mono text-[11px] whitespace-nowrap">
                  {numWeight > 0 ? `(${deadWeightKg} kg)` : 'Optional'}
                </span>
              </div>
            </div>

            <div className="space-y-1.5">
              <label className="font-bold text-slate-700 block">
                Package Dimensions (Length × Breadth × Height in cm) <span className="font-normal text-slate-400">(Optional)</span>
              </label>
              <div className="grid grid-cols-3 gap-2 font-mono">
                <div>
                  <span className="text-[10px] text-slate-500 font-bold block mb-1">Length (L)</span>
                  <input
                    type="number"
                    min="0"
                    step="0.5"
                    value={lengthCm}
                    onChange={e => setLengthCm(e.target.value)}
                    placeholder="Opt"
                    className="w-full p-2 bg-white border border-slate-300 rounded-lg font-bold text-center outline-hidden focus:border-teal-500"
                  />
                </div>
                <div>
                  <span className="text-[10px] text-slate-500 font-bold block mb-1">Breadth (B)</span>
                  <input
                    type="number"
                    min="0"
                    step="0.5"
                    value={widthCm}
                    onChange={e => setWidthCm(e.target.value)}
                    placeholder="Opt"
                    className="w-full p-2 bg-white border border-slate-300 rounded-lg font-bold text-center outline-hidden focus:border-teal-500"
                  />
                </div>
                <div>
                  <span className="text-[10px] text-slate-500 font-bold block mb-1">Height (H)</span>
                  <input
                    type="number"
                    min="0"
                    step="0.5"
                    value={heightCm}
                    onChange={e => setHeightCm(e.target.value)}
                    placeholder="Opt"
                    className="w-full p-2 bg-white border border-slate-300 rounded-lg font-bold text-center outline-hidden focus:border-teal-500"
                  />
                </div>
              </div>
            </div>

            {/* Volumetric Calculation Card */}
            {hasDimensions || numWeight > 0 ? (
              <div className="p-3 bg-indigo-50/70 border border-indigo-200 rounded-xl space-y-1.5">
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
                    {chargeableKg} kg ({chargeableKg === deadWeightKg ? 'Dead Weight' : 'Volumetric'})
                  </span>
                </div>
              </div>
            ) : (
              <div className="p-2.5 bg-slate-100 rounded-lg text-[10.5px] text-slate-500 flex items-center gap-1.5">
                <HelpCircle className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                <span>Omitted. Product will use custom shipping fee or free shipping.</span>
              </div>
            )}
          </div>

          {/* Actions */}
          <div className="flex items-center justify-end gap-2 pt-2">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 rounded-xl text-slate-600 hover:bg-slate-100 font-bold transition cursor-pointer"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-5 py-2.5 bg-teal-700 hover:bg-teal-800 text-white rounded-xl font-bold flex items-center gap-1.5 shadow-md transition cursor-pointer"
            >
              <Save className="w-3.5 h-3.5" />
              <span>Save Logistics Configuration</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
