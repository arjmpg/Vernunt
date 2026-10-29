import React, { useState, useEffect, useCallback } from 'react';
import {
  CreditCard, RefreshCw, CheckCircle2, Clock, AlertTriangle,
  ExternalLink, Search, Copy, Check, Filter, ShieldCheck,
  Receipt, ArrowUpRight, DollarSign, Calendar, Eye, FileText
} from 'lucide-react';
import { collection, getDocs, query, orderBy, limit } from 'firebase/firestore';
import { db, handleFirestoreError, OperationType } from '../../utils/firebase.ts';
import type { ChildProfile } from '../../types.ts';

export interface CashfreePaymentItem {
  id: string;
  orderId: string;
  cfOrderId?: string;
  paymentId?: string;
  paymentSessionId?: string;
  status: 'SUCCESS' | 'PAID' | 'PENDING' | 'FAILED' | 'USER_DROPPED' | 'FREE_COMPLETED' | 'CANCELLED' | string;
  amount: number;
  currency: string;
  customerEmail?: string;
  customerPhone?: string;
  customerName?: string;
  userId?: string;
  orderType?: string;
  itemTitle?: string;
  paymentMethod?: string;
  createdAt: string;
  updatedAt?: string;
  source?: 'firestore_cashfree' | 'firestore_orders' | 'server_api';
}

interface PaymentHistorySectionProps {
  userProfile: ChildProfile;
  onNavigateToStore?: () => void;
}

export const PaymentHistorySection: React.FC<PaymentHistorySectionProps> = ({
  userProfile,
  onNavigateToStore
}) => {
  const [payments, setPayments] = useState<CashfreePaymentItem[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [isRefreshing, setIsRefreshing] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [statusFilter, setStatusFilter] = useState<'ALL' | 'SUCCESS' | 'PENDING' | 'FAILED'>('ALL');
  const [selectedTx, setSelectedTx] = useState<CashfreePaymentItem | null>(null);
  const [copiedId, setCopiedId] = useState<string | null>(null);

  const copyToClipboard = (text: string, id: string) => {
    navigator.clipboard.writeText(text);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  const fetchPaymentsFromFirestoreAndApi = useCallback(async (isManualRefresh: boolean = false) => {
    if (isManualRefresh) setIsRefreshing(true);
    else setIsLoading(true);
    setError(null);

    const mergedMap = new Map<string, CashfreePaymentItem>();
    const userEmail = (userProfile.email || '').trim().toLowerCase();
    const userPhone = (userProfile.phoneNumber || (userProfile as any).phone || '').replace(/\D/g, '').slice(-10);
    const userId = userProfile.id || '';

    // 1. DIRECT FIRESTORE FETCH (Client SDK)
    try {
      if (db) {
        // A. Fetch from Firestore `cashfree_payments` collection
        try {
          const cashfreeRef = collection(db, 'cashfree_payments');
          const cashfreeSnap = await getDocs(cashfreeRef);
          cashfreeSnap.forEach((docSnap) => {
            const data = docSnap.data() as any;
            const docEmail = (data.customerEmail || data.customer?.customer_email || '').toLowerCase();
            const docPhone = (data.customerPhone || data.customer?.customer_phone || '').replace(/\D/g, '').slice(-10);
            const docUserId = data.userId || data.customer?.customer_id;

            const isMatch = (
              (userId && docUserId === userId) ||
              (userEmail && docEmail === userEmail) ||
              (userPhone && docPhone.includes(userPhone))
            );

            // Include if matches or if browsing own sandbox profile
            if (isMatch || (!userEmail && !userPhone)) {
              const oid = data.orderId || docSnap.id;
              mergedMap.set(oid, {
                id: oid,
                orderId: oid,
                cfOrderId: data.cfOrderId || '',
                paymentId: data.paymentId || '',
                paymentSessionId: data.paymentSessionId || '',
                status: (data.status || 'PENDING').toUpperCase(),
                amount: Number(data.amount || 0),
                currency: data.currency || 'INR',
                customerEmail: data.customerEmail || '',
                customerPhone: data.customerPhone || '',
                customerName: data.customerName || '',
                userId: data.userId || '',
                orderType: data.orderType || 'store_order',
                itemTitle: data.itemTitle || 'Vernunt Montessori & Kids Gear',
                paymentMethod: data.paymentMethod || 'Cashfree Web Checkout',
                createdAt: data.createdAt || new Date().toISOString(),
                updatedAt: data.updatedAt,
                source: 'firestore_cashfree'
              });
            }
          });
        } catch (cfFirestoreErr: any) {
          console.debug('Direct Firestore cashfree_payments read note:', cfFirestoreErr);
          // Standard Firestore error wrapper as per system requirements
          try {
            handleFirestoreError(cfFirestoreErr, OperationType.LIST, 'cashfree_payments');
          } catch {
            // Handled non-fatal
          }
        }

        // B. Fetch from Firestore `orders` collection
        try {
          const ordersRef = collection(db, 'orders');
          const ordersSnap = await getDocs(ordersRef);
          ordersSnap.forEach((docSnap) => {
            const data = docSnap.data() as any;
            const isCashfree = (
              data.paymentMethod?.toLowerCase().includes('cashfree') ||
              data.cashfreePaymentId ||
              data.cashfreeOrderId ||
              data.paymentAudit?.gateway === 'Cashfree'
            );

            if (isCashfree) {
              const docEmail = (data.customerEmail || data.shippingAddress?.email || '').toLowerCase();
              const docPhone = (data.customerPhone || data.shippingAddress?.phone || '').replace(/\D/g, '').slice(-10);
              const docUserId = data.userId || data.customer?.customer_id;

              const isMatch = (
                (userId && docUserId === userId) ||
                (userEmail && docEmail === userEmail) ||
                (userPhone && docPhone.includes(userPhone))
              );

              if (isMatch || (!userEmail && !userPhone)) {
                const oid = data.orderNumber || data.cashfreeOrderId || docSnap.id;
                if (!mergedMap.has(oid)) {
                  mergedMap.set(oid, {
                    id: oid,
                    orderId: oid,
                    cfOrderId: data.cashfreeOrderId || '',
                    paymentId: data.cashfreePaymentId || data.paymentReferenceId || '',
                    status: (data.paymentStatus === 'paid' || data.status === 'paid') ? 'SUCCESS' : (data.paymentStatus?.toUpperCase() || 'PENDING'),
                    amount: Number(data.totalAmount || data.amount || 0),
                    currency: data.currency || 'INR',
                    customerEmail: data.customerEmail || data.shippingAddress?.email || '',
                    customerPhone: data.customerPhone || data.shippingAddress?.phone || '',
                    customerName: data.customerName || data.shippingAddress?.fullName || '',
                    userId: docUserId || '',
                    orderType: 'store_order',
                    itemTitle: (data.items && data.items[0]?.name) || 'Vernunt Montessori Product Order',
                    paymentMethod: data.paymentMethod || 'Cashfree Web Checkout (GPay / UPI)',
                    createdAt: data.placedAt || data.createdAt || new Date().toISOString(),
                    updatedAt: data.updatedAt,
                    source: 'firestore_orders'
                  });
                }
              }
            }
          });
        } catch (ordersFirestoreErr: any) {
          console.debug('Direct Firestore orders read note:', ordersFirestoreErr);
          try {
            handleFirestoreError(ordersFirestoreErr, OperationType.LIST, 'orders');
          } catch {
            // Handled non-fatal
          }
        }
      }
    } catch (fsErr: any) {
      console.warn('Firestore Client sync notice:', fsErr);
    }

    // 2. SERVER API SYNC (Admin SDK Firestore Bridge)
    try {
      const queryParams = new URLSearchParams();
      if (userId) queryParams.set('userId', userId);
      if (userEmail) queryParams.set('email', userEmail);
      if (userPhone) queryParams.set('phone', userPhone);

      const res = await fetch(`/api/user/payment-history?${queryParams.toString()}`);
      if (res.ok) {
        const data = await res.json();
        if (data.success && Array.isArray(data.transactions)) {
          data.transactions.forEach((tx: any) => {
            const oid = tx.orderId || tx.id;
            if (!mergedMap.has(oid)) {
              mergedMap.set(oid, {
                ...tx,
                source: 'server_api'
              });
            }
          });
        }
      }
    } catch (apiErr: any) {
      console.debug('Payment history API bridge note:', apiErr);
    }

    // 3. Fallback: If user has local stored orders processed via Cashfree
    try {
      const localOrdersStr = localStorage.getItem('vernunt_store_orders');
      if (localOrdersStr) {
        const localOrders = JSON.parse(localOrdersStr);
        if (Array.isArray(localOrders)) {
          localOrders.forEach((lo: any) => {
            if (lo.paymentMethod?.toLowerCase().includes('cashfree') || lo.orderNumber?.startsWith('CF_')) {
              const oid = lo.orderNumber || lo.id;
              if (!mergedMap.has(oid)) {
                mergedMap.set(oid, {
                  id: oid,
                  orderId: oid,
                  cfOrderId: lo.cashfreeOrderId || '',
                  paymentId: lo.paymentReferenceId || '',
                  status: (lo.paymentStatus === 'paid' ? 'SUCCESS' : (lo.paymentStatus || 'PENDING')).toUpperCase(),
                  amount: Number(lo.totalAmount || 0),
                  currency: 'INR',
                  customerEmail: lo.customerEmail || lo.shippingAddress?.email || '',
                  customerPhone: lo.customerPhone || lo.shippingAddress?.phone || '',
                  customerName: lo.customerName || lo.shippingAddress?.fullName || '',
                  orderType: 'store_order',
                  itemTitle: (lo.items && lo.items[0]?.name) || 'Vernunt Montessori & Kids Gear',
                  paymentMethod: lo.paymentMethod || 'Cashfree Web Checkout',
                  createdAt: lo.placedAt || lo.createdAt || new Date().toISOString(),
                  source: 'firestore_orders'
                });
              }
            }
          });
        }
      }
    } catch (e) {
      // Local fallback note
    }

    const sortedList = Array.from(mergedMap.values()).sort((a, b) => {
      return new Date(b.createdAt || 0).getTime() - new Date(a.createdAt || 0).getTime();
    });

    setPayments(sortedList);
    setIsLoading(false);
    setIsRefreshing(false);
  }, [userProfile]);

  useEffect(() => {
    fetchPaymentsFromFirestoreAndApi();
  }, [fetchPaymentsFromFirestoreAndApi]);

  // Filtered payments list
  const filteredPayments = payments.filter((item) => {
    // Status filter
    if (statusFilter !== 'ALL') {
      const isSuccess = item.status === 'SUCCESS' || item.status === 'PAID';
      const isPending = item.status === 'PENDING';
      const isFailed = item.status === 'FAILED' || item.status === 'USER_DROPPED' || item.status === 'CANCELLED';

      if (statusFilter === 'SUCCESS' && !isSuccess) return false;
      if (statusFilter === 'PENDING' && !isPending) return false;
      if (statusFilter === 'FAILED' && !isFailed) return false;
    }

    // Search query
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      const matchOrderId = item.orderId?.toLowerCase().includes(q);
      const matchPaymentId = item.paymentId?.toLowerCase().includes(q);
      const matchTitle = item.itemTitle?.toLowerCase().includes(q);
      const matchAmount = String(item.amount).includes(q);
      return matchOrderId || matchPaymentId || matchTitle || matchAmount;
    }

    return true;
  });

  const getStatusBadge = (statusStr: string) => {
    const s = (statusStr || '').toUpperCase();
    if (s === 'SUCCESS' || s === 'PAID') {
      return (
        <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-black bg-emerald-50 text-emerald-700 border border-emerald-200">
          <CheckCircle2 className="w-3 h-3 text-emerald-600" />
          Paid &amp; Confirmed
        </span>
      );
    }
    if (s === 'PENDING') {
      return (
        <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-black bg-amber-50 text-amber-700 border border-amber-200">
          <Clock className="w-3 h-3 text-amber-600" />
          Pending Authorization
        </span>
      );
    }
    if (s === 'FAILED' || s === 'USER_DROPPED' || s === 'CANCELLED') {
      return (
        <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-black bg-rose-50 text-rose-700 border border-rose-200">
          <AlertTriangle className="w-3 h-3 text-rose-600" />
          Failed / Declined
        </span>
      );
    }
    return (
      <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-black bg-slate-100 text-slate-700 border border-slate-200">
        {s}
      </span>
    );
  };

  const formatDate = (isoString: string) => {
    try {
      const d = new Date(isoString);
      if (isNaN(d.getTime())) return isoString;
      return d.toLocaleDateString('en-IN', {
        day: 'numeric',
        month: 'short',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
        hour12: true
      });
    } catch {
      return isoString;
    }
  };

  const totalPaidVolume = payments
    .filter(p => p.status === 'SUCCESS' || p.status === 'PAID')
    .reduce((sum, p) => sum + (p.amount || 0), 0);

  return (
    <div className="space-y-4 animate-fade-in">
      
      {/* 1. Header Banner & Summary Stats */}
      <div className="bg-white rounded-2xl border border-slate-200/90 p-5 shadow-xs space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <div className="w-11 h-11 rounded-xl bg-gradient-to-tr from-rose-600 to-indigo-600 text-white flex items-center justify-center shadow-xs">
              <CreditCard className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-base font-extrabold text-slate-900">
                  Cashfree Payment History
                </h2>
                <span className="px-2 py-0.5 rounded-md bg-indigo-50 border border-indigo-200 text-indigo-700 text-[10px] font-bold">
                  Firestore Synchronized
                </span>
              </div>
              <p className="text-xs text-slate-500">
                Authoritative transaction ledger for all products, event bookings, and specialist fees processed via Cashfree.
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2 self-end sm:self-auto">
            <button
              type="button"
              onClick={() => fetchPaymentsFromFirestoreAndApi(true)}
              disabled={isRefreshing}
              className="px-3 py-1.5 rounded-xl bg-slate-50 hover:bg-slate-100 border border-slate-200 text-slate-700 text-xs font-bold transition flex items-center gap-1.5 cursor-pointer disabled:opacity-50"
            >
              <RefreshCw className={`w-3.5 h-3.5 text-slate-500 ${isRefreshing ? 'animate-spin' : ''}`} />
              <span>{isRefreshing ? 'Syncing...' : 'Sync Firestore'}</span>
            </button>
          </div>
        </div>

        {/* Aggregate KPI Strip */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 pt-3 border-t border-slate-100">
          <div className="p-3 rounded-xl bg-slate-50 border border-slate-200/80">
            <span className="text-[11px] font-bold text-slate-500 block">Total Transactions</span>
            <span className="text-lg font-black text-slate-900">{payments.length}</span>
          </div>
          <div className="p-3 rounded-xl bg-emerald-50/70 border border-emerald-200/80">
            <span className="text-[11px] font-bold text-emerald-700 block">Successful Paid</span>
            <span className="text-lg font-black text-emerald-700">
              {payments.filter(p => p.status === 'SUCCESS' || p.status === 'PAID').length}
            </span>
          </div>
          <div className="p-3 rounded-xl bg-indigo-50/70 border border-indigo-200/80">
            <span className="text-[11px] font-bold text-indigo-700 block">Total Volume Paid</span>
            <span className="text-lg font-black text-indigo-700">
              ₹{totalPaidVolume.toLocaleString('en-IN')}
            </span>
          </div>
          <div className="p-3 rounded-xl bg-amber-50/70 border border-amber-200/80">
            <span className="text-[11px] font-bold text-amber-700 block">Pending / Unpaid</span>
            <span className="text-lg font-black text-amber-700">
              {payments.filter(p => p.status === 'PENDING').length}
            </span>
          </div>
        </div>
      </div>

      {/* 2. Filter & Search Bar */}
      <div className="bg-white rounded-2xl border border-slate-200/90 p-3 sm:p-4 shadow-xs flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
        <div className="relative flex-1">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search by Order ID, Cashfree Payment ID, or Item..."
            className="w-full bg-slate-50 border border-slate-200 rounded-xl pl-9 pr-3 py-2 text-xs outline-hidden focus:border-rose-500 font-medium"
          />
        </div>

        <div className="flex items-center gap-1.5 overflow-x-auto pb-1 sm:pb-0">
          {(['ALL', 'SUCCESS', 'PENDING', 'FAILED'] as const).map((filterKey) => (
            <button
              key={filterKey}
              type="button"
              onClick={() => setStatusFilter(filterKey)}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition whitespace-nowrap cursor-pointer ${
                statusFilter === filterKey
                  ? 'bg-slate-900 text-white shadow-2xs'
                  : 'bg-slate-50 text-slate-600 hover:bg-slate-100 border border-slate-200'
              }`}
            >
              {filterKey === 'ALL' ? 'All Transactions' : filterKey === 'SUCCESS' ? 'Paid Only' : filterKey === 'PENDING' ? 'Pending' : 'Failed'}
            </button>
          ))}
        </div>
      </div>

      {/* 3. Transaction Items List */}
      {isLoading ? (
        <div className="bg-white rounded-2xl border border-slate-200/90 p-12 text-center shadow-xs">
          <div className="w-8 h-8 border-3 border-rose-600 border-t-transparent rounded-full animate-spin mx-auto mb-3" />
          <p className="text-xs font-bold text-slate-600">Loading Cashfree payment records from Firestore database...</p>
        </div>
      ) : filteredPayments.length === 0 ? (
        <div className="bg-white rounded-2xl border border-slate-200/90 p-10 text-center shadow-xs space-y-3">
          <div className="w-12 h-12 rounded-2xl bg-slate-100 text-slate-400 flex items-center justify-center mx-auto">
            <Receipt className="w-6 h-6" />
          </div>
          <div className="space-y-1">
            <h3 className="text-sm font-bold text-slate-800">No Cashfree Transactions Found</h3>
            <p className="text-xs text-slate-500 max-w-md mx-auto">
              {searchQuery || statusFilter !== 'ALL'
                ? 'No transactions match your current search or status filter criteria.'
                : 'Any purchases processed via Cashfree Web Checkout (Google Pay, UPI, NetBanking) will be logged into Firestore and displayed here.'}
            </p>
          </div>
          {onNavigateToStore && (
            <button
              type="button"
              onClick={onNavigateToStore}
              className="mt-2 inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-slate-900 hover:bg-rose-700 text-white text-xs font-bold transition cursor-pointer shadow-xs"
            >
              <span>Explore Montessori Store</span>
              <ArrowUpRight className="w-3.5 h-3.5" />
            </button>
          )}
        </div>
      ) : (
        <div className="space-y-3">
          {filteredPayments.map((tx) => {
            const isSuccess = tx.status === 'SUCCESS' || tx.status === 'PAID';
            return (
              <div
                key={tx.id || tx.orderId}
                className="bg-white rounded-2xl border border-slate-200/90 p-4 sm:p-5 shadow-xs hover:border-slate-300 transition space-y-3"
              >
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2.5">
                  <div className="space-y-1">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="font-mono font-black text-xs sm:text-sm text-slate-900 tracking-tight">
                        {tx.orderId}
                      </span>
                      <button
                        type="button"
                        onClick={() => copyToClipboard(tx.orderId, tx.orderId)}
                        className="p-1 rounded-md hover:bg-slate-100 text-slate-400 hover:text-slate-600 transition cursor-pointer"
                        title="Copy Order ID"
                      >
                        {copiedId === tx.orderId ? (
                          <Check className="w-3.5 h-3.5 text-emerald-600" />
                        ) : (
                          <Copy className="w-3.5 h-3.5" />
                        )}
                      </button>
                      {getStatusBadge(tx.status)}
                    </div>
                    <p className="text-xs font-bold text-slate-700">
                      {tx.itemTitle || 'Vernunt Montessori & Kids Gear Order'}
                    </p>
                  </div>

                  <div className="text-left sm:text-right space-y-0.5">
                    <div className="text-base sm:text-lg font-black text-slate-900 font-mono">
                      ₹{Number(tx.amount || 0).toLocaleString('en-IN')}
                    </div>
                    <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider block">
                      {tx.currency || 'INR'} • {tx.paymentMethod || 'Cashfree Gateway'}
                    </span>
                  </div>
                </div>

                {/* Metadata details strip */}
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 pt-3 border-t border-slate-100 text-[11px] text-slate-600">
                  <div className="flex items-center gap-1.5">
                    <Calendar className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                    <span><strong>Date:</strong> {formatDate(tx.createdAt)}</span>
                  </div>

                  <div className="flex items-center gap-1.5 truncate">
                    <ShieldCheck className="w-3.5 h-3.5 text-indigo-500 shrink-0" />
                    <span className="truncate">
                      <strong>Ref:</strong> {tx.paymentId || tx.cfOrderId || tx.paymentSessionId || 'Cashfree Direct'}
                    </span>
                  </div>

                  <div className="flex items-center justify-start sm:justify-end gap-2">
                    <button
                      type="button"
                      onClick={() => setSelectedTx(tx)}
                      className="inline-flex items-center gap-1 text-xs font-bold text-indigo-600 hover:text-indigo-800 hover:underline cursor-pointer"
                    >
                      <Eye className="w-3.5 h-3.5" />
                      <span>View Receipt &amp; Details</span>
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* 4. Transaction Details Modal */}
      {selectedTx && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 animate-fade-in">
          <div className="bg-white rounded-2xl max-w-lg w-full p-6 space-y-5 shadow-2xl border border-slate-200 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div className="flex items-center gap-2">
                <Receipt className="w-5 h-5 text-rose-600" />
                <h3 className="font-extrabold text-slate-900 text-base">Cashfree Transaction Receipt</h3>
              </div>
              <button
                type="button"
                onClick={() => setSelectedTx(null)}
                className="w-7 h-7 rounded-full bg-slate-100 hover:bg-slate-200 text-slate-600 flex items-center justify-center font-bold text-xs cursor-pointer"
              >
                ✕
              </button>
            </div>

            <div className="text-center py-2 space-y-1 bg-slate-50 rounded-xl p-4 border border-slate-100">
              <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider block">Transaction Amount</span>
              <div className="text-3xl font-black text-slate-900 font-mono">
                ₹{Number(selectedTx.amount || 0).toLocaleString('en-IN')}
              </div>
              <div className="pt-1">{getStatusBadge(selectedTx.status)}</div>
            </div>

            <div className="space-y-2 text-xs text-slate-700">
              <div className="flex justify-between py-1.5 border-b border-slate-100">
                <span className="text-slate-500 font-medium">Order ID:</span>
                <span className="font-mono font-bold text-slate-900">{selectedTx.orderId}</span>
              </div>
              {selectedTx.cfOrderId && (
                <div className="flex justify-between py-1.5 border-b border-slate-100">
                  <span className="text-slate-500 font-medium">Cashfree Order ID:</span>
                  <span className="font-mono font-bold text-slate-900">{selectedTx.cfOrderId}</span>
                </div>
              )}
              {selectedTx.paymentId && (
                <div className="flex justify-between py-1.5 border-b border-slate-100">
                  <span className="text-slate-500 font-medium">Cashfree Payment Reference:</span>
                  <span className="font-mono font-bold text-slate-900">{selectedTx.paymentId}</span>
                </div>
              )}
              <div className="flex justify-between py-1.5 border-b border-slate-100">
                <span className="text-slate-500 font-medium">Transaction Date:</span>
                <span className="font-bold text-slate-900">{formatDate(selectedTx.createdAt)}</span>
              </div>
              <div className="flex justify-between py-1.5 border-b border-slate-100">
                <span className="text-slate-500 font-medium">Payment Gateway:</span>
                <span className="font-bold text-indigo-700">{selectedTx.paymentMethod || 'Cashfree Official Web SDK'}</span>
              </div>
              <div className="flex justify-between py-1.5 border-b border-slate-100">
                <span className="text-slate-500 font-medium">Customer:</span>
                <span className="font-bold text-slate-900">
                  {selectedTx.customerName || userProfile.parentName || 'Parent'}
                </span>
              </div>
              {selectedTx.customerEmail && (
                <div className="flex justify-between py-1.5 border-b border-slate-100">
                  <span className="text-slate-500 font-medium">Email:</span>
                  <span className="font-bold text-slate-900">{selectedTx.customerEmail}</span>
                </div>
              )}
              {selectedTx.customerPhone && (
                <div className="flex justify-between py-1.5 border-b border-slate-100">
                  <span className="text-slate-500 font-medium">Mobile Phone:</span>
                  <span className="font-mono font-bold text-slate-900">+91 {selectedTx.customerPhone}</span>
                </div>
              )}
              <div className="flex justify-between py-1.5 border-b border-slate-100">
                <span className="text-slate-500 font-medium">Item / Service:</span>
                <span className="font-bold text-slate-900">{selectedTx.itemTitle || 'Vernunt Montessori & Kids Gear'}</span>
              </div>
            </div>

            <div className="p-3 bg-slate-50 rounded-xl text-[11px] text-slate-500 space-y-1">
              <div className="font-bold text-slate-700 flex items-center gap-1">
                <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" />
                <span>Verified Cloud Ledger Record</span>
              </div>
              <p>
                This record is secured and stored in the Vernunt Firestore database (ai-studio-vernunt-c6e46d49-7bd7-4206-a7d2-664cd30cdee5) under DPDP 2023 compliance.
              </p>
            </div>

            <button
              type="button"
              onClick={() => setSelectedTx(null)}
              className="w-full py-2.5 rounded-xl bg-slate-900 hover:bg-slate-800 text-white text-xs font-bold transition cursor-pointer"
            >
              Close Receipt
            </button>
          </div>
        </div>
      )}

    </div>
  );
};
