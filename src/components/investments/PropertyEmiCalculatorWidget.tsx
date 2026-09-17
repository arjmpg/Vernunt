import React, { useState, useMemo } from 'react';
import { calculateMonthlyEmi } from '../../data/kidsInvestmentData.ts';
import { Calculator, Percent, Clock, DollarSign, ArrowRight, ShieldCheck, CheckCircle2, ChevronDown, ChevronUp } from 'lucide-react';

interface PropertyEmiCalculatorWidgetProps {
  initialPrice?: number;
  initialDownPayment?: number;
  initialTenure?: number;
  initialRate?: number;
  compact?: boolean;
  propertyTitle?: string;
  onApplyFilter?: (maxEmi: number) => void;
  onConnectWithEmi?: (emiDetails: { 
    emi: number; 
    price: number; 
    downPayment: number; 
    tenure: number; 
    rate: number;
    loanAmount: number;
    totalInterest: number;
  }) => void;
}

export default function PropertyEmiCalculatorWidget({
  initialPrice = 800000,
  initialDownPayment,
  initialTenure = 15,
  initialRate = 8.5,
  compact = false,
  propertyTitle,
  onApplyFilter,
  onConnectWithEmi
}: PropertyEmiCalculatorWidgetProps) {
  // State for Price, Down Payment percentage, Tenure in years, Interest Rate
  const [propertyPrice, setPropertyPrice] = useState<number>(initialPrice);
  const defaultDownPct = initialDownPayment !== undefined 
    ? Math.min(60, Math.max(10, Math.round((initialDownPayment / Math.max(1, initialPrice)) * 100))) 
    : 20;
  const [downPaymentPct, setDownPaymentPct] = useState<number>(defaultDownPct);
  const [tenureYears, setTenureYears] = useState<number>(initialTenure);
  const [interestRate, setInterestRate] = useState<number>(initialRate);
  const [showAmortizationDetails, setShowAmortizationDetails] = useState<boolean>(false);

  // Math calculations
  const downPaymentAmount = Math.round((propertyPrice * downPaymentPct) / 100);
  const loanPrincipal = Math.max(0, propertyPrice - downPaymentAmount);
  
  const monthlyEmi = useMemo(() => {
    return calculateMonthlyEmi(loanPrincipal, interestRate, tenureYears);
  }, [loanPrincipal, interestRate, tenureYears]);

  const totalPayment = monthlyEmi * tenureYears * 12;
  const totalInterest = Math.max(0, totalPayment - loanPrincipal);
  const principalSharePct = totalPayment > 0 ? Math.round((loanPrincipal / totalPayment) * 100) : 50;
  const interestSharePct = 100 - principalSharePct;

  // Preset low cost property prices
  const lowCostPricePresets = [
    { label: '₹4 Lakhs', value: 400000 },
    { label: '₹6 Lakhs', value: 600000 },
    { label: '₹8 Lakhs', value: 800000 },
    { label: '₹12 Lakhs', value: 1200000 },
    { label: '₹18 Lakhs', value: 1800000 },
    { label: '₹25 Lakhs', value: 2500000 }
  ];

  if (compact) {
    return (
      <div className="bg-emerald-50/70 border border-emerald-200/80 rounded-2xl p-4 text-left space-y-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-1.5 text-xs font-bold text-emerald-900">
            <Calculator className="w-3.5 h-3.5 text-emerald-700" />
            <span>EMI Calculator {propertyTitle ? `• ${propertyTitle}` : ''}</span>
          </div>
          <span className="text-[10.5px] font-mono font-bold bg-white px-2 py-0.5 rounded-md text-emerald-800 border border-emerald-200">
            @ {interestRate}% p.a.
          </span>
        </div>

        {/* Quick Sliders */}
        <div className="grid grid-cols-2 gap-3 text-xs">
          <div>
            <div className="flex justify-between text-[11px] text-slate-600 mb-1">
              <span>Down Payment</span>
              <span className="font-mono font-bold">{downPaymentPct}% (₹{(downPaymentAmount / 1000).toFixed(0)}k)</span>
            </div>
            <input 
              type="range" 
              min={10} 
              max={50} 
              step={5} 
              value={downPaymentPct} 
              onChange={e => setDownPaymentPct(Number(e.target.value))}
              className="w-full h-1.5 bg-emerald-200 rounded-lg appearance-none cursor-pointer accent-emerald-600"
            />
          </div>

          <div>
            <div className="flex justify-between text-[11px] text-slate-600 mb-1">
              <span>Tenure</span>
              <span className="font-mono font-bold">{tenureYears} Years</span>
            </div>
            <input 
              type="range" 
              min={5} 
              max={25} 
              step={5} 
              value={tenureYears} 
              onChange={e => setTenureYears(Number(e.target.value))}
              className="w-full h-1.5 bg-emerald-200 rounded-lg appearance-none cursor-pointer accent-emerald-600"
            />
          </div>
        </div>

        {/* Calculated Result Box */}
        <div className="bg-white rounded-xl p-2.5 border border-emerald-200 flex items-center justify-between">
          <div>
            <span className="text-[10px] uppercase font-bold text-slate-500 block">Estimated Monthly Payment</span>
            <span className="text-base font-mono font-black text-emerald-700">
              ₹{monthlyEmi.toLocaleString('en-IN')}<span className="text-xs font-normal text-slate-500">/mo</span>
            </span>
          </div>

          <div className="text-right text-[11px] text-slate-600">
            <div>Loan: <strong className="font-mono">₹{(loanPrincipal / 100000).toFixed(2)}L</strong></div>
            <div>Interest: <strong className="font-mono">₹{(totalInterest / 100000).toFixed(2)}L</strong></div>
          </div>
        </div>

        {onConnectWithEmi && (
          <button
            type="button"
            onClick={() => onConnectWithEmi({
              emi: monthlyEmi,
              price: propertyPrice,
              downPayment: downPaymentAmount,
              tenure: tenureYears,
              rate: interestRate,
              loanAmount: loanPrincipal,
              totalInterest
            })}
            className="w-full py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold transition flex items-center justify-center gap-1.5 cursor-pointer shadow-xs"
          >
            <span>Proceed with this EMI (₹{monthlyEmi.toLocaleString('en-IN')}/mo)</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </button>
        )}
      </div>
    );
  }

  return (
    <div className="bg-white rounded-3xl border border-emerald-200/90 shadow-sm p-5 sm:p-7 text-left space-y-6">
      {/* Widget Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-100 pb-4">
        <div>
          <div className="flex items-center gap-2">
            <span className="w-8 h-8 rounded-xl bg-emerald-100 text-emerald-800 flex items-center justify-center font-bold text-base">
              🧮
            </span>
            <h3 className="font-serif font-black text-slate-900 text-lg sm:text-xl">
              Low Cost Property Loan &amp; EMI Calculator
            </h3>
          </div>
          <p className="text-xs sm:text-sm text-slate-500 mt-1">
            Simulate monthly payment estimates for kid future residential plots and sites based on standard bank interest rates (SBI, HDFC, ICICI).
          </p>
        </div>

        <div className="flex items-center gap-2 self-start sm:self-auto bg-slate-50 px-3 py-1.5 rounded-xl border border-slate-200 text-xs text-slate-700 font-medium">
          <ShieldCheck className="w-4 h-4 text-emerald-600 shrink-0" />
          <span>Standard Rate: <strong>{interestRate}% p.a.</strong></span>
        </div>
      </div>

      {/* Main Controls Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 items-start">
        {/* Left Column: Sliders & Controls */}
        <div className="space-y-5">
          {/* 1. Property Cost */}
          <div className="space-y-2">
            <div className="flex justify-between items-center text-xs font-bold text-slate-700">
              <span>Total Property Cost</span>
              <span className="font-mono text-emerald-700 text-sm">
                ₹{(propertyPrice / 100000).toFixed(2)} Lakhs (₹{propertyPrice.toLocaleString('en-IN')})
              </span>
            </div>

            <input 
              type="range" 
              min={200000} 
              max={3500000} 
              step={50000} 
              value={propertyPrice} 
              onChange={e => setPropertyPrice(Number(e.target.value))}
              className="w-full h-2 bg-slate-100 rounded-lg appearance-none cursor-pointer accent-emerald-600"
            />

            {/* Quick Price Presets */}
            <div className="flex flex-wrap gap-1.5 pt-1">
              <span className="text-[10px] text-slate-400 font-semibold self-center mr-1">Low Cost Presets:</span>
              {lowCostPricePresets.map(preset => (
                <button
                  key={preset.value}
                  type="button"
                  onClick={() => setPropertyPrice(preset.value)}
                  className={`text-[11px] px-2.5 py-1 rounded-lg font-mono font-bold transition cursor-pointer ${
                    propertyPrice === preset.value
                      ? 'bg-emerald-600 text-white shadow-xs'
                      : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
                  }`}
                >
                  {preset.label}
                </button>
              ))}
            </div>
          </div>

          {/* 2. Down Payment */}
          <div className="space-y-2">
            <div className="flex justify-between items-center text-xs font-bold text-slate-700">
              <span>Down Payment ({downPaymentPct}%)</span>
              <span className="font-mono text-slate-900 text-sm">
                ₹{downPaymentAmount.toLocaleString('en-IN')}
              </span>
            </div>

            <input 
              type="range" 
              min={10} 
              max={50} 
              step={5} 
              value={downPaymentPct} 
              onChange={e => setDownPaymentPct(Number(e.target.value))}
              className="w-full h-2 bg-slate-100 rounded-lg appearance-none cursor-pointer accent-emerald-600"
            />

            <div className="flex justify-between text-[10px] text-slate-400">
              <span>10% (Minimum)</span>
              <span>20% (Standard)</span>
              <span>50% (High Equity)</span>
            </div>
          </div>

          {/* 3. Tenure & Rate in 2 Columns */}
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <div className="flex justify-between text-xs font-bold text-slate-700">
                <span>Loan Tenure</span>
                <span className="font-mono text-emerald-700">{tenureYears} Yrs</span>
              </div>
              <div className="flex gap-1">
                {[5, 10, 15, 20, 25].map(yrs => (
                  <button
                    key={yrs}
                    type="button"
                    onClick={() => setTenureYears(yrs)}
                    className={`flex-1 py-1.5 text-xs font-mono font-bold rounded-lg transition cursor-pointer ${
                      tenureYears === yrs 
                        ? 'bg-slate-900 text-white' 
                        : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                    }`}
                  >
                    {yrs}y
                  </button>
                ))}
              </div>
            </div>

            <div className="space-y-2">
              <div className="flex justify-between text-xs font-bold text-slate-700">
                <span>Interest Rate</span>
                <span className="font-mono text-emerald-700">{interestRate}% p.a.</span>
              </div>
              <div className="flex gap-1">
                {[8.0, 8.5, 9.0, 9.5].map(rate => (
                  <button
                    key={rate}
                    type="button"
                    onClick={() => setInterestRate(rate)}
                    className={`flex-1 py-1.5 text-xs font-mono font-bold rounded-lg transition cursor-pointer ${
                      interestRate === rate 
                        ? 'bg-emerald-600 text-white' 
                        : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                    }`}
                  >
                    {rate}%
                  </button>
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* Right Column: Key Breakdown & Display Card */}
        <div className="bg-gradient-to-br from-emerald-900 via-slate-900 to-slate-950 rounded-3xl p-6 text-white flex flex-col justify-between space-y-6 shadow-md">
          <div className="space-y-4">
            <span className="text-xs uppercase font-black tracking-wider text-emerald-400 flex items-center gap-1.5">
              <Percent className="w-3.5 h-3.5" />
              Monthly Payment Estimate
            </span>

            <div className="space-y-1">
              <div className="text-3xl sm:text-4xl font-mono font-black tracking-tight text-white">
                ₹{monthlyEmi.toLocaleString('en-IN')}
                <span className="text-sm sm:text-base font-normal text-emerald-300 ml-1">/month</span>
              </div>
              <p className="text-xs text-slate-300">
                For a <strong>{tenureYears}-year</strong> plot purchase loan @ <strong>{interestRate}%</strong> interest rate.
              </p>
            </div>

            {/* Visual Breakdown Bar */}
            <div className="space-y-1.5 pt-2">
              <div className="flex justify-between text-[11px] text-slate-300">
                <span className="flex items-center gap-1">
                  <span className="w-2.5 h-2.5 rounded-full bg-emerald-400 inline-block" />
                  Principal: ₹{(loanPrincipal / 100000).toFixed(2)}L ({principalSharePct}%)
                </span>
                <span className="flex items-center gap-1">
                  <span className="w-2.5 h-2.5 rounded-full bg-amber-400 inline-block" />
                  Interest: ₹{(totalInterest / 100000).toFixed(2)}L ({interestSharePct}%)
                </span>
              </div>
              
              <div className="w-full h-3 bg-slate-800 rounded-full overflow-hidden flex">
                <div 
                  className="bg-emerald-400 h-full transition-all duration-300"
                  style={{ width: `${principalSharePct}%` }}
                />
                <div 
                  className="bg-amber-400 h-full transition-all duration-300"
                  style={{ width: `${interestSharePct}%` }}
                />
              </div>
            </div>

            {/* Quick Summary Grid */}
            <div className="grid grid-cols-2 gap-2 pt-2 text-xs">
              <div className="bg-white/10 rounded-xl p-2.5 backdrop-blur-xs">
                <span className="text-[10px] text-slate-300 block">Loan Principal</span>
                <span className="font-mono font-bold text-sm text-white">
                  ₹{loanPrincipal.toLocaleString('en-IN')}
                </span>
              </div>

              <div className="bg-white/10 rounded-xl p-2.5 backdrop-blur-xs">
                <span className="text-[10px] text-slate-300 block">Total Repayment</span>
                <span className="font-mono font-bold text-sm text-white">
                  ₹{totalPayment.toLocaleString('en-IN')}
                </span>
              </div>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="space-y-2 pt-2">
            {onApplyFilter && (
              <button
                type="button"
                onClick={() => onApplyFilter(monthlyEmi)}
                className="w-full py-2.5 bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold rounded-xl text-xs transition flex items-center justify-center gap-1.5 cursor-pointer shadow-md"
              >
                <span>Filter Properties Matching ~₹{monthlyEmi.toLocaleString('en-IN')}/mo EMI</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </button>
            )}

            <button
              type="button"
              onClick={() => setShowAmortizationDetails(!showAmortizationDetails)}
              className="w-full py-2 bg-white/10 hover:bg-white/15 text-slate-200 text-xs font-semibold rounded-xl transition flex items-center justify-center gap-1 cursor-pointer"
            >
              <span>{showAmortizationDetails ? 'Hide Payment Amortization Schedule' : 'View Payment Amortization Schedule'}</span>
              {showAmortizationDetails ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
            </button>
          </div>
        </div>
      </div>

      {/* Expanded Amortization Schedule */}
      {showAmortizationDetails && (
        <div className="mt-4 pt-4 border-t border-slate-100 space-y-3 animate-fade-in">
          <div className="flex items-center justify-between">
            <h4 className="font-serif font-black text-slate-900 text-sm">
              Year-by-Year Loan Repayment Projection
            </h4>
            <span className="text-[11px] text-slate-500">
              {tenureYears} Years @ {interestRate}% p.a.
            </span>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs border border-slate-200 rounded-xl overflow-hidden">
              <thead className="bg-slate-50 text-slate-600 font-bold border-b border-slate-200">
                <tr>
                  <th className="p-2.5">Year</th>
                  <th className="p-2.5">Opening Balance</th>
                  <th className="p-2.5">Yearly EMI Paid</th>
                  <th className="p-2.5">Principal Repaid</th>
                  <th className="p-2.5">Interest Paid</th>
                  <th className="p-2.5">Closing Balance</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 font-mono">
                {Array.from({ length: Math.min(10, tenureYears) }).map((_, idx) => {
                  const yr = idx + 1;
                  const yearlyEmi = monthlyEmi * 12;
                  const approximateInterest = Math.round(loanPrincipal * (interestRate / 100) * (1 - (idx / tenureYears) * 0.7));
                  const approximatePrincipal = Math.max(0, yearlyEmi - approximateInterest);
                  const closingBal = Math.max(0, loanPrincipal - (approximatePrincipal * yr));
                  const openingBal = closingBal + approximatePrincipal;

                  return (
                    <tr key={yr} className="hover:bg-slate-50/80">
                      <td className="p-2.5 font-sans font-bold text-slate-800">Year {yr}</td>
                      <td className="p-2.5 text-slate-600">₹{openingBal.toLocaleString('en-IN')}</td>
                      <td className="p-2.5 font-bold text-emerald-700">₹{yearlyEmi.toLocaleString('en-IN')}</td>
                      <td className="p-2.5 text-slate-800">₹{approximatePrincipal.toLocaleString('en-IN')}</td>
                      <td className="p-2.5 text-amber-700">₹{approximateInterest.toLocaleString('en-IN')}</td>
                      <td className="p-2.5 font-bold text-slate-900">₹{closingBal.toLocaleString('en-IN')}</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
          <p className="text-[11px] text-slate-400 text-right">
            *Amortization schedule shows standard reducing balance model indicative for housing finance institutions.
          </p>
        </div>
      )}
    </div>
  );
}
