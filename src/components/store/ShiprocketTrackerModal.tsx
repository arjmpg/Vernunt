import React, { useState, useEffect } from 'react';
import { 
  X, Truck, Package, CheckCircle2, Clock, MapPin, 
  RefreshCw, ExternalLink, ShieldCheck, ArrowRight,
  Printer, Copy, Check, AlertCircle, Barcode, Phone, Calendar
} from 'lucide-react';
import { ShiprocketTrackingResponse } from '../../types/shiprocket.ts';
import { ShiprocketClient } from '../../services/shiprocketClient.ts';
import { StoreOrder } from '../../types/store.ts';

interface ShiprocketTrackerModalProps {
  awb?: string;
  order?: StoreOrder;
  onClose: () => void;
}

export const ShiprocketTrackerModal: React.FC<ShiprocketTrackerModalProps> = ({
  awb: initialAwb,
  order,
  onClose
}) => {
  const effectiveAwb = initialAwb || order?.shiprocketAwb || order?.trackingNumber || 'DEL893201842';
  const [trackingAwb, setTrackingAwb] = useState<string>(effectiveAwb);
  const [inputAwb, setInputAwb] = useState<string>(effectiveAwb);
  const [trackingData, setTrackingData] = useState<ShiprocketTrackingResponse | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [copiedAwb, setCopiedAwb] = useState<boolean>(false);

  useEffect(() => {
    fetchTracking(trackingAwb);
  }, [trackingAwb]);

  const fetchTracking = async (code: string) => {
    setIsLoading(true);
    try {
      const data = await ShiprocketClient.trackShipment(code);
      setTrackingData(data);
    } catch (e) {
      console.warn('Failed to load tracking:', e);
    } finally {
      setIsLoading(false);
    }
  };

  const handleCopyAwb = () => {
    navigator.clipboard.writeText(trackingAwb);
    setCopiedAwb(true);
    setTimeout(() => setCopiedAwb(false), 2000);
  };

  // Status mapping for progress stepper
  const getStepProgress = (status: string = ''): number => {
    const s = status.toLowerCase();
    if (s.includes('deliver') || s.includes('completed')) return 5;
    if (s.includes('out for delivery') || s.includes('reached destination')) return 4;
    if (s.includes('transit') || s.includes('departed')) return 3;
    if (s.includes('pickup') || s.includes('picked') || s.includes('collected')) return 2;
    return 1; // Manifested / AWB Assigned
  };

  const currentStep = getStepProgress(trackingData?.current_status || order?.orderStatus);

  const steps = [
    { title: 'Ordered & Packed', desc: 'Child-safe verified packaging' },
    { title: 'AWB Assigned', desc: 'Manifest created on Shiprocket' },
    { title: 'Picked Up', desc: 'Handed to courier partner' },
    { title: 'In Transit', desc: 'Moving between logistics hubs' },
    { title: 'Delivered', desc: 'Handed to parent with OTP' }
  ];

  return (
    <div 
      className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-6 bg-slate-950/75 backdrop-blur-xs overflow-y-auto animate-fade-in"
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div className="bg-white w-full max-w-2xl rounded-3xl shadow-2xl border border-slate-200 overflow-hidden my-auto flex flex-col max-h-[92vh] animate-scale-up text-left">
        {/* Header Bar */}
        <div className="bg-gradient-to-r from-slate-900 via-indigo-950 to-slate-900 text-white p-5 flex items-center justify-between border-b border-indigo-900/50">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center text-white shadow-md">
              <Truck className="w-5 h-5 text-white" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="font-black text-sm sm:text-base tracking-tight text-white">
                  Shiprocket Live Parcel Tracking
                </h3>
                <span className="bg-indigo-500/30 text-indigo-300 text-[10px] font-black uppercase px-2 py-0.5 rounded-full border border-indigo-400/30">
                  ⚡ Official Engine
                </span>
              </div>
              <p className="text-[11px] text-slate-300">
                Real-time scans directly from Shiprocket national courier network
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => fetchTracking(trackingAwb)}
              disabled={isLoading}
              className="p-2 rounded-xl text-slate-400 hover:text-white hover:bg-slate-800 transition cursor-pointer"
              title="Refresh tracking data"
            >
              <RefreshCw className={`w-4 h-4 ${isLoading ? 'animate-spin text-indigo-400' : ''}`} />
            </button>
            <button
              type="button"
              onClick={onClose}
              className="p-2 rounded-xl text-slate-400 hover:text-white hover:bg-slate-800 transition cursor-pointer"
              aria-label="Close"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Content Body */}
        <div className="p-5 sm:p-6 overflow-y-auto space-y-6">
          {/* Quick AWB Search Bar */}
          <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 bg-slate-50 p-3.5 rounded-2xl border border-slate-200">
            <div className="flex items-center gap-2 flex-1">
              <Barcode className="w-5 h-5 text-slate-500 shrink-0" />
              <div className="min-w-0 flex-1">
                <span className="text-[10px] font-bold uppercase text-slate-400 block">Air Waybill (AWB):</span>
                <div className="flex items-center gap-2">
                  <span className="font-mono font-black text-sm text-slate-900 tracking-wider">
                    {trackingAwb}
                  </span>
                  <button
                    type="button"
                    onClick={handleCopyAwb}
                    className="p-1 text-slate-500 hover:text-indigo-600 transition"
                    title="Copy AWB code"
                  >
                    {copiedAwb ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5" />}
                  </button>
                </div>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <a
                href={`/api/shiprocket/label/${trackingAwb}`}
                target="_blank"
                rel="noreferrer"
                className="px-3 py-1.5 bg-white border border-slate-200 hover:bg-slate-100 text-slate-700 text-xs font-bold rounded-xl transition flex items-center gap-1.5 cursor-pointer shadow-2xs"
                title="View Official Shiprocket Printable Label"
              >
                <Printer className="w-3.5 h-3.5 text-indigo-600" />
                <span>Label</span>
              </a>
              <span className="px-3 py-1 bg-emerald-100 text-emerald-800 text-xs font-bold rounded-xl border border-emerald-200">
                {trackingData?.courier_name || order?.courierPartner || 'Delhivery Express'}
              </span>
            </div>
          </div>

          {/* Shipment Key Status Card */}
          <div className="bg-gradient-to-br from-indigo-50/70 to-purple-50/70 p-4 sm:p-5 rounded-2xl border border-indigo-100 space-y-3">
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2">
              <div>
                <span className="text-[10px] font-black uppercase text-indigo-700 tracking-wider block">
                  Current Shipment Status
                </span>
                <h4 className="text-base sm:text-lg font-black text-slate-900 flex items-center gap-2 mt-0.5">
                  <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-pulse"></span>
                  {trackingData?.current_status || 'In Transit • Moving on Schedule'}
                </h4>
              </div>

              <div className="text-left sm:text-right">
                <span className="text-[10px] font-bold text-slate-500 block uppercase">Estimated Delivery:</span>
                <span className="font-black text-xs sm:text-sm text-slate-900 bg-white px-2.5 py-1 rounded-lg border border-indigo-200 shadow-2xs inline-block mt-0.5">
                  📅 {trackingData?.estimated_delivery_date || 'Within 2-3 Business Days'}
                </span>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3 text-xs pt-2 border-t border-indigo-200/60 text-slate-700">
              <div>
                <span className="text-[10px] font-bold text-slate-400 block uppercase">Dispatch Origin:</span>
                <span className="font-semibold text-slate-800 truncate block">
                  📍 {trackingData?.origin || 'Vernunt Central Dispatch Hub, Bengaluru'}
                </span>
              </div>
              <div>
                <span className="text-[10px] font-bold text-slate-400 block uppercase">Destination:</span>
                <span className="font-semibold text-slate-800 truncate block">
                  🎯 {order?.shippingAddress ? `${order.shippingAddress.city} (${order.shippingAddress.pincode})` : (trackingData?.destination || 'Destination City')}
                </span>
              </div>
            </div>
          </div>

          {/* Stepper Progress Bar */}
          <div className="space-y-3">
            <h5 className="font-black text-xs uppercase tracking-wider text-slate-700 flex items-center gap-1.5">
              <Clock className="w-4 h-4 text-indigo-600" /> Milestone Tracking Journey
            </h5>

            <div className="grid grid-cols-5 gap-1 relative text-center">
              {steps.map((st, idx) => {
                const stepNum = idx + 1;
                const isPassed = stepNum <= currentStep;
                const isCurrent = stepNum === currentStep;

                return (
                  <div key={idx} className="flex flex-col items-center relative">
                    <div 
                      className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-black transition-all ${
                        isPassed 
                          ? 'bg-indigo-600 text-white shadow-md' 
                          : 'bg-slate-100 text-slate-400 border border-slate-200'
                      } ${isCurrent ? 'ring-4 ring-indigo-200 scale-105' : ''}`}
                    >
                      {isPassed ? <Check className="w-4 h-4" /> : stepNum}
                    </div>
                    <span className={`text-[10px] sm:text-[11px] font-bold mt-1.5 leading-tight ${isPassed ? 'text-slate-900' : 'text-slate-400'}`}>
                      {st.title}
                    </span>
                    <span className="hidden sm:block text-[9px] text-slate-400 leading-tight mt-0.5 max-w-[90px]">
                      {st.desc}
                    </span>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Scans Timeline */}
          <div className="space-y-3 pt-2">
            <div className="flex items-center justify-between">
              <h5 className="font-black text-xs uppercase tracking-wider text-slate-700 flex items-center gap-1.5">
                <MapPin className="w-4 h-4 text-indigo-600" /> Live Shiprocket Hub Activity Logs
              </h5>
              <span className="text-[10px] text-slate-500 font-mono">
                {trackingData?.scans?.length || 0} scan updates
              </span>
            </div>

            <div className="border border-slate-200 rounded-2xl overflow-hidden bg-slate-50/50 p-4 space-y-4">
              {trackingData?.scans && trackingData.scans.length > 0 ? (
                <div className="relative pl-6 space-y-4 border-l-2 border-indigo-200 ml-2">
                  {trackingData.scans.map((scan, sIdx) => (
                    <div key={sIdx} className="relative text-xs">
                      <div className="absolute -left-[31px] top-1 w-3.5 h-3.5 rounded-full bg-indigo-600 border-2 border-white shadow-xs"></div>
                      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-1">
                        <span className="font-black text-slate-900 text-xs">
                          {scan.activity}
                        </span>
                        <span className="font-mono text-[10px] text-slate-400 bg-white px-2 py-0.5 rounded border border-slate-200 shrink-0">
                          {scan.date}
                        </span>
                      </div>
                      <div className="flex items-center gap-2 mt-0.5 text-slate-500 text-[11px]">
                        <span className="flex items-center gap-1">
                          <MapPin className="w-3 h-3 text-slate-400" /> {scan.location}
                        </span>
                        {scan.sr_status_label && (
                          <span className="bg-slate-200 text-slate-700 text-[9px] font-bold px-1.5 py-0.2 rounded">
                            {scan.sr_status_label}
                          </span>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="py-6 text-center text-slate-500 text-xs space-y-1">
                  <Package className="w-8 h-8 text-slate-300 mx-auto" />
                  <p className="font-semibold">Package registered with Shiprocket.</p>
                  <p className="text-[11px] text-slate-400">Hub scans update automatically as the package clears checkpoints.</p>
                </div>
              )}
            </div>
          </div>

          {/* Child-Safe Tamper-Proof Assurance */}
          <div className="bg-emerald-50 border border-emerald-200 p-3.5 rounded-xl flex items-center justify-between gap-3 text-xs text-emerald-900">
            <div className="flex items-center gap-2.5">
              <ShieldCheck className="w-5 h-5 text-emerald-600 shrink-0" />
              <div>
                <p className="font-bold">Shiprocket Safe-Kid Seal Assurance</p>
                <p className="text-[11px] text-emerald-700">Tamper-evident barcode seal inspected before courier dispatch.</p>
              </div>
            </div>
            <span className="font-mono font-black text-emerald-800 text-[11px] shrink-0 bg-white px-2 py-1 rounded border border-emerald-200">
              100% BIS Safe
            </span>
          </div>
        </div>

        {/* Modal Footer */}
        <div className="p-4 bg-slate-50 border-t border-slate-200 flex flex-col sm:flex-row items-center justify-between gap-3 text-xs">
          <div className="text-slate-500 text-[11px]">
            <span>Need delivery assistance? </span>
            <strong className="text-slate-800">dispatch@vernunt.com</strong>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="w-full sm:w-auto px-5 py-2.5 bg-slate-900 hover:bg-slate-800 text-white font-bold rounded-xl transition cursor-pointer"
          >
            Close Tracker
          </button>
        </div>
      </div>
    </div>
  );
};
