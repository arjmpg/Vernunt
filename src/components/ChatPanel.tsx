import React, { useState, useEffect, useRef } from 'react';
import { ChildProfile, Message } from '../types.ts';
import { 
  Send, ArrowLeft, Lock, CheckCircle2, ShieldCheck, AlertTriangle, 
  Sparkles, Wifi, WifiOff, RefreshCw, Clock, Database, Check, CloudUpload
} from 'lucide-react';
import { evaluateChildSafetyText } from '../utils/childSafetyFilter.ts';
import { 
  saveMessageToLocalDB, 
  getAllLocalConversations, 
  subscribeToLocalConversations, 
  subscribeToChatSyncStatus, 
  syncPendingMessagesWithFirebase,
  LocalChatMessage,
  LocalChatSyncStatus 
} from '../utils/localChatDatabase.ts';
import { queueMessage } from '../utils/syncOutbox.ts';

interface ChatPanelProps {
  playmates: ChildProfile[];
  userProfile: ChildProfile | null;
  activePlaymate: ChildProfile | null;
  initialMessage?: string;
  onClearInitialMessage?: () => void;
  onBackToRadar?: () => void;
  connectedIds?: string[];
  interestsSent?: string[];
  interestsReceived?: string[];
  onAcceptConnection?: (id: string) => void;
  onSendConnection?: (id: string) => void;
  onTriggerAadhaarVerification?: (actionMsg: string, callback: () => void) => void;
}

export default function ChatPanel({ 
  playmates, 
  userProfile, 
  activePlaymate, 
  initialMessage,
  onClearInitialMessage,
  onBackToRadar,
  connectedIds = ['playmate-1', 'playmate-2'],
  interestsSent = [],
  interestsReceived = [],
  onAcceptConnection,
  onSendConnection,
  onTriggerAadhaarVerification
}: ChatPanelProps) {
  
  // Filter only connected ones to pre-select, or use requested activePlaymate
  const connectedPlaymates = playmates.filter(p => connectedIds.includes(p.id));
  
  const [selectedCompanion, setSelectedCompanion] = useState<ChildProfile>(() => {
    if (activePlaymate) return activePlaymate;
    return connectedPlaymates[0] || playmates[0];
  });
  
  // Local Database and Sync status
  const [syncStatus, setSyncStatus] = useState<LocalChatSyncStatus>({
    isOnline: typeof navigator !== 'undefined' ? navigator.onLine : true,
    isSyncing: false,
    pendingCount: 0,
    lastSyncTime: null,
    syncedCount: 0
  });

  // Set of messages by companion ID loaded from local database
  const [conversations, setConversations] = useState<{ [key: string]: LocalChatMessage[] }>(() => {
    return getAllLocalConversations();
  });

  const [inputText, setInputText] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const [safetyAlert, setSafetyAlert] = useState<{ message: string; severity: string } | null>(null);
  const scrollRef = useRef<HTMLDivElement>(null);

  // Subscribe to local database updates and sync status
  useEffect(() => {
    // Initial sync with local DB
    setConversations(getAllLocalConversations());

    const unsubscribeConvs = subscribeToLocalConversations((allConvs) => {
      setConversations(allConvs);
    });

    const unsubscribeStatus = subscribeToChatSyncStatus((status) => {
      setSyncStatus(status);
    });

    return () => {
      unsubscribeConvs();
      unsubscribeStatus();
    };
  }, []);

  // Sync with active companion choice from radar/parent prop changes
  useEffect(() => {
    if (activePlaymate) {
      setSelectedCompanion(activePlaymate);
    }
  }, [activePlaymate]);

  // Handle pre-filled message template (e.g. from Quick Chat button)
  useEffect(() => {
    if (initialMessage) {
      setInputText(initialMessage);
      onClearInitialMessage?.();
    }
  }, [initialMessage, selectedCompanion?.id, onClearInitialMessage]);

  // Handle scroll to bottom of chat
  useEffect(() => {
    scrollRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [conversations, selectedCompanion]);

  const handleSendMessage = (e: React.FormEvent) => {
    e.preventDefault();
    if (!inputText.trim()) return;

    // Run Child Safety & Inappropriate Content Evaluation
    const safetyCheck = evaluateChildSafetyText(inputText.trim(), userProfile?.userRole || 'Parent');
    
    if (safetyCheck.severity === 'CRITICAL') {
      setSafetyAlert({
        message: safetyCheck.reason || 'Message blocked: Potential predatory cue or violation of child safety policies.',
        severity: 'CRITICAL'
      });
      return;
    }

    if (!safetyCheck.isSafe && safetyCheck.severity === 'MEDIUM') {
      setSafetyAlert({
        message: safetyCheck.reason || 'Notice: For child physical safety, direct residential details or phone harvesting are blocked.',
        severity: 'MEDIUM'
      });
      return;
    }

    setSafetyAlert(null);
    const companionId = selectedCompanion.id;
    const currentInput = inputText.trim();

    const userMsg: LocalChatMessage = {
      id: `user-msg-${Date.now()}`,
      chatId: companionId,
      senderId: 'user',
      content: safetyCheck.sanitizedText,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      syncStatus: 'pending',
      createdAt: Date.now()
    };

    // 1. Immediately store in local database (IndexedDB with localStorage fallback)
    // and trigger auto-sync if connected
    saveMessageToLocalDB(userMsg, userProfile);

    // 2. Also keep outbox compatibility
    try {
      queueMessage(companionId, userMsg, userProfile);
    } catch (e) {
      console.debug('Sync outbox note:', e);
    }

    setInputText('');

    // Simulated responses from the other parent!
    setIsTyping(true);
    setTimeout(() => {
      const parentResponses = [
        `That sounds delightful! Let me check our calendar. Should we meet at the park playground?`,
        `Oh definitely! ${selectedCompanion.childName} would be thrilled. S/He loves sharing toys and drawings.`,
        `Haha, amazing! Looking forward to it. Send me a playdate request on the Planner tab!`,
        `Perfect! We are usually free on weekends and after-school hours.`
      ];
      const randomReply = parentResponses[Math.floor(Math.random() * parentResponses.length)];
      
      const replyMsg: LocalChatMessage = {
        id: `reply-msg-${Date.now()}`,
        chatId: companionId,
        senderId: companionId,
        content: replyMsgGenerator(currentInput, selectedCompanion.childName, randomReply),
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        syncStatus: 'synced',
        createdAt: Date.now()
      };

      saveMessageToLocalDB(replyMsg, null);
      setIsTyping(false);
    }, 1500);
  };

  const replyMsgGenerator = (query: string, childName: string, fallback: string) => {
    const qLower = query.toLowerCase();
    if (qLower.includes('how old') || qLower.includes('age')) {
      const ageStr = selectedCompanion.ageUnit === 'months' 
        ? `${selectedCompanion.childAge} months` 
        : `${selectedCompanion.childAge} years`;
      return `Oh, ${childName} is currently ${ageStr} old. Time flies!`;
    }
    if (qLower.includes('hello') || qLower.includes('hi') || qLower.includes('hey')) {
      return `Hey there! Wonderful to meet you and your sweet child. ${childName} says hello! 😊`;
    }
    if (qLower.includes('grade') || qLower.includes('school')) {
      return `${childName} is in ${selectedCompanion.gradeLevel}! What class or grade is your child in?`;
    }
    return fallback;
  };

  const currentMessages = conversations[selectedCompanion.id] || [];
  const isSelectedCompanionConnected = connectedIds.includes(selectedCompanion.id);

  // Filter playmates for requests received
  const receivedRequestsCompanions = playmates.filter(p => interestsReceived.includes(p.id) && !connectedIds.includes(p.id));

  return (
    <div id="chat-panel-component" className="grid grid-cols-1 md:grid-cols-3 bg-white rounded-3xl border border-slate-100 shadow-sm overflow-hidden min-h-[500px]">
      {/* Sidebar List of active threads */}
      <div id="threads-sidebar" className="border-r border-slate-100 p-4 flex flex-col justify-between h-full bg-white">
        <div className="space-y-4 flex-1 overflow-y-auto">
          <div id="threads-header" className="flex items-center justify-between">
            <h3 className="font-bold text-slate-800 font-serif text-base">Conversations</h3>
            <span className="text-[10px] uppercase font-bold text-slate-400">FAMILY CHATS</span>
          </div>

          <div id="threads-list" className="space-y-1">
            {connectedPlaymates.length === 0 ? (
              <p className="text-xs text-slate-400 italic text-center py-4">No active secure connections yet.</p>
            ) : (
              connectedPlaymates.map((p) => {
                const isSelected = selectedCompanion.id === p.id;
                const lastMsgs = conversations[p.id] || [];
                const lastMsgText = lastMsgs.length > 0 ? lastMsgs[lastMsgs.length - 1].content : "Connected safely. Start chatting!";
                const hasPending = lastMsgs.some(m => (m as LocalChatMessage).syncStatus === 'pending');

                return (
                  <button
                    id={`btn-select-thread-${p.id}`}
                    key={p.id}
                    onClick={() => setSelectedCompanion(p)}
                    type="button"
                    className={`w-full text-left p-3 rounded-2xl transition flex items-center gap-3 ${isSelected ? 'bg-orange-50 text-orange-950 border-r-4 border-orange-500 font-medium' : 'hover:bg-slate-50 border-l border-transparent'}`}
                  >
                    <img src={p.photoUrl} alt={p.childName} className="w-10 h-10 rounded-full object-cover border border-slate-200" referrerPolicy="no-referrer" />
                    <div className="flex-1 min-w-0">
                      <div className="flex justify-between items-baseline">
                        <span className="font-bold text-sm truncate text-slate-800 flex items-center gap-1">
                          {p.childName}
                          {hasPending && (
                            <Clock className="w-3 h-3 text-amber-500 shrink-0 animate-pulse" title="Has pending unsynced messages" />
                          )}
                        </span>
                        <span className="text-[9px] text-slate-400">Parent: {p.parentName.split(' ')[0]}</span>
                      </div>
                      <p className="text-xs text-slate-500 truncate mt-0.5">{lastMsgText}</p>
                    </div>
                  </button>
                );
              })
            )}
          </div>

          {/* Secure Locked Sandbox Profiles */}
          <div className="pt-4 border-t border-slate-100">
            <div className="flex items-center justify-between mb-2">
              <span className="text-[9px] uppercase font-bold text-slate-400 tracking-wider">🔒 SECURE SHIELD LOCKS</span>
              <span className="text-[9px] text-orange-500 font-bold bg-orange-50 px-1.5 py-0.5 rounded-full border border-orange-150">Active</span>
            </div>
            <div className="space-y-1">
              {playmates.filter(p => !connectedIds.includes(p.id)).map((p) => {
                const isSelected = selectedCompanion.id === p.id;
                return (
                  <button
                    id={`btn-select-locked-thread-${p.id}`}
                    key={p.id}
                    onClick={() => setSelectedCompanion(p)}
                    type="button"
                    className={`w-full text-left p-2.5 rounded-xl transition flex items-center gap-3 opacity-60 hover:opacity-100 ${isSelected ? 'bg-slate-100 border-l-4 border-slate-400' : 'hover:bg-slate-50'}`}
                  >
                    <img src={p.photoUrl} alt={p.childName} className="w-8 h-8 rounded-full object-cover border border-slate-200 filter grayscale" referrerPolicy="no-referrer" />
                    <div className="flex-1 min-w-0">
                      <div className="flex justify-between items-center">
                        <span className="font-semibold text-xs block truncate text-slate-700">{p.childName}'s Parent</span>
                        <Lock className="w-2.5 h-2.5 text-slate-400 shrink-0" />
                      </div>
                      <span className="text-[9px] text-slate-400 leading-none">Connection Required</span>
                    </div>
                  </button>
                );
              })}
            </div>
          </div>
        </div>

        {/* Pending Requests Inbox in Sidebar */}
        {receivedRequestsCompanions.length > 0 && (
          <div className="mt-4 p-3.5 bg-gradient-to-br from-amber-50 to-orange-50 rounded-2xl border border-amber-100 space-y-2">
            <h4 className="text-[10px] font-black text-amber-900 tracking-wider uppercase flex items-center gap-1">
              📬 Request Inbox ({receivedRequestsCompanions.length})
            </h4>
            <div className="space-y-2 max-h-40 overflow-y-auto">
              {receivedRequestsCompanions.map((p) => (
                <div key={p.id} className="p-2 bg-white rounded-xl shadow-xs border border-amber-250 flex flex-col gap-1.5 text-left">
                  <div className="flex items-center gap-2">
                    <img src={p.photoUrl} alt={p.childName} className="w-6 h-6 rounded-full object-cover" />
                    <div className="min-w-0">
                      <span className="block text-xs font-bold text-slate-800 truncate">{p.childName}'s Parent ({p.parentName.split(' ')[0]})</span>
                      <span className="block text-[9px] text-slate-400 font-medium">Seeking Connection</span>
                    </div>
                  </div>
                  <button
                    id={`sidebar-btn-connect-${p.id}`}
                    onClick={() => onAcceptConnection?.(p.id)}
                    className="w-full py-1 text-[10px] bg-slate-900 hover:bg-slate-800 text-white font-bold rounded-lg leading-relaxed transition"
                  >
                    Approve Security Access
                  </button>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Local Database Storage Footer in Sidebar */}
        <div id="sidebar-local-db-footer" className="mt-3 pt-2.5 border-t border-slate-100 flex items-center justify-between text-[10.5px] text-slate-500">
          <div className="flex items-center gap-1.5 font-medium">
            <Database className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
            <span>Local Database Active</span>
          </div>
          <span className={`px-2 py-0.5 rounded-md font-bold text-[9.5px] ${
            syncStatus.pendingCount > 0 
              ? 'bg-amber-100 text-amber-900 border border-amber-200' 
              : 'bg-emerald-100 text-emerald-800 border border-emerald-200'
          }`}>
            {syncStatus.pendingCount > 0 ? `${syncStatus.pendingCount} pending sync` : 'All Synced'}
          </span>
        </div>
      </div>

      {/* Main chat log output */}
      <div id="chat-log-panel" className="md:col-span-2 flex flex-col h-full bg-slate-50 relative min-h-[450px]">
        
        {/* Connection Lock Guard Screen */}
        {!isSelectedCompanionConnected ? (
          <div className="flex-1 flex flex-col items-center justify-center p-8 text-center bg-slate-50 relative">
            <div className="w-16 h-16 bg-orange-100 text-orange-600 rounded-full flex items-center justify-center mb-4 border border-orange-200">
              <Lock className="w-8 h-8" />
            </div>
            
            <span className="text-[10px] font-bold bg-orange-100 text-orange-800 px-3 py-1 rounded-full border border-orange-200 mb-2 uppercase tracking-widest flex items-center gap-1.5">
              <ShieldCheck className="w-3.5 h-3.5" /> SECURE SHIELD ACTIVE
            </span>
            
            <h3 className="font-serif text-xl font-bold text-slate-900">Security Gate Guarded</h3>
            <p className="text-xs text-slate-500 max-w-sm mt-2 leading-relaxed">
              Coordinate and message transmission with <strong>{selectedCompanion.parentName}</strong> ({selectedCompanion.childName}'s garden-mate) is locked. 
              To safeguard our child network from unsolicited parent actions, we enforce a secure authorization connection before opening transcripts.
            </p>

            {interestsReceived.includes(selectedCompanion.id) ? (
              <div className="mt-6 bg-white p-5 rounded-2xl border border-amber-200 max-w-md shadow-sm">
                <p className="text-xs font-bold text-amber-800 flex items-center justify-center gap-1.5 mb-2">
                  <span>📬 Connection Invitation Available</span>
                </p>
                <p className="text-xs text-slate-600 mb-4 font-medium">
                  {selectedCompanion.parentName} has sent you a connection invitation!
                </p>
                <button
                  type="button"
                  onClick={() => onAcceptConnection?.(selectedCompanion.id)}
                  className="px-6 py-2.5 bg-slate-900 hover:bg-slate-800 text-white rounded-xl text-xs font-bold shadow-md hover:scale-102 active:scale-95 transition cursor-pointer"
                >
                  Approve secure alignment & chat
                </button>
              </div>
            ) : interestsSent.includes(selectedCompanion.id) ? (
              <div className="mt-6 bg-indigo-50 border border-indigo-100 p-5 rounded-2xl text-center max-w-sm">
                <span className="inline-block w-2.5 h-2.5 bg-indigo-500 rounded-full animate-ping mb-2"></span>
                <p className="text-xs font-bold text-indigo-900">Invitation query matches: Pending guardian reply</p>
                <p className="text-[11px] text-slate-500 mt-1 leading-normal">Your parent security credentials were securely aligned. We will immediately raise notifications once accepted by {selectedCompanion.parentName}.</p>
              </div>
            ) : (
              <div className="mt-6">
                <button
                  type="button"
                  onClick={() => onSendConnection?.(selectedCompanion.id)}
                  className="px-6 py-2.5 bg-orange-500 text-white rounded-xl text-xs font-bold shadow-md hover:bg-orange-600 active:scale-95 transition cursor-pointer"
                >
                  Connect with {selectedCompanion.parentName.split(' ')[0]} to Chat
                </button>
              </div>
            )}
          </div>
        ) : (
          <>
            {/* Companion header */}
            <div id="chat-log-header" className="px-6 py-4 bg-white border-b border-slate-100 flex items-center justify-between z-10 shadow-sm">
              <div className="flex items-center gap-3">
                <img src={selectedCompanion.photoUrl} alt={selectedCompanion.childName} className="w-11 h-11 rounded-full object-cover border border-slate-200" referrerPolicy="no-referrer" />
                <div>
                  <h4 className="font-bold text-slate-800 font-serif text-sm flex items-center gap-1">
                    Chatting with {selectedCompanion.childName}'s Parent
                    <span className="w-2 h-2 bg-emerald-500 rounded-full animate-pulse inline-block" title="Online"></span>
                  </h4>
                  <p className="text-xs text-slate-500 font-medium flex items-center gap-1">
                    <ShieldCheck className="w-3.5 h-3.5 text-emerald-500 shrink-0" />
                    <span>Parent: {selectedCompanion.parentName} • Level: {selectedCompanion.gradeLevel}</span>
                  </p>
                </div>
              </div>
              
              <div className="flex items-center gap-2">
                {/* Local Database & Cloud Sync Badge */}
                <div 
                  id="chat-sync-status-badge"
                  className={`flex items-center gap-1.5 px-2.5 py-1 rounded-xl text-[10px] font-extrabold border transition ${
                    !syncStatus.isOnline
                      ? 'bg-amber-50 text-amber-900 border-amber-300 shadow-xs'
                      : syncStatus.pendingCount > 0
                      ? 'bg-sky-50 text-sky-800 border-sky-300 shadow-xs'
                      : 'bg-emerald-50 text-emerald-800 border-emerald-200'
                  }`}
                  title={
                    !syncStatus.isOnline
                      ? 'Offline Mode: Messages are saved securely in local device database (IndexedDB) and will auto-sync with Firebase upon reconnection.'
                      : syncStatus.pendingCount > 0
                      ? `${syncStatus.pendingCount} message(s) stored locally pending Firebase cloud sync.`
                      : 'Local database active & fully synchronized with Firebase.'
                  }
                >
                  <div className="flex items-center gap-1">
                    <Database className="w-3 h-3 text-slate-700" />
                    {syncStatus.isOnline ? (
                      <Wifi className="w-3 h-3 text-emerald-600" />
                    ) : (
                      <WifiOff className="w-3 h-3 text-amber-600" />
                    )}
                  </div>
                  <span>
                    {!syncStatus.isOnline 
                      ? `Offline (${syncStatus.pendingCount} local)`
                      : syncStatus.isSyncing
                      ? 'Syncing to Firebase...'
                      : syncStatus.pendingCount > 0
                      ? `${syncStatus.pendingCount} Pending Sync`
                      : 'Local DB Synced'
                    }
                  </span>
                  {syncStatus.isOnline && syncStatus.pendingCount > 0 && (
                    <button
                      type="button"
                      onClick={() => syncPendingMessagesWithFirebase()}
                      disabled={syncStatus.isSyncing}
                      className="p-0.5 hover:bg-sky-100 rounded text-sky-700 transition cursor-pointer"
                      title="Sync pending messages now"
                    >
                      <RefreshCw className={`w-3 h-3 ${syncStatus.isSyncing ? 'animate-spin' : ''}`} />
                    </button>
                  )}
                </div>

                <span className="text-[9px] font-bold uppercase py-1 px-2.5 bg-emerald-50 text-emerald-700 border border-emerald-200 rounded-xl hidden lg:flex items-center gap-1">
                  <ShieldCheck className="w-3 h-3 text-emerald-600" /> COPPA Safe
                </span>
                {onBackToRadar && (
                  <button
                    id="chat-btn-back-radar"
                    onClick={onBackToRadar}
                    type="button"
                    className="md:hidden px-3 py-1.5 border border-slate-200 hover:bg-slate-50 rounded-xl text-xs font-bold text-slate-600 flex items-center gap-1 transition"
                  >
                    <ArrowLeft className="w-3.5 h-3.5" /> Radar
                  </button>
                )}
              </div>
            </div>

            {/* Offline or Pending Local Database Sync Banner */}
            {(!syncStatus.isOnline || syncStatus.pendingCount > 0) && (
              <div 
                id="chat-offline-sync-banner" 
                className="px-4 py-2 bg-gradient-to-r from-amber-50 via-orange-50 to-amber-50 border-b border-amber-200 flex items-center justify-between text-xs"
              >
                <div className="flex items-center gap-2 text-amber-950 font-medium">
                  <Database className="w-4 h-4 text-amber-600 shrink-0" />
                  <span>
                    <strong>Offline-First Storage:</strong> {!syncStatus.isOnline ? 'Unstable/No internet.' : 'Network online.'} Messages are safely cached in IndexedDB and synchronize with Firebase automatically.
                  </span>
                </div>
                <div className="flex items-center gap-2 shrink-0">
                  {syncStatus.isOnline && syncStatus.pendingCount > 0 && (
                    <button
                      type="button"
                      onClick={() => syncPendingMessagesWithFirebase()}
                      disabled={syncStatus.isSyncing}
                      className="inline-flex items-center gap-1 px-2.5 py-1 bg-amber-600 hover:bg-amber-700 text-white rounded-lg text-[11px] font-bold transition shadow-xs cursor-pointer active:scale-95"
                    >
                      <RefreshCw className={`w-3 h-3 ${syncStatus.isSyncing ? 'animate-spin' : ''}`} />
                      <span>{syncStatus.isSyncing ? 'Syncing...' : 'Sync to Cloud'}</span>
                    </button>
                  )}
                </div>
              </div>
            )}

            {/* In-chat safety alert banner if inappropriate text attempted */}
            {safetyAlert && (
              <div className={`px-4 py-2 text-xs flex items-center justify-between border-b ${
                safetyAlert.severity === 'CRITICAL' 
                  ? 'bg-rose-100 text-rose-900 border-rose-200 font-bold' 
                  : 'bg-amber-100 text-amber-900 border-amber-200'
              }`}>
                <div className="flex items-center gap-2">
                  <AlertTriangle className="w-4 h-4 shrink-0 text-rose-600" />
                  <span>{safetyAlert.message}</span>
                </div>
                <button 
                  onClick={() => setSafetyAlert(null)}
                  className="text-xs font-bold hover:underline cursor-pointer ml-2"
                >
                  Dismiss
                </button>
              </div>
            )}

            {/* Message Log Output viewport */}
            <div id="chat-messages-viewport" className="flex-1 overflow-y-auto p-6 space-y-4 max-h-[400px]">
              {currentMessages.length === 0 ? (
                <div id="chat-empty-state" className="flex flex-col items-center justify-center py-12 text-center space-y-2">
                  <span className="text-3xl">💬</span>
                  <p className="text-sm font-semibold text-slate-500">No message history yet.</p>
                  <p className="text-xs text-slate-400">Write a quick hello to start coordinating playgroup meets!</p>
                </div>
              ) : (
                currentMessages.map((msg) => {
                  const fromMe = msg.senderId === 'user';
                  const localMsg = msg as LocalChatMessage;
                  return (
                    <div
                      id={`msg-line-${msg.id}`}
                      key={msg.id}
                      className={`flex ${fromMe ? 'justify-end' : 'justify-start'} animate-fade-in`}
                    >
                      <div className={`max-w-[75%] p-4 rounded-2xl shadow-sm border text-xs leading-relaxed ${fromMe ? 'bg-gradient-to-r from-orange-500 to-amber-500 text-white border-orange-500 rounded-br-none' : 'bg-white text-slate-800 border-slate-100 rounded-bl-none'}`}>
                        <p className="font-medium whitespace-pre-wrap">{msg.content}</p>
                        
                        {/* Timestamp & Sync Status indicator */}
                        <div className="flex items-center justify-end gap-1.5 mt-1.5">
                          <span className={`text-[9px] font-bold ${fromMe ? 'text-amber-100' : 'text-slate-400'}`}>
                            {msg.timestamp}
                          </span>
                          {fromMe && (
                            <span 
                              className="inline-flex items-center text-[9px] font-semibold"
                              title={
                                localMsg.syncStatus === 'synced'
                                  ? 'Synced with Firebase Cloud Database'
                                  : localMsg.syncStatus === 'pending'
                                  ? 'Saved to Local Device Database • Will sync when online'
                                  : 'Sync failed • Will retry automatically'
                              }
                            >
                              {localMsg.syncStatus === 'synced' ? (
                                <span className="inline-flex items-center gap-0.5 text-emerald-200">
                                  <CheckCircle2 className="w-2.5 h-2.5 fill-emerald-500 text-white" />
                                  <span className="text-[8.5px]">Synced</span>
                                </span>
                              ) : localMsg.syncStatus === 'pending' ? (
                                <span className="inline-flex items-center gap-0.5 text-amber-200">
                                  <Clock className="w-2.5 h-2.5 animate-pulse" />
                                  <span className="text-[8.5px]">Local DB</span>
                                </span>
                              ) : (
                                <span className="inline-flex items-center gap-0.5 text-rose-200">
                                  <AlertTriangle className="w-2.5 h-2.5" />
                                  <span className="text-[8.5px]">Retry</span>
                                </span>
                              )}
                            </span>
                          )}
                        </div>
                      </div>
                    </div>
                  );
                })
              )}

              {isTyping && (
                <div id="typing-indicator" className="flex items-center gap-2">
                  <img src={selectedCompanion.photoUrl} alt="typing" className="w-6 h-6 rounded-full object-cover" referrerPolicy="no-referrer" />
                  <div className="px-4 py-2.5 bg-white border border-slate-100 rounded-full text-xs text-slate-500 font-bold flex items-center gap-1 shadow-sm">
                    <span>{selectedCompanion.parentName} is typing</span>
                    <span className="animate-bounce">.</span>
                    <span className="animate-bounce delay-100">.</span>
                    <span className="animate-bounce delay-200">.</span>
                  </div>
                </div>
              )}
              <div id="scroll-bottom-anchor" ref={scrollRef}></div>
            </div>

            {/* Input Control Form Bar */}
            {!userProfile?.aadhaarVerified ? (
              <div id="chat-aadhaar-blocker" className="p-4 bg-orange-50 border-t border-orange-100 flex flex-col sm:flex-row items-center justify-between gap-3 rounded-b-3xl">
                <div className="flex items-center gap-2 text-xs font-semibold text-orange-950">
                  <Lock className="w-5 h-5 text-orange-600 shrink-0" />
                  <span>Aadhaar Identity Linkage acts as a safety gate. Verify your Aadhaar to message other parents.</span>
                </div>
                <button
                  id="btn-chat-verify-aadhaar"
                  type="button"
                  onClick={() => onTriggerAadhaarVerification?.(
                    `To send private real-time messages to ${selectedCompanion.parentName.split(' ')[0]}, please complete your Aadhaar identity verification under secure national UIDAI standards.`,
                    () => {}
                  )}
                  className="px-4 py-2 bg-orange-500 hover:bg-orange-600 text-white font-bold rounded-xl text-xs whitespace-nowrap active:scale-95 transition flex items-center gap-1.5 cursor-pointer shadow-sm"
                >
                  <ShieldCheck className="w-4 h-4 fill-white text-orange-500" /> Verify Aadhaar
                </button>
              </div>
            ) : (
              <div className="bg-white border-t border-slate-100">
                {/* Quick Starter Templates Bar */}
                <div id="chat-quick-templates-bar" className="px-4 pt-2.5 pb-1 flex items-center gap-1.5 overflow-x-auto no-scrollbar">
                  <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider shrink-0 flex items-center gap-1">
                    <Sparkles className="w-3 h-3 text-amber-500" /> Templates:
                  </span>
                  {[
                    'Hi! Would you like to meet at the park?',
                    'Hi! Are the kids free for a playdate this weekend?',
                    'Hello! Would love to connect our kids for playtime.'
                  ].map((tmpl, idx) => (
                    <button
                      key={idx}
                      type="button"
                      onClick={() => setInputText(tmpl)}
                      className={`text-[11px] font-semibold px-2.5 py-1 rounded-full whitespace-nowrap transition cursor-pointer border shrink-0 ${
                        inputText === tmpl
                          ? 'bg-orange-500 text-white border-orange-500 shadow-xs'
                          : 'bg-slate-50 hover:bg-orange-50 text-slate-600 hover:text-orange-700 border-slate-200/80 hover:border-orange-200'
                      }`}
                    >
                      "{tmpl}"
                    </button>
                  ))}
                </div>

                <form id="chat-input-row" onSubmit={handleSendMessage} className="p-3 sm:p-4 flex items-center gap-2">
                  <input
                    id="chat-text-input"
                    type="text"
                    value={inputText}
                    onChange={(e) => setInputText(e.target.value)}
                    placeholder={`Say hello to ${selectedCompanion.childName} and ${selectedCompanion.parentName.split(' ')[0]}...`}
                    className="flex-1 bg-slate-50 hover:bg-slate-100/50 focus:bg-white text-sm px-4 py-3 border border-slate-200 rounded-2xl outline-none focus:ring-4 focus:ring-orange-200 transition-all placeholder-slate-400 text-slate-700"
                  />
                  <button
                    id="btn-chat-send"
                    type="submit"
                    className="p-3 bg-slate-900 hover:bg-slate-800 text-white rounded-2xl active:scale-95 transition flex items-center justify-center shadow-md cursor-pointer"
                  >
                    <Send className="w-5 h-5" />
                  </button>
                </form>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}
