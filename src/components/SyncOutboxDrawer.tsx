import React, { useState, useEffect } from 'react';
import { 
  Cloud, 
  CloudOff, 
  RefreshCw, 
  CheckCircle2, 
  AlertCircle, 
  Trash2, 
  Clock, 
  Send, 
  UserPlus, 
  Baby, 
  X, 
  ArrowRight,
  Database,
  Wifi,
  WifiOff,
  Sparkles,
  Zap,
  ShieldCheck,
  RotateCw
} from 'lucide-react';
import { 
  OutboxItem, 
  subscribeToOutbox, 
  triggerBackgroundSync, 
  retryOutboxItem, 
  retryAllFailedOutboxItems,
  triggerServiceWorkerSync,
  registerServiceWorkerBackgroundSync,
  getServiceWorkerSyncStatus,
  subscribeToSyncStatus,
  SyncServiceWorkerStatus,
  clearSyncedOutboxItems, 
  clearEntireOutbox 
} from '../utils/syncOutbox.ts';

interface SyncOutboxDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  isOffline: boolean;
}

export function SyncStatusBadge({ onClick, isOffline }: { onClick: () => void; isOffline: boolean }) {
  const [items, setItems] = useState<OutboxItem[]>([]);
  const [isSyncing, setIsSyncing] = useState(false);

  useEffect(() => {
    const unsub = subscribeToOutbox((updated) => {
      setItems(updated);
      setIsSyncing(updated.some(i => i.status === 'syncing'));
    });
    return () => unsub();
  }, []);

  const pending = items.filter(i => i.status === 'queued' || i.status === 'syncing');
  const failed = items.filter(i => i.status === 'failed');

  if (isOffline) {
    return (
      <button
        id="btn-sync-status-badge-offline"
        type="button"
        onClick={onClick}
        className="flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-bold bg-amber-50 text-amber-900 border border-amber-300 hover:bg-amber-100 transition shadow-2xs cursor-pointer group"
        title="Offline Mode: Actions are saved safely in outbox and will auto-sync on reconnect"
      >
        <WifiOff className="w-3.5 h-3.5 text-amber-700 animate-pulse" />
        <span className="font-mono">{pending.length > 0 ? `${pending.length} Queued` : 'Offline (Outbox Active)'}</span>
      </button>
    );
  }

  if (isSyncing) {
    return (
      <button
        id="btn-sync-status-badge-syncing"
        type="button"
        onClick={onClick}
        className="flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-bold bg-blue-50 text-blue-900 border border-blue-200 hover:bg-blue-100 transition shadow-2xs cursor-pointer"
        title="Syncing outbox to Firebase Cloud..."
      >
        <RefreshCw className="w-3.5 h-3.5 text-blue-700 animate-spin" />
        <span className="font-mono">Syncing {pending.length}...</span>
      </button>
    );
  }

  if (failed.length > 0) {
    return (
      <button
        id="btn-sync-status-badge-failed"
        type="button"
        onClick={onClick}
        className="flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-bold bg-rose-50 text-rose-900 border border-rose-300 hover:bg-rose-100 transition shadow-2xs cursor-pointer"
        title={`${failed.length} action(s) failed to sync. Click to inspect & retry.`}
      >
        <AlertCircle className="w-3.5 h-3.5 text-rose-700" />
        <span className="font-mono">{failed.length} Failed (Retry)</span>
      </button>
    );
  }

  if (pending.length > 0) {
    return (
      <button
        id="btn-sync-status-badge-pending"
        type="button"
        onClick={onClick}
        className="flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-bold bg-orange-50 text-orange-900 border border-orange-200 hover:bg-orange-100 transition shadow-2xs cursor-pointer"
        title={`${pending.length} action(s) queued for Firebase cloud sync`}
      >
        <Cloud className="w-3.5 h-3.5 text-orange-600" />
        <span className="font-mono">{pending.length} Outbox</span>
      </button>
    );
  }

  return (
    <button
      id="btn-sync-status-badge-synced"
      type="button"
      onClick={onClick}
      className="hidden sm:flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-medium bg-emerald-50 text-emerald-800 border border-emerald-200 hover:bg-emerald-100 transition shadow-2xs cursor-pointer"
      title="All messages, requests & updates synced to Firebase"
    >
      <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
      <span>Cloud Synced</span>
    </button>
  );
}

export default function SyncOutboxDrawer({ isOpen, onClose, isOffline }: SyncOutboxDrawerProps) {
  const [items, setItems] = useState<OutboxItem[]>([]);
  const [swStatus, setSwStatus] = useState<SyncServiceWorkerStatus>(getServiceWorkerSyncStatus());
  const [isManualSyncing, setIsManualSyncing] = useState(false);
  const [syncFeedback, setSyncFeedback] = useState<string | null>(null);

  useEffect(() => {
    const unsubOutbox = subscribeToOutbox((updated) => {
      setItems(updated);
    });
    const unsubStatus = subscribeToSyncStatus((status) => {
      setSwStatus(status);
    });
    return () => {
      unsubOutbox();
      unsubStatus();
    };
  }, []);

  if (!isOpen) return null;

  const handleForceSync = async () => {
    setIsManualSyncing(true);
    setSyncFeedback(null);
    try {
      const res = await triggerBackgroundSync(true);
      if (res.successCount > 0) {
        setSyncFeedback(`Successfully pushed ${res.successCount} action(s) to Firebase!`);
      } else if (res.failedCount > 0) {
        setSyncFeedback(`Sync completed with ${res.failedCount} retry item(s).`);
      } else {
        setSyncFeedback('Outbox is already fully up to date with Firebase Cloud!');
      }
    } catch (err: any) {
      setSyncFeedback(`Sync note: ${err?.message || 'Check network connection'}`);
    } finally {
      setIsManualSyncing(false);
      setTimeout(() => setSyncFeedback(null), 4000);
    }
  };

  const handleRetryAllFailed = async () => {
    setIsManualSyncing(true);
    setSyncFeedback('Auto-retrying all failed Firebase write operations...');
    try {
      const res = await retryAllFailedOutboxItems();
      if (res.successCount > 0) {
        setSyncFeedback(`Successfully retried and pushed ${res.successCount} action(s) to Firebase!`);
      } else {
        setSyncFeedback(`Retry finished: ${res.failedCount} item(s) pending or queued.`);
      }
    } catch (err: any) {
      setSyncFeedback(`Retry failed: ${err?.message || 'Network unreachable'}`);
    } finally {
      setIsManualSyncing(false);
      setTimeout(() => setSyncFeedback(null), 4000);
    }
  };

  const handleTriggerSwSync = async () => {
    setSyncFeedback('Signaling Service Worker Background Sync...');
    const ok = await triggerServiceWorkerSync();
    if (ok) {
      setSyncFeedback('Service Worker Background Sync signal transmitted!');
    } else {
      await registerServiceWorkerBackgroundSync('vernunt-outbox-sync');
      setSyncFeedback('Background Sync registered with Service Worker!');
    }
    setTimeout(() => setSyncFeedback(null), 3500);
  };

  const getActionIcon = (type: string) => {
    switch (type) {
      case 'SEND_MESSAGE':
        return <Send className="w-4 h-4 text-blue-600" />;
      case 'SEND_CONNECTION_REQUEST':
      case 'ACCEPT_CONNECTION_REQUEST':
        return <UserPlus className="w-4 h-4 text-orange-600" />;
      case 'CARE_BOOKING_REQUEST':
      case 'CARE_STATUS_UPDATE':
        return <Baby className="w-4 h-4 text-rose-600" />;
      default:
        return <Database className="w-4 h-4 text-slate-600" />;
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'synced':
        return (
          <span className="inline-flex items-center gap-1 text-[10px] font-bold text-emerald-700 bg-emerald-50 border border-emerald-200 px-2 py-0.5 rounded-full font-mono">
            <CheckCircle2 className="w-3 h-3 text-emerald-600" /> Synced to Firebase
          </span>
        );
      case 'syncing':
        return (
          <span className="inline-flex items-center gap-1 text-[10px] font-bold text-blue-700 bg-blue-50 border border-blue-200 px-2 py-0.5 rounded-full font-mono">
            <RefreshCw className="w-3 h-3 text-blue-600 animate-spin" /> Pushing...
          </span>
        );
      case 'failed':
        return (
          <span className="inline-flex items-center gap-1 text-[10px] font-bold text-rose-700 bg-rose-50 border border-rose-200 px-2 py-0.5 rounded-full font-mono">
            <AlertCircle className="w-3 h-3 text-rose-600" /> Failed (Auto-retry)
          </span>
        );
      default:
        return (
          <span className="inline-flex items-center gap-1 text-[10px] font-bold text-amber-700 bg-amber-50 border border-amber-200 px-2 py-0.5 rounded-full font-mono">
            <Clock className="w-3 h-3 text-amber-600" /> Queued
          </span>
        );
    }
  };

  const pendingCount = items.filter(i => i.status !== 'synced').length;
  const failedCount = items.filter(i => i.status === 'failed').length;
  const syncedCount = items.filter(i => i.status === 'synced').length;

  return (
    <div id="sync-outbox-drawer-backdrop" className="fixed inset-0 z-50 bg-slate-950/60 backdrop-blur-xs flex justify-end animate-fade-in">
      <div 
        id="sync-outbox-drawer" 
        className="w-full max-w-md bg-white h-full shadow-2xl flex flex-col border-l border-slate-200 animate-slide-in-right overflow-hidden"
      >
        {/* Header */}
        <div className="p-5 border-b border-slate-150 bg-gradient-to-r from-slate-900 to-slate-800 text-white flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-orange-500 flex items-center justify-center text-white shadow-xs">
              <Database className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-bold text-sm font-serif flex items-center gap-2">
                <span>Offline Sync Outbox</span>
                <span className="text-[10px] font-mono px-2 py-0.2 bg-white/10 rounded-full">
                  {pendingCount} Pending
                </span>
              </h3>
              <p className="text-[11px] text-slate-300">
                {isOffline ? 'Offline mode active • Local queue enabled' : 'Connected to Firebase Cloud'}
              </p>
            </div>
          </div>
          <button
            id="btn-close-outbox-drawer"
            type="button"
            onClick={onClose}
            className="w-8 h-8 rounded-lg bg-white/10 hover:bg-white/20 text-slate-200 flex items-center justify-center transition cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Network Status Banner */}
        <div className={`p-3 text-xs flex items-center justify-between border-b ${
          isOffline 
            ? 'bg-amber-50 text-amber-900 border-amber-200' 
            : 'bg-emerald-50 text-emerald-900 border-emerald-200'
        }`}>
          <div className="flex items-center gap-2">
            {isOffline ? (
              <>
                <WifiOff className="w-4 h-4 text-amber-700 shrink-0" />
                <span className="font-medium">
                  Device is currently <strong>Offline</strong>. New messages & requests are queued safely.
                </span>
              </>
            ) : (
              <>
                <Wifi className="w-4 h-4 text-emerald-700 shrink-0" />
                <span className="font-medium">
                  <strong>Online</strong>: Changes push automatically to Firebase in real-time.
                </span>
              </>
            )}
          </div>
        </div>

        {/* Service Worker Background Sync Card */}
        <div className="p-3.5 bg-gradient-to-br from-indigo-50/70 to-blue-50/60 border-b border-indigo-100 flex flex-col gap-2">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="w-6 h-6 rounded-md bg-indigo-600 text-white flex items-center justify-center shrink-0 shadow-2xs">
                <Zap className="w-3.5 h-3.5" />
              </div>
              <span className="font-bold text-xs text-indigo-950">
                Service Worker Background Sync
              </span>
            </div>
            <span className="text-[10px] font-mono font-extrabold px-2 py-0.5 rounded-full bg-indigo-100 text-indigo-800 border border-indigo-200 flex items-center gap-1">
              <ShieldCheck className="w-3 h-3 text-indigo-600" />
              {swStatus.swRegistered ? 'Active' : 'Standby'}
            </span>
          </div>

          <p className="text-[11px] text-slate-600 leading-relaxed">
            Automatically retries failed Firebase write operations when network connectivity is regained, even if the tab was minimized.
          </p>

          <div className="flex items-center justify-between pt-1 gap-2 flex-wrap">
            <div className="flex items-center gap-1.5 text-[10px] text-slate-500 font-mono">
              <RotateCw className="w-3 h-3 text-indigo-500" />
              <span>
                {swStatus.lastSwTriggerTime 
                  ? `Last SW Sync: ${new Date(swStatus.lastSwTriggerTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' })}` 
                  : 'Auto-retry: Armed on Reconnect'}
              </span>
            </div>

            <button
              type="button"
              id="btn-sw-sync-ping"
              onClick={handleTriggerSwSync}
              className="text-[10px] font-bold text-indigo-700 hover:text-indigo-900 bg-white hover:bg-indigo-50/80 px-2 py-1 rounded-md border border-indigo-200 transition cursor-pointer flex items-center gap-1 shadow-2xs"
              title="Ping and verify Service Worker Background Sync registration"
            >
              <RefreshCw className="w-2.5 h-2.5" />
              <span>Verify SW Sync</span>
            </button>
          </div>
        </div>

        {/* Failed items auto-retry prompt */}
        {failedCount > 0 && (
          <div className="p-3 mx-4 mt-3 bg-rose-50 border border-rose-200 rounded-xl text-xs flex items-center justify-between gap-2 animate-fade-in shadow-2xs">
            <div className="flex items-center gap-2">
              <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />
              <div>
                <span className="font-bold text-rose-900">{failedCount} failed write operation(s)</span>
                <p className="text-[11px] text-rose-700">Auto-retries on network reconnect</p>
              </div>
            </div>
            <button
              type="button"
              id="btn-retry-all-failed"
              onClick={handleRetryAllFailed}
              disabled={isManualSyncing || isOffline}
              className="px-2.5 py-1 bg-rose-600 hover:bg-rose-700 disabled:bg-rose-300 text-white font-bold text-[10px] rounded-lg transition cursor-pointer flex items-center gap-1 shrink-0"
            >
              <RotateCw className={`w-3 h-3 ${isManualSyncing ? 'animate-spin' : ''}`} />
              <span>Retry All</span>
            </button>
          </div>
        )}

        {/* Action feedback message */}
        {syncFeedback && (
          <div className="p-2.5 mx-4 mt-3 bg-blue-50 border border-blue-200 rounded-xl text-blue-900 text-xs font-semibold flex items-center gap-2 animate-fade-in">
            <Sparkles className="w-4 h-4 text-blue-600 shrink-0" />
            <span>{syncFeedback}</span>
          </div>
        )}

        {/* List of Outbox Items */}
        <div className="flex-1 overflow-y-auto p-4 space-y-3">
          {items.length === 0 ? (
            <div className="text-center py-12 px-4 space-y-3">
              <div className="w-14 h-14 mx-auto rounded-full bg-emerald-50 flex items-center justify-center text-emerald-600 border border-emerald-200">
                <CheckCircle2 className="w-7 h-7" />
              </div>
              <h4 className="font-serif font-bold text-slate-800 text-sm">Sync Outbox is Empty</h4>
              <p className="text-xs text-slate-500 max-w-xs mx-auto">
                All connection requests, chat messages, and care bookings are fully synced and persisted to Firebase Firestore.
              </p>
            </div>
          ) : (
            items.map((item) => (
              <div
                key={item.id}
                id={`outbox-item-${item.id}`}
                className={`p-3.5 rounded-2xl border transition ${
                  item.status === 'failed' 
                    ? 'bg-rose-50/50 border-rose-200' 
                    : item.status === 'synced' 
                    ? 'bg-slate-50/70 border-slate-200' 
                    : 'bg-white border-orange-200 shadow-2xs'
                }`}
              >
                <div className="flex items-start justify-between gap-2">
                  <div className="flex items-start gap-2.5">
                    <div className="w-8 h-8 rounded-lg bg-slate-100 flex items-center justify-center shrink-0 mt-0.5">
                      {getActionIcon(item.actionType)}
                    </div>
                    <div>
                      <div className="flex items-center gap-1.5 flex-wrap">
                        <span className="text-[10px] font-mono font-bold text-slate-500 uppercase">
                          {item.actionType.replace(/_/g, ' ')}
                        </span>
                        <span className="text-[10px] text-slate-400">
                          • {new Date(item.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' })}
                        </span>
                      </div>
                      <p className="text-xs font-semibold text-slate-900 mt-0.5 leading-snug">
                        {item.description}
                      </p>
                      {item.lastError && (
                        <p className="text-[11px] text-rose-600 mt-1 font-medium">
                          Note: {item.lastError}
                        </p>
                      )}
                    </div>
                  </div>

                  <div className="shrink-0">
                    {getStatusBadge(item.status)}
                  </div>
                </div>

                {item.status === 'failed' && (
                  <div className="mt-2.5 pt-2 border-t border-rose-100 flex items-center justify-between gap-2">
                    <span className="text-[10px] text-rose-600 font-medium">
                      Retry {item.retryCount || 1} • Auto-retry on reconnect
                    </span>
                    <button
                      type="button"
                      onClick={() => retryOutboxItem(item.id)}
                      className="px-2.5 py-1 bg-rose-600 hover:bg-rose-700 text-white text-[10px] font-bold rounded-lg transition cursor-pointer flex items-center gap-1"
                    >
                      <RefreshCw className="w-3 h-3" /> Retry Now
                    </button>
                  </div>
                )}
              </div>
            ))
          )}
        </div>

        {/* Footer Controls */}
        <div className="p-4 border-t border-slate-150 bg-slate-50 space-y-2">
          <div className="flex items-center gap-2">
            <button
              id="btn-force-sync-now"
              type="button"
              onClick={handleForceSync}
              disabled={isManualSyncing || isOffline}
              className="flex-1 py-2.5 px-4 bg-slate-900 hover:bg-slate-800 disabled:bg-slate-300 text-white text-xs font-black rounded-xl transition flex items-center justify-center gap-2 cursor-pointer shadow-xs disabled:cursor-not-allowed"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${isManualSyncing ? 'animate-spin' : ''}`} />
              <span>{isManualSyncing ? 'Pushing to Firebase...' : 'Force Sync Outbox Now'}</span>
            </button>

            {syncedCount > 0 && (
              <button
                id="btn-clear-synced-outbox"
                type="button"
                onClick={clearSyncedOutboxItems}
                className="py-2.5 px-3 bg-white hover:bg-slate-100 text-slate-600 border border-slate-200 text-xs font-bold rounded-xl transition cursor-pointer"
                title="Clear already synced items from history"
              >
                Clear Synced
              </button>
            )}

            {items.length > 0 && (
              <button
                id="btn-clear-all-outbox"
                type="button"
                onClick={() => {
                  if (confirm('Clear entire sync outbox?')) {
                    clearEntireOutbox();
                  }
                }}
                className="py-2.5 px-3 bg-white hover:bg-rose-50 text-rose-600 border border-rose-200 text-xs font-bold rounded-xl transition cursor-pointer"
                title="Clear all outbox records"
              >
                <Trash2 className="w-3.5 h-3.5" />
              </button>
            )}
          </div>

          <p className="text-[10px] text-slate-400 text-center font-medium">
            Vernunt Service Worker background outbox keeps your family data safe and resilient through intermittent networks.
          </p>
        </div>
      </div>
    </div>
  );
}
