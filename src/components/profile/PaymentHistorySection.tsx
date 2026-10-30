import React, { useState, useEffect } from 'react';
import { 
  CreditCard, Search, ArrowUpRight, CheckCircle2, Clock, 
  AlertCircle, ShieldCheck, Download, Copy, Check, RefreshCw,
  ShoppingBag, ExternalLink, Calendar, ChevronRight
} from 'lucide-react';
import { collection, getDocs, query, where, orderBy, limit } from 'firebase/firestore';
import { db } from '../../utils/firebase.ts';
import { handleFirestoreError, OperationType } from '../../utils/firestoreErrorHandler.ts';
import type { ChildProfile } from '../../types.ts';

export interface PaymentHistoryRecord {
  id: string;
  orderId: string;
  amount: number;
  currency: string;
  status: 'PAID' | 'PENDING' | 'FAILED' | 'REFUNDED';
  createdAt: string;
  customerName?: string;
  customerEmail?: string;
  customerPhone?: string;
  itemTitle?: string;
  orderType?: string;
  paymentMethod?: string;
  paymentReference?: string;
  source?: 'firestore_orders' | 'firestore_payments' | 'local_store';
}

interface PaymentHistorySectionProps {
  userProfile: ChildProfile | null;
  onNavigateToStore?: () => void;
}

export function PaymentHistorySection({
  userProfile,
  onNavigateToStore
}: PaymentHistorySectionProps) {
  const [payments, setPayments] = useState<PaymentHistoryRecord[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [filterStatus, setFilterStatus] = useState<'ALL' | 'PAID' | 'PENDING' | 'FAILED'>('ALL');
  const [searchTerm, setSearchTerm] = useState<string>('');
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [selectedTx, setSelectedTx] = useState<PaymentHistoryRecord | null>(null);

  const fetchPaymentHistory = async () => {
    setLoading(true);
    setErrorMsg(null);

    const userEmail = (userProfile?.email || '').toLowerCase().trim();
    const userPhone = (userProfile?.phoneNumber || '').replace(/\D/g, '').slice(-10);
    const userId = userProfile?.id || '';

    const mergedMap = new Map<string, PaymentHistoryRecord>();

    // 1. Fetch from Firestore `orders` collection
    try {
      const ordersRef = collection(db, 'orders');
      const ordersSnap = await getDocs(ordersRef);
      ordersSnap.forEach((docSnap) => {
        const data = docSnap.data();
        const docPhone = String(data.customerPhone || data.phone || data.shippingAddress?.phone || '').replace(/\D/g, '').slice(-10);
        const docEmail = String(data.customerEmail || data.email || data.shippingAddress?.email || '').toLowerCase().trim();
        const docUserId = data.userId || data.customerId;

        const isMatch = (
          (userPhone && docPhone && userPhone === docPhone) ||
          (userEmail && docEmail && userEmail === docEmail) ||
          (userId && docUserId && userId === docUserId) ||
          !userProfile // Show system transactions if profile not loaded
        );

        if (isMatch) {
          const oid = data.orderNumber || data.id || docSnap.id;
          let status: PaymentHistoryRecord['status'] = 'PENDING';
          const rawStatus = String(data.paymentStatus || data.orderStatus || data.status || '').toUpperCase();
          if (rawStatus.includes('PAID') || rawStatus.includes('SUCCESS') || rawStatus.includes('CONFIRMED')) {
            status = 'PAID';
          } else if (rawStatus.includes('FAIL') || rawStatus.includes('CANCEL')) {
            status = 'FAILED';
          } else if (rawStatus.includes('REFUND')) {
            status = 'REFUNDED';
          }

          const record: PaymentHistoryRecord = {
            id: docSnap.id,
            orderId: oid,
            amount: Number(data.totalAmount || data.orderAmount || data.grandTotal || data.amount || 0),
            currency: data.currency || 'INR',
            status,
            createdAt: data.createdAt ? (typeof data.createdAt === 'string' ? data.createdAt : new Date(data.createdAt.seconds * 1000).toISOString()) : new Date().toISOString(),
            customerName: data.customerName || data.shippingAddress?.fullName || 'Parent',
            customerEmail: docEmail || userEmail,
            customerPhone: docPhone || userPhone,
            itemTitle: data.items ? `${data.items.length} Product(s)` : (data.itemTitle || 'Vernunt Store Order'),
            orderType: 'marketplace_order',
            paymentMethod: data.paymentMethod || 'UPI / Online Banking',
            paymentReference: data.paymentReferenceId || data.paymentId || docSnap.id,
            source: 'firestore_orders'
          };
          mergedMap.set(oid, record);
        }
      });
    } catch (orderFsErr: any) {
      console.warn('Orders read note:', orderFsErr);
    }

    // 2. Fetch from local stored orders cache
    try {
      const localOrdersRaw = localStorage.getItem('vernunt_store_orders_v1');
      if (localOrdersRaw) {
        const localOrders = JSON.parse(localOrdersRaw);
        if (Array.isArray(localOrders)) {
          localOrders.forEach((lo: any) => {
            const oid = lo.orderNumber || lo.id;
            if (!mergedMap.has(oid)) {
              let status: PaymentHistoryRecord['status'] = 'PENDING';
              const rawStatus = String(lo.paymentStatus || lo.orderStatus || '').toUpperCase();
              if (rawStatus.includes('PAID') || rawStatus.includes('SUCCESS') || rawStatus.includes('CONFIRMED')) {
                status = 'PAID';
              } else if (rawStatus.includes('FAIL') || rawStatus.includes('CANCEL')) {
                status = 'FAILED';
              }

              mergedMap.set(oid, {
                id: lo.id || oid,
                orderId: oid,
                amount: Number(lo.grandTotal || lo.totalAmount || 0),
                currency: 'INR',
                status,
                createdAt: lo.createdAt || new Date().toISOString(),
                customerName: lo.shippingAddress?.fullName || 'Parent',
                customerEmail: lo.customerEmail || userEmail,
                customerPhone: lo.customerPhone || userPhone,
                itemTitle: lo.items ? `${lo.items.length} Product(s)` : 'Vernunt Store Order',
                orderType: 'marketplace_order',
                paymentMethod: lo.paymentMethod || 'Online Prepaid',
                paymentReference: lo.id || oid,
                source: 'local_store'
              });
            }
          });
        }
      }
    } catch (localErr) {
      console.warn('Local orders parse note:', localErr);
    }

    const sortedList = Array.from(mergedMap.values()).sort((a, b) => {
      const timeA = new Date(a.createdAt).getTime() || 0;
      const timeB = new Date(b.createdAt).getTime() || 0;
      return timeB - timeA;
    });

    setPayments(sortedList);
    setLoading(false);
  };

  useEffect(() => {
    fetchPaymentHistory();
  }, [userProfile?.id, userProfile?.email, userProfile?.phoneNumber]);

  const handleCopyId = (id: string) => {
    navigator.clipboard.writeText(id);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  const filteredPayments = payments.filter((tx) => {
    if (filterStatus !== 'ALL' && tx.status !== filterStatus) return false;
    if (searchTerm.trim()) {
      const q = searchTerm.toLowerCase().trim();
      const matchOrderId = tx.orderId.toLowerCase().includes(q);
      const matchItem = (tx.itemTitle || '').toLowerCase().includes(q);
      const matchRef = (tx.paymentReference || '').toLowerCase().includes(q);
      return matchOrderId || matchItem || matchRef;
    }
    return true;
  });

  const getStatusBadge = (status: PaymentHistoryRecord['status']) => {
    switch (status) {
      case 'PAID':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-bold bg-emerald-50 text-emerald-700 border border-emerald-200">
            <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
            <span>PAID / SUCCESS</span>
          </span>
        );
      case 'PENDING':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-bold bg-amber-50 text-amber-700 border border-amber-200">
            <Clock className="w-3.5 h-3.5 text-amber-600" />
            <span>PENDING</span>
          </span>
        );
      case 'FAILED':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-bold bg-rose-50 text-rose-700 border border-rose-200">
            <AlertCircle className="w-3.5 h-3.5 text-rose-600" />
            <span>FAILED / DECLINED</span>
          </span>
        );
      case 'REFUNDED':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-bold bg-purple-50 text-purple-700 border border-purple-200">
            <RefreshCw className="w-3.5 h-3.5 text-purple-600" />
            <span>REFUNDED</span>
          </span>
        );
    }
  };

  const formatDateTime = (isoString?: string) => {
    if (!isoString) return 'Just now';
    try {
      const date = new Date(isoString);
      return date.toLocaleDateString('en-IN', {
        day: 'numeric',
        month: 'short',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
      });
    } catch {
      return isoString;
    }
  };

  return (
    <div className="space-y-4 animate-fade-in text-left">
      {/* Header & Stats Banner */}
      <div className="bg-gradient-to-r from-slate-900 via-indigo-950 to-slate-900 rounded-3xl p-5 sm:p-6 text-white shadow-xl border border-slate-800">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <span className="p-2 rounded-xl bg-white/10 text-amber-400">
                <CreditCard className="w-5 h-5" />
              </span>
              <h2 className="text-lg sm:text-xl font-black font-serif tracking-tight">
                Payment &amp; Order History
              </h2>
            </div>
            <p className="text-xs text-slate-300 max-w-xl">
              Official transaction ledger for all kids products, class bookings, and passes recorded in Firestore.
            </p>
          </div>

          <button
            type="button"
            onClick={fetchPaymentHistory}
            disabled={loading}
            className="self-start sm:self-auto px-3.5 py-2 rounded-xl bg-white/10 hover:bg-white/20 border border-white/20 text-xs font-bold transition flex items-center gap-1.5 cursor-pointer disabled:opacity-50"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
            <span>{loading ? 'Syncing...' : 'Sync Firestore'}</span>
          </button>
        </div>

        {/* Quick KPI stats */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mt-5 pt-4 border-t border-white/10 text-left">
          <div className="p-3 rounded-2xl bg-white/5 border border-white/10">
            <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block">
              Total Transactions
            </span>
            <span className="text-xl font-black text-white font-mono mt-0.5 block">
              {payments.length}
            </span>
          </div>

          <div className="p-3 rounded-2xl bg-white/5 border border-white/10">
            <span className="text-[11px] font-bold text-emerald-400 uppercase tracking-wider block">
              Paid &amp; Confirmed
            </span>
            <span className="text-xl font-black text-emerald-300 font-mono mt-0.5 block">
              {payments.filter(p => p.status === 'PAID').length}
            </span>
          </div>

          <div className="p-3 rounded-2xl bg-white/5 border border-white/10">
            <span className="text-[11px] font-bold text-amber-400 uppercase tracking-wider block">
              Volume Paid
            </span>
            <span className="text-xl font-black text-amber-300 font-mono mt-0.5 block">
              ₹{payments.filter(p => p.status === 'PAID').reduce((sum, p) => sum + p.amount, 0).toLocaleString('en-IN')}
            </span>
          </div>

          <div className="p-3 rounded-2xl bg-white/5 border border-white/10">
            <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block">
              Pending / Unpaid
            </span>
            <span className="text-xl font-black text-slate-300 font-mono mt-0.5 block">
              {payments.filter(p => p.status === 'PENDING').length}
            </span>
          </div>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="bg-white rounded-2xl p-3 sm:p-4 border border-slate-200 shadow-sm flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        {/* Status Tabs */}
        <div className="flex items-center gap-1.5 p-1 bg-slate-100 rounded-xl overflow-x-auto text-xs font-bold">
          {(['ALL', 'PAID', 'PENDING', 'FAILED'] as const).map(tab => (
            <button
              key={tab}
              type="button"
              onClick={() => setFilterStatus(tab)}
              className={`px-3 py-1.5 rounded-lg transition whitespace-nowrap cursor-pointer ${
                filterStatus === tab
                  ? 'bg-white text-slate-900 shadow-xs'
                  : 'text-slate-500 hover:text-slate-800'
              }`}
            >
              {tab === 'ALL' ? 'All Transactions' : tab}
            </button>
          ))}
        </div>

        {/* Search Field */}
        <div className="relative flex-1 max-w-xs">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Search by Order ID or item..."
            className="w-full pl-9 pr-3 py-1.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium text-slate-800 focus:bg-white focus:outline-none focus:ring-1 focus:ring-rose-500"
          />
        </div>
      </div>

      {/* Error state */}
      {errorMsg && (
        <div className="p-3.5 bg-rose-50 border border-rose-200 rounded-2xl text-xs font-semibold text-rose-700 flex items-center gap-2">
          <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />
          <span>{errorMsg}</span>
        </div>
      )}

      {/* Loading state */}
      {loading && (
        <div className="p-12 text-center bg-white rounded-3xl border border-slate-200 space-y-3">
          <RefreshCw className="w-8 h-8 text-rose-600 animate-spin mx-auto" />
          <p className="text-xs font-bold text-slate-600">Loading payment records from Firestore database...</p>
        </div>
      )}

      {/* Empty State */}
      {!loading && filteredPayments.length === 0 && (
        <div className="p-10 text-center bg-white rounded-3xl border border-slate-200 space-y-3">
          <div className="w-14 h-14 rounded-full bg-slate-100 flex items-center justify-center mx-auto text-slate-400">
            <ShoppingBag className="w-7 h-7" />
          </div>
          <div className="space-y-1">
            <h3 className="text-sm font-bold text-slate-800">No Transactions Found</h3>
            <p className="text-xs text-slate-500 max-w-sm mx-auto">
              {searchTerm 
                ? 'No payments matching your search criteria.' 
                : 'Purchases processed through the store will be logged into Firestore and displayed here.'}
            </p>
          </div>
          {onNavigateToStore && (
            <button
              type="button"
              onClick={onNavigateToStore}
              className="mt-2 px-4 py-2 bg-rose-600 hover:bg-rose-700 text-white font-bold text-xs rounded-xl shadow-xs transition cursor-pointer"
            >
              Explore Products
            </button>
          )}
        </div>
      )}

      {/* Transactions List */}
      {!loading && filteredPayments.length > 0 && (
        <div className="space-y-2.5">
          {filteredPayments.map((tx) => (
            <div
              key={tx.id || tx.orderId}
              className="p-4 bg-white rounded-2xl border border-slate-200/90 shadow-2xs hover:border-slate-300 transition flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-left"
            >
              {/* Order Info & Item Title */}
              <div className="space-y-1 min-w-0">
                <div className="flex items-center gap-2 flex-wrap">
                  {getStatusBadge(tx.status)}
                  <span className="font-mono text-xs font-bold text-slate-800 flex items-center gap-1">
                    <span>{tx.orderId}</span>
                    <button
                      type="button"
                      onClick={() => handleCopyId(tx.orderId)}
                      title="Copy Order ID"
                      className="text-slate-400 hover:text-slate-700 cursor-pointer"
                    >
                      {copiedId === tx.orderId ? (
                        <Check className="w-3.5 h-3.5 text-emerald-600" />
                      ) : (
                        <Copy className="w-3.5 h-3.5" />
                      )}
                    </button>
                  </span>
                </div>

                <h4 className="text-xs sm:text-sm font-extrabold text-slate-900 truncate">
                  {tx.itemTitle || 'Vernunt Store Item'}
                </h4>

                <div className="flex items-center gap-3 text-[11px] text-slate-500">
                  <span className="flex items-center gap-1">
                    <Calendar className="w-3 h-3 text-slate-400" />
                    <span>{formatDateTime(tx.createdAt)}</span>
                  </span>
                  <span>•</span>
                  <span>
                    {tx.currency || 'INR'} • {tx.paymentMethod || 'Online Payment'}
                  </span>
                </div>
              </div>

              {/* Amount & Actions */}
              <div className="flex sm:flex-col items-center sm:items-end justify-between sm:justify-center gap-2 pt-2 sm:pt-0 border-t sm:border-t-0 border-slate-100">
                <span className="font-mono text-base sm:text-lg font-black text-slate-900">
                  ₹{tx.amount.toLocaleString('en-IN')}
                </span>

                <button
                  type="button"
                  onClick={() => setSelectedTx(tx)}
                  className="px-3 py-1 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs rounded-lg transition flex items-center gap-1 cursor-pointer"
                >
                  <span>View Details</span>
                  <ChevronRight className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Transaction Details Modal */}
      {selectedTx && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4 animate-fade-in">
          <div className="bg-white w-full max-w-md rounded-3xl border border-slate-200 shadow-2xl overflow-hidden p-6 text-left space-y-4 animate-slide-up">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div className="flex items-center gap-2">
                <CreditCard className="w-5 h-5 text-indigo-600" />
                <h3 className="font-extrabold text-slate-900 text-base">Payment Receipt &amp; Audit</h3>
              </div>
              <button
                type="button"
                onClick={() => setSelectedTx(null)}
                className="w-7 h-7 rounded-full bg-slate-100 hover:bg-slate-200 text-slate-500 flex items-center justify-center text-xs font-bold cursor-pointer"
              >
                ✕
              </button>
            </div>

            <div className="space-y-3 text-xs">
              <div className="flex items-center justify-between p-3 rounded-2xl bg-slate-50 border border-slate-200">
                <span className="text-slate-500 font-semibold">Payment Status:</span>
                <div>{getStatusBadge(selectedTx.status)}</div>
              </div>

              <div className="space-y-1.5 p-3 rounded-2xl bg-slate-50 border border-slate-200">
                <div className="flex justify-between">
                  <span className="text-slate-500 font-medium">Order ID:</span>
                  <span className="font-mono font-bold text-slate-800">{selectedTx.orderId}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500 font-medium">Payment Reference:</span>
                  <span className="font-mono text-slate-700">{selectedTx.paymentReference || selectedTx.orderId}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500 font-medium">Date &amp; Time:</span>
                  <span className="text-slate-700">{formatDateTime(selectedTx.createdAt)}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500 font-medium">Payment Method:</span>
                  <span className="font-bold text-indigo-700">{selectedTx.paymentMethod || 'Online Prepaid'}</span>
                </div>
              </div>

              <div className="p-3 rounded-2xl bg-indigo-50 border border-indigo-200 flex justify-between items-center text-indigo-950">
                <span className="font-bold text-xs">Total Amount:</span>
                <span className="font-mono text-lg font-black text-indigo-900">
                  ₹{selectedTx.amount.toLocaleString('en-IN')}
                </span>
              </div>
            </div>

            <button
              type="button"
              onClick={() => setSelectedTx(null)}
              className="w-full py-2.5 bg-slate-900 hover:bg-slate-800 text-white font-bold text-xs rounded-xl transition cursor-pointer"
            >
              Close Receipt
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

export default PaymentHistorySection;
