import React from 'react';
import { X, Printer, Download, ShieldCheck, CheckCircle2, Package, Sparkles } from 'lucide-react';
import { StoreOrder } from '../../types/store.ts';

interface StoreInvoiceModalProps {
  order: StoreOrder;
  onClose: () => void;
}

export const StoreInvoiceModal: React.FC<StoreInvoiceModalProps> = ({ order, onClose }) => {
  const handlePrint = () => {
    window.print();
  };

  // Tax calculations
  const isInterState = order.shippingAddress.state.toLowerCase() !== 'karnataka';
  const totalTax = order.taxAmountGst || Math.round(order.subtotal * 0.12);
  const cgst = isInterState ? 0 : totalTax / 2;
  const sgst = isInterState ? 0 : totalTax / 2;
  const igst = isInterState ? totalTax : 0;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-6 bg-slate-950/70 backdrop-blur-sm animate-fade-in overflow-y-auto">
      <div className="bg-white w-full max-w-3xl rounded-2xl shadow-2xl border border-slate-200 overflow-hidden my-auto flex flex-col max-h-[92vh]">
        {/* Header Action Bar */}
        <div className="px-5 py-3.5 bg-slate-900 text-white flex items-center justify-between border-b border-slate-800 print:hidden shrink-0">
          <div className="flex items-center gap-2">
            <span className="w-2.5 h-2.5 rounded-full bg-emerald-400 animate-pulse"></span>
            <span className="font-bold text-sm tracking-wide">Vernunt GST Tax Invoice</span>
            <span className="text-xs bg-slate-800 px-2 py-0.5 rounded text-slate-300 font-mono">
              {order.invoiceNumber}
            </span>
          </div>
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={handlePrint}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-rose-600 hover:bg-rose-700 text-white text-xs font-bold transition active:scale-95 cursor-pointer shadow-xs"
              title="Print Tax Invoice"
            >
              <Printer className="w-3.5 h-3.5" />
              <span>Print / PDF</span>
            </button>
            <button
              type="button"
              onClick={onClose}
              className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Printable Invoice Body */}
        <div className="p-6 sm:p-8 overflow-y-auto space-y-6 text-slate-800 text-xs leading-relaxed print:p-0 print:m-0" id="vernunt-printable-invoice">
          {/* Top Brand Header */}
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 border-b border-slate-200 pb-5">
            <div>
              <div className="flex items-center gap-2">
                <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-rose-700 to-amber-600 flex items-center justify-center text-white font-black text-lg shadow-sm">
                  V
                </div>
                <div>
                  <h1 className="text-xl font-black text-slate-900 tracking-tight flex items-center gap-1.5">
                    Vernunt Store <Sparkles className="w-4 h-4 text-amber-500" />
                  </h1>
                  <p className="text-[10px] text-slate-500 font-semibold tracking-wide uppercase">
                    India's 100% Verified Kids Network & Play Store
                  </p>
                </div>
              </div>
              <div className="mt-2 text-[11px] text-slate-600 space-y-0.5">
                <p className="font-semibold text-slate-800">Vernunt Technologies Pvt. Ltd.</p>
                <p>Ground Floor, HSR Layout, Sector 2, Bengaluru, Karnataka 560102</p>
                <p><strong className="text-slate-700">GSTIN:</strong> 29AAACV2026R1ZM | <strong className="text-slate-700">CIN:</strong> U72900KA2026PTC198234</p>
                <p><strong className="text-slate-700">Support:</strong> support@vernunt.com | WhatsApp: +91 8073749074</p>
              </div>
            </div>

            <div className="text-left sm:text-right bg-slate-50 border border-slate-200/80 p-3.5 rounded-xl min-w-[200px]">
              <span className="text-[10px] font-black uppercase text-rose-700 tracking-wider block">TAX INVOICE</span>
              <p className="text-base font-black font-mono text-slate-900 mt-0.5">{order.invoiceNumber}</p>
              <div className="mt-2 text-[11px] space-y-0.5 text-slate-600">
                <p><strong className="text-slate-700">Order ID:</strong> <span className="font-mono">{order.orderNumber}</span></p>
                <p><strong className="text-slate-700">Invoice Date:</strong> {order.placedAt}</p>
                <p><strong className="text-slate-700">Payment:</strong> <span className="text-emerald-700 font-bold">{order.paymentMethod} ({order.paymentStatus.toUpperCase()})</span></p>
                {order.paymentReferenceId && (
                  <p className="text-[9.5px] font-mono text-slate-500 truncate max-w-[210px]" title={order.paymentReferenceId}>
                    Ref: {order.paymentReferenceId}
                  </p>
                )}
              </div>
            </div>
          </div>

          {/* Billing & Shipping Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="bg-slate-50/70 p-3.5 rounded-xl border border-slate-200">
              <h3 className="text-[10px] font-black uppercase tracking-wider text-slate-500 mb-1.5">Billed To (Customer):</h3>
              <p className="font-bold text-slate-900 text-sm">{order.customerName}</p>
              <p className="text-slate-600 mt-0.5">{order.billingAddress?.addressLine1 || order.shippingAddress.addressLine1}</p>
              {order.shippingAddress.landmark && <p className="text-slate-500">Landmark: {order.shippingAddress.landmark}</p>}
              <p className="text-slate-600 font-semibold">{order.shippingAddress.city}, {order.shippingAddress.state} - {order.shippingAddress.pincode}</p>
              <p className="text-slate-600 mt-1"><strong>Phone:</strong> {order.customerPhone}</p>
              <p className="text-slate-600"><strong>Email:</strong> {order.customerEmail}</p>
            </div>

            <div className="bg-slate-50/70 p-3.5 rounded-xl border border-slate-200">
              <h3 className="text-[10px] font-black uppercase tracking-wider text-slate-500 mb-1.5">Shipping & Courier Details:</h3>
              <div className="flex items-center gap-2 mb-1">
                <span className="px-2 py-0.5 rounded bg-blue-100 text-blue-800 font-bold text-[10px]">
                  {order.shippingMethod === 'express' ? '⚡ Express 24H Courier' : order.shippingMethod === 'instant' ? '🚀 Instant Playdate Drop' : '📦 Standard Surface'}
                </span>
                <span className="px-2 py-0.5 rounded bg-emerald-100 text-emerald-800 font-bold text-[10px] capitalize">
                  {order.orderStatus.replace('_', ' ')}
                </span>
              </div>
              <p className="text-slate-700 mt-1"><strong>Courier Partner:</strong> {order.courierPartner || 'BlueDart Express Logistics'}</p>
              <p className="text-slate-700 font-mono"><strong>AWB / Tracking:</strong> {order.trackingNumber || 'VRN-TRK-' + order.orderNumber.replace(/[^0-9]/g, '')}</p>
              <p className="text-[10px] text-slate-500 mt-1">Child-safe packaging with tamper-evident seal and eco-cushioning.</p>
            </div>
          </div>

          {/* Line Items Table */}
          <div className="border border-slate-200 rounded-xl overflow-hidden shadow-2xs">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-slate-100 text-slate-700 font-bold text-[11px] border-b border-slate-200">
                  <th className="py-2.5 px-3">#</th>
                  <th className="py-2.5 px-3">Product Description</th>
                  <th className="py-2.5 px-2 text-center">HSN</th>
                  <th className="py-2.5 px-2 text-center">Qty</th>
                  <th className="py-2.5 px-3 text-right">Unit Price</th>
                  <th className="py-2.5 px-2 text-center">GST %</th>
                  <th className="py-2.5 px-3 text-right">Total (₹)</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-[11px]">
                {order.items.map((item, idx) => (
                  <tr key={item.id || idx} className="hover:bg-slate-50/50">
                    <td className="py-2.5 px-3 font-mono text-slate-400">{idx + 1}</td>
                    <td className="py-2.5 px-3 font-medium text-slate-900">
                      <div>
                        <span className="font-bold">{item.product?.name || 'Vernunt Play Product'}</span>
                        {item.selectedAttributes && Object.keys(item.selectedAttributes).length > 0 && (
                          <span className="text-[10px] text-slate-500 block font-normal">
                            {Object.entries(item.selectedAttributes).map(([k, v]) => `${k}: ${v}`).join(' | ')}
                          </span>
                        )}
                        <span className="text-[9.5px] text-slate-400 font-mono block">SKU: {item.product?.sku || 'VRN-SKU'}</span>
                      </div>
                    </td>
                    <td className="py-2.5 px-2 text-center font-mono text-slate-500">{item.product?.hsnCode || '950300'}</td>
                    <td className="py-2.5 px-2 text-center font-bold">{item.quantity}</td>
                    <td className="py-2.5 px-3 text-right font-mono">₹{item.unitPrice.toLocaleString('en-IN')}</td>
                    <td className="py-2.5 px-2 text-center font-mono">{item.gstRate || 12}%</td>
                    <td className="py-2.5 px-3 text-right font-mono font-bold text-slate-900">
                      ₹{(item.unitPrice * item.quantity).toLocaleString('en-IN')}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Totals & Tax Breakdown Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 items-start">
            <div className="bg-slate-50/60 p-4 rounded-xl border border-slate-200 text-[11px] space-y-2">
              <h4 className="font-bold text-slate-800 uppercase text-[10px] tracking-wide flex items-center gap-1.5">
                <ShieldCheck className="w-4 h-4 text-emerald-600" /> Vernunt Safe Guarantee & Return Policy
              </h4>
              <p className="text-slate-600">
                • 7-Day Hassle-Free Return & Replacement on all non-digital toys & safety items.
              </p>
              <p className="text-slate-600">
                • 100% Non-toxic certified and BIS compliant for child health protection.
              </p>
              <p className="text-slate-600">
                • For returns or queries, visit the Vernunt Store tab in-app or reach us at <strong className="text-slate-700">support@vernunt.com</strong>.
              </p>
            </div>

            <div className="space-y-1.5 text-[11.5px]">
              <div className="flex justify-between py-1 border-b border-slate-100 text-slate-600">
                <span>Items Subtotal:</span>
                <span className="font-mono font-semibold text-slate-800">₹{order.subtotal.toLocaleString('en-IN')}</span>
              </div>
              {order.discountAmount > 0 && (
                <div className="flex justify-between py-1 border-b border-slate-100 text-emerald-700 font-semibold">
                  <span>Promo Discount ({order.appliedCouponCode || 'Discount'}):</span>
                  <span className="font-mono">-₹{order.discountAmount.toLocaleString('en-IN')}</span>
                </div>
              )}
              <div className="flex justify-between py-1 border-b border-slate-100 text-slate-600">
                <span>Shipping & Handling:</span>
                <span className="font-mono font-semibold text-slate-800">
                  {order.shippingFee === 0 ? <span className="text-emerald-600 font-bold">FREE</span> : `₹${order.shippingFee}`}
                </span>
              </div>
              {!isInterState ? (
                <>
                  <div className="flex justify-between py-0.5 text-slate-500 text-[10.5px]">
                    <span>CGST (6%):</span>
                    <span className="font-mono">₹{Math.round(cgst).toLocaleString('en-IN')}</span>
                  </div>
                  <div className="flex justify-between py-0.5 text-slate-500 text-[10.5px]">
                    <span>SGST (6%):</span>
                    <span className="font-mono">₹{Math.round(sgst).toLocaleString('en-IN')}</span>
                  </div>
                </>
              ) : (
                <div className="flex justify-between py-0.5 text-slate-500 text-[10.5px]">
                  <span>IGST (12%):</span>
                  <span className="font-mono">₹{Math.round(igst).toLocaleString('en-IN')}</span>
                </div>
              )}
              <div className="flex justify-between py-2 border-t-2 border-slate-900 text-sm font-black text-slate-900">
                <span>Grand Total (Incl. Taxes):</span>
                <span className="font-mono text-rose-700 text-base">₹{order.totalAmount.toLocaleString('en-IN')}</span>
              </div>
            </div>
          </div>

          {/* Footer Signature */}
          <div className="border-t border-slate-200 pt-4 flex flex-col sm:flex-row items-center justify-between gap-3 text-[10px] text-slate-500">
            <div className="flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 text-emerald-600" />
              <span>This is a computer generated tax invoice and does not require physical signature.</span>
            </div>
            <div className="text-right">
              <p className="font-bold text-slate-700">For Vernunt Technologies Pvt. Ltd.</p>
              <p className="italic text-slate-400">Authorized Signatory</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
