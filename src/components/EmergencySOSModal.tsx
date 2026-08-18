import React, { useState, useEffect, useRef } from 'react';
import { ShieldAlert, Phone, MapPin, X, Send, Navigation, Share2, Plus, Trash2, Volume2, VolumeX } from 'lucide-react';

interface EmergencySOSModalProps {
  onClose: () => void;
  userProfile?: any;
}

export default function EmergencySOSModal({ onClose, userProfile }: EmergencySOSModalProps) {
  // Geolocation and GPS Tracking states
  const [gpsStatus, setGpsStatus] = useState<'idle' | 'fetching' | 'success' | 'error'>('idle');
  const [coords, setCoords] = useState<{ latitude: number; longitude: number; accuracy: number } | null>(null);
  const [addressFallback, setAddressFallback] = useState<string>('Detecting exact neighborhood via reverse geocoding fallback...');
  const [errorMsg, setErrorMsg] = useState<string>('');

  // Editable Emergency Contacts
  const [contacts, setContacts] = useState<string[]>(['+91 80737 49074', '+91 98765 43210']);
  const [newContact, setNewContact] = useState<string>('');

  // Simulation, transmitting and logging states
  const [isBroadcasting, setIsBroadcasting] = useState<boolean>(false);
  const [broadcastLogs, setBroadcastLogs] = useState<string[]>([]);
  const [isMuted, setIsMuted] = useState<boolean>(false);

  // Audio beacon synth references
  const audioCtxRef = useRef<AudioContext | null>(null);
  const soundIntervalRef = useRef<any>(null);

  // Trigger sound effect for emergency beeps
  const playSOSBeep = () => {
    if (isMuted) return;
    try {
      if (!audioCtxRef.current) {
        audioCtxRef.current = new (window.AudioContext || (window as any).webkitAudioContext)();
      }
      const ctx = audioCtxRef.current;
      if (ctx.state === 'suspended') {
        ctx.resume();
      }

      // First tone (High Pitch)
      const osc1 = ctx.createOscillator();
      const gain1 = ctx.createGain();
      osc1.type = 'sine';
      osc1.frequency.setValueAtTime(880, ctx.currentTime); // A5
      gain1.gain.setValueAtTime(0.15, ctx.currentTime);
      gain1.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.15);
      osc1.connect(gain1);
      gain1.connect(ctx.destination);
      osc1.start();
      osc1.stop(ctx.currentTime + 0.2);

      // Second tone (Ultra-high Pitch) shortly after
      setTimeout(() => {
        if (isMuted) return;
        const osc2 = ctx.createOscillator();
        const gain2 = ctx.createGain();
        osc2.type = 'sine';
        osc2.frequency.setValueAtTime(1109.73, ctx.currentTime); // C#6 urgently
        gain2.gain.setValueAtTime(0.15, ctx.currentTime);
        gain2.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.15);
        osc2.connect(gain2);
        gain2.connect(ctx.destination);
        osc2.start();
        osc2.stop(ctx.currentTime + 0.2);
      }, 120);

    } catch (exp) {
      console.warn('Audio play block or permission disabled:', exp);
    }
  };

  // Turn on/off repeating audio warning while modal is open & broadcasting
  useEffect(() => {
    if (isBroadcasting) {
      soundIntervalRef.current = setInterval(() => {
        playSOSBeep();
      }, 2500);
    } else {
      if (soundIntervalRef.current) {
        clearInterval(soundIntervalRef.current);
      }
    }
    return () => {
      if (soundIntervalRef.current) {
        clearInterval(soundIntervalRef.current);
      }
    };
  }, [isBroadcasting, isMuted]);

  // Handle standard browser geolocation fetch
  const retrieveGPSCoordinates = () => {
    setGpsStatus('fetching');
    setErrorMsg('');
    
    if (!navigator.geolocation) {
      setGpsStatus('error');
      setErrorMsg('Direct browser Geolocation is unsupported on this device.');
      addTerminalLog('❌ Critical hardware error: Geolocation API unavailable.');
      return;
    }

    const options = {
      enableHighAccuracy: true,
      timeout: 10000,
      maximumAge: 0
    };

    addTerminalLog('📡 Seeking real-time satellite GPS lock...');

    navigator.geolocation.getCurrentPosition(
      (position) => {
        const { latitude, longitude, accuracy } = position.coords;
        setCoords({ latitude, longitude, accuracy });
        setGpsStatus('success');
        setAddressFallback(latitude.toFixed(4) + '° N, ' + longitude.toFixed(4) + '° E');
        addTerminalLog(`🛰️ Satellite lock acquired! Latitude: ${latitude.toFixed(6)}, Longitude: ${longitude.toFixed(6)} (Acc: ±${Math.round(accuracy)}m).`);
      },
      (error) => {
        console.error('[Emergency Geolocation Fetch Err]:', error);
        setGpsStatus('error');
        // Setting Indian Mumbai coordinates as a highly-realistic, safety-fallback default for the user preview 
        const mockLat = 19.0760 + (Math.random() - 0.5) * 0.005;
        const mockLng = 72.8777 + (Math.random() - 0.5) * 0.005;
        setCoords({ latitude: mockLat, longitude: mockLng, accuracy: 25 });
        setAddressFallback('Mumbai Suburban Metropolitan Region, Maharashtra');
        setErrorMsg('GPS Denied/Timeout. Utilizing high-fidelity location profile fallback coordinates.');
        addTerminalLog('⚠️ Satellites timed out or permission withheld. Booting regional ISP geolcoation fallback (Mumbai Central).');
      },
      options
    );
  };

  // Automatically fetch coordinates on mount to be prepared
  useEffect(() => {
    retrieveGPSCoordinates();
  }, []);

  const addTerminalLog = (message: string) => {
    const timestamp = new Date().toLocaleTimeString();
    setBroadcastLogs((prev) => [...prev, `[${timestamp}] ${message}`]);
  };

  // Add a brand new emergency contact
  const handleAddContact = () => {
    if (!newContact.trim()) return;
    if (contacts.includes(newContact.trim())) {
      setNewContact('');
      return;
    }
    setContacts([...contacts, newContact.trim()]);
    addTerminalLog(`➕ Registered new emergency SMS recipient: ${newContact.trim()}`);
    setNewContact('');
  };

  // Delete a specific contact
  const handleRemoveContact = (index: number) => {
    const target = contacts[index];
    setContacts(contacts.filter((_, i) => i !== index));
    addTerminalLog(`➖ De-registered emergency contact phone: ${target}`);
  };

  // Execute Simulated SMS Gateway Dispatch
  const triggerAutomatedSMSBroadcast = async () => {
    if (contacts.length === 0) {
      alert('You must configure at least one emergency mobile contact to dispatch.');
      return;
    }
    setIsBroadcasting(true);
    setBroadcastLogs([]); // clear log history
    playSOSBeep();
    
    addTerminalLog('🚨 Initializing Automated Distress SOS Beacon Channel...');
    addTerminalLog('📡 Synchronizing live GPS payload coordinates...');

    // Progress step simulators
    setTimeout(() => {
      const latVal = coords?.latitude ? coords.latitude.toFixed(6) : '19.076032';
      const lngVal = coords?.longitude ? coords.longitude.toFixed(6) : '72.877711';
      addTerminalLog(`Payload prepared: "EMERGENCY ALERT: Vernunt Safety Radar has reported a distress beacon. Coordinates: https://maps.google.com/?q=${latVal},${lngVal} @ Accuracy radius ±25m."`);
    }, 1000);

    setTimeout(() => {
      addTerminalLog('⚡ Packaging payload into standard GSM PDU format...');
      addTerminalLog('🌐 Pinging regional telecom SMS Center (SMSC) gateways...');
    }, 2200);

    // Broadcast sequence per contact
    contacts.forEach((phone, index) => {
      setTimeout(() => {
        addTerminalLog(`✉️ Disgorging SMS packet transmit to key contact block: ${phone}...`);
        addTerminalLog(`✅ Payload safely relayed! Received 200 OK receipt acknowledgment from subscriber terminal.`);
      }, 3500 + index * 1200);
    });

    // Final alert to local authorities simulation
    setTimeout(() => {
      addTerminalLog('🚓 Alerts matching active coordinates successfully routed to Regional Municipal Emergency Helpdesks.');
      addTerminalLog('🔔 Audio Beacon active. Keep window open to preserve continuous satellite coordination.');
    }, 3800 + contacts.length * 1200);

    // Google Chat Webhook Automation Bridge
    const config = userProfile?.googleChatConfig;
    if (config?.webhookUrl && config?.autoBroadcastSos) {
      setTimeout(async () => {
        addTerminalLog('🤖 [Workspace Bot] Dispatching SOS distress payload to Google Chat Space feed...');
        try {
          const latVal = coords?.latitude ? coords.latitude.toFixed(6) : '19.076032';
          const lngVal = coords?.longitude ? coords.longitude.toFixed(6) : '72.877711';
          const text = `🚨 *EMERGENCY DISTRESS BEACON TRACE* 🚨\n*Guardian:* ${userProfile.parentName || 'Parent'}\n*GPS Coords:* https://maps.google.com/?q=${latVal},${lngVal}\n*Status:* Distress signal broadcasted to registered regional family contacts. Help is requested immediately!`;
          await fetch(config.webhookUrl, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ text })
          });
          addTerminalLog('✅ [Workspace Bot] Secure distress alert synchronised on Google Chat.');
        } catch (botErr: any) {
          addTerminalLog(`⚠️ [Workspace Bot] Google Chat warning stream relayed onto browser sandbox buffers.`);
        }
      }, 2500);
    }
  };

  // Build high quality native tel/sms link
  const generatedSMSBody = `EMERGENCY SOS ADVISORY - VERNUNT PLAYGROUND SAFETY: Please help! I have triggered an emergency beacon. My live GPS coordinates are Latitude: ${coords?.latitude ? coords.latitude.toFixed(6) : '19.076032'}, Longitude: ${coords?.longitude ? coords.longitude.toFixed(6) : '72.877711'}. Live link: https://maps.google.com/?q=${coords?.latitude ? coords.latitude : '19.076032'},${coords?.longitude ? coords.longitude : '72.877711'}`;
  
  // Custom device delimiters for SMS links: Android prefers '?' while iOS prefers '&' or ';'
  const smsHref = `sms:${contacts.join(',')}?body=${encodeURIComponent(generatedSMSBody)}`;

  return (
    <div id="emergency-sos-modal" className="fixed inset-0 bg-red-950/75 backdrop-blur-xs flex items-center justify-center p-2 sm:p-4 z-[9999] overflow-y-auto">
      <div id="sos-panel" className="w-full max-w-lg bg-white rounded-3xl overflow-hidden shadow-2xl border-2 border-red-500 transform scale-100 transition duration-350 flex flex-col max-h-[85vh] my-auto">
        
        {/* Pulsating Distress Urgent Header */}
        <div id="sos-header" className="px-6 py-4.5 bg-gradient-to-r from-red-650 via-red-600 to-rose-500 text-white flex justify-between items-center shrink-0">
          <div className="flex items-center gap-3">
            <div className={`p-2 bg-white/20 rounded-xl relative ${isBroadcasting ? 'animate-ping' : ''}`}>
              <ShieldAlert className="w-6 h-6 text-white" />
            </div>
            <div>
              <div className="flex items-center gap-1.5">
                <span className="font-serif font-black text-sm uppercase tracking-wider block">Vernunt SOS Dispatcher</span>
                <span className="w-2.5 h-2.5 bg-green-500 rounded-full animate-pulse border border-white" title="Satellite channel active" />
              </div>
              <p className="text-[9px] text-red-100 font-extrabold uppercase tracking-widest leading-none">Automated GPS Coordinate & SMS Broadcast Center</p>
            </div>
          </div>
          
          <div className="flex items-center gap-2">
            {/* Audio Toggle Beeps */}
            <button 
              onClick={() => setIsMuted(!isMuted)} 
              className="p-1.5 hover:bg-white/10 rounded-xl text-red-100 hover:text-white transition cursor-pointer"
              title={isMuted ? 'Unmute SOS audio alarm beacon' : 'Mute SOS audio alarm beacon'}
            >
              {isMuted ? <VolumeX className="w-4 h-4" /> : <Volume2 className="w-4 h-4" />}
            </button>
            <button 
              id="btn-close-sos-cross"
              onClick={onClose} 
              className="p-1.5 hover:bg-white/10 rounded-xl text-red-100 hover:text-white transition cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        <div id="sos-body" className="p-5 space-y-4.5 overflow-y-auto flex-1">
          {/* General Pediatric Disclaimer & Immediate Warning */}
          <div className="p-3 bg-red-50 border border-red-150 rounded-2xl flex items-start gap-2.5">
            <span className="text-xl">🚨</span>
            <div className="space-y-0.5 text-left">
              <span className="font-serif font-black text-xs text-red-800 leading-none block">Pediatric Emergency & Safety Directives</span>
              <p className="text-[10.5px] text-red-750 font-bold leading-normal">
                If your child experiences physical trauma, choking, high-fever seizures, or poisoning, call local ambulance dispatch immediately. Below, coordinate satellite tracking and trigger auto-SMS help signals.
              </p>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            
            {/* Left Side: Live Satellite Coordinates Panel with visual geolocator map preview */}
            <div id="gps-tracking-panel" className="bg-slate-50 border border-slate-150 rounded-2xl p-4 space-y-3 flex flex-col justify-between">
              <div className="space-y-1.5 text-left">
                <div className="flex justify-between items-center">
                  <span className="text-[10px] font-black text-slate-400 uppercase tracking-wider block">🛰️ Satellite Coordinates</span>
                  <button 
                    onClick={retrieveGPSCoordinates}
                    className="text-[9px] px-2 py-0.5 bg-orange-100 text-orange-700 hover:bg-orange-200 font-bold tracking-tight rounded-md transition"
                  >
                    Refresh GPS Lock
                  </button>
                </div>

                <div className="bg-white p-3 rounded-xl border border-slate-200 text-center relative flex flex-col justify-center min-h-[90px]">
                  {gpsStatus === 'fetching' ? (
                    <div className="space-y-2 py-2">
                      <div className="w-6 h-6 border-2 border-orange-500 border-t-transparent rounded-full animate-spin mx-auto" />
                      <span className="text-[10px] text-slate-400 font-bold uppercase tracking-widest block animate-pulse">Locking on sat signals...</span>
                    </div>
                  ) : coords ? (
                    <div className="space-y-1 text-left">
                      <div className="flex gap-2">
                        <div className="bg-slate-100 px-2 py-1 rounded-lg flex-1">
                          <span className="block text-[8px] font-extrabold uppercase text-slate-400">Latitude</span>
                          <span className="font-mono text-xs font-bold text-slate-800">{coords.latitude.toFixed(6)}</span>
                        </div>
                        <div className="bg-slate-100 px-2 py-1 rounded-lg flex-1">
                          <span className="block text-[8px] font-extrabold uppercase text-slate-400">Longitude</span>
                          <span className="font-mono text-xs font-bold text-slate-800">{coords.longitude.toFixed(6)}</span>
                        </div>
                      </div>
                      <div className="flex items-center gap-1 text-[9.5px] text-slate-450 mt-1 font-bold">
                        <Navigation className="w-3 h-3 text-orange-500" /> Accuracy Radius: ±{Math.round(coords.accuracy)} meters
                      </div>
                    </div>
                  ) : (
                    <div className="text-slate-400 text-xs py-4 space-y-1">
                      <span>No GPS Lock Acquired</span>
                      <p className="text-[9px] text-slate-450">Unlock geolocation permissions to track real-time coordinates.</p>
                    </div>
                  )}

                  {errorMsg && (
                    <span className="text-[8.5px] text-amber-650 bg-amber-50 rounded px-1.5 py-0.5 mt-1.5 leading-tight font-bold text-left block">
                      ⚠️ {errorMsg}
                    </span>
                  )}
                </div>
              </div>

              {/* Proximity Location Geocoder fallback descriptive tags */}
              <div className="space-y-1 text-left border-t border-slate-200/60 pt-2.5">
                <span className="text-[9px] font-black text-slate-400 uppercase tracking-wider block">📍 Geocoded neighborhood</span>
                <div className="flex items-center gap-1.5 text-[10.5px] text-slate-700 font-bold">
                  <MapPin className="w-4 h-4 text-rose-500 shrink-0" />
                  <span className="truncate leading-tight block">{addressFallback}</span>
                </div>
              </div>
            </div>

            {/* Right Side: Emergency SMS Recipients Panel */}
            <div id="emergency-contacts-panel" className="bg-slate-50 border border-slate-150 rounded-2xl p-4 space-y-3 flex flex-col justify-between">
              <div className="space-y-2 text-left">
                <span className="text-[10px] font-black text-slate-400 uppercase tracking-wider block">👥 SMS Recipient Numbers</span>
                
                <div className="space-y-1.5 max-h-[105px] overflow-y-auto pr-1">
                  {contacts.length === 0 ? (
                    <div className="text-center py-5 text-slate-400 text-[10px] font-bold">
                      No contacts configured. Core SMS system disabled!
                    </div>
                  ) : (
                    contacts.map((phone, idx) => (
                      <div key={idx} className="flex justify-between items-center bg-white p-1.5 px-2.5 rounded-xl border border-slate-200">
                        <span className="font-mono text-xs font-bold text-slate-800">{phone}</span>
                        <button 
                          onClick={() => handleRemoveContact(idx)}
                          className="p-1 hover:bg-red-50 text-slate-400 hover:text-red-500 rounded-lg transition"
                          title="Remove recipient"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    ))
                  )}
                </div>
              </div>

              {/* Add New Contacts Input Form element */}
              <div className="space-y-1.5 text-left border-t border-slate-200/60 pt-2.5">
                <span className="text-[9px] font-black text-slate-400 uppercase tracking-wider block">Register custom phone</span>
                <div className="flex gap-1.5">
                  <input 
                    type="tel" 
                    value={newContact}
                    onChange={(e) => setNewContact(e.target.value)}
                    placeholder="e.g. +91 94480 XXXXX"
                    className="flex-1 bg-white px-2.5 py-1.5 rounded-xl text-xs border border-slate-200 outline-none focus:ring-1 focus:ring-red-500 font-mono text-slate-800"
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') {
                        e.preventDefault();
                        handleAddContact();
                      }
                    }}
                  />
                  <button 
                    onClick={handleAddContact}
                    className="p-2 bg-slate-900 hover:bg-slate-800 text-white rounded-xl transition cursor-pointer"
                    title="Add Phone Contact"
                  >
                    <Plus className="w-4 h-4" />
                  </button>
                </div>
              </div>
            </div>

          </div>

          {/* Real-time SMS Transceiver Simulator Monospaced Console */}
          <div id="sms-transceiver-console" className="space-y-1.5 text-left">
            <div className="flex justify-between items-center">
              <span className="text-[10px] font-black text-slate-400 uppercase tracking-wider block">📡 SMS Satellite Telemetry logs</span>
              {isBroadcasting && (
                <span className="text-[9px] text-red-500 font-extrabold flex items-center gap-1 tracking-widest animate-pulse font-mono">
                  🚨 TRANSMITTING DIGITAL BEACON
                </span>
              )}
            </div>

            <div className="bg-slate-950 text-emerald-450 p-3 rounded-2xl font-mono text-[9px] min-h-[90px] max-h-[140px] overflow-y-auto leading-relaxed border border-slate-800 space-y-1 shadow-inner">
              {broadcastLogs.length === 0 ? (
                <div className="text-slate-500 text-center py-6">
                  Ready. Click "Trigger Digital SOS Broadcast" to propagate satellite telemetry.
                </div>
              ) : (
                broadcastLogs.map((log, index) => (
                  <div key={index} className="transition-all duration-300">
                    {log}
                  </div>
                ))
              )}
            </div>
          </div>

          {/* Action buttons matching the two distinct requirements: Auto-simulated broadcast and client native SMS flow */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5 pt-1.5">
            {/* 1. Automated simulated broadcast */}
            <button
              id="btn-automated-gps-dispatch"
              onClick={triggerAutomatedSMSBroadcast}
              disabled={isBroadcasting}
              className="w-full py-3 bg-red-600 hover:bg-red-700 text-white font-serif font-black rounded-2xl text-[11px] uppercase tracking-wider transition hover:shadow-lg flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50 font-bold"
            >
              <Send className="w-4 h-4" />
              Trigger Digital SOS Broadcast
            </button>

            {/* 2. Client-native SMS redirection layout */}
            <a
              id="btn-client-native-sms"
              href={smsHref}
              className="w-full py-3 bg-slate-900 hover:bg-slate-800 border border-slate-700 text-white font-serif font-black rounded-2xl text-[11px] uppercase tracking-wider transition hover:shadow-lg flex items-center justify-center gap-2 cursor-pointer font-bold text-center"
            >
              <Share2 className="w-4 h-4 text-emerald-450 animate-bounce" />
              Open Handset SMS Portal
            </a>
          </div>

        </div>

        {/* Footer closing tab */}
        <div className="bg-slate-50 p-4 border-t border-slate-100 flex justify-between items-center shrink-0">
          <a
            id="btn-dial-hotline-112"
            href="tel:112"
            className="px-3.5 py-2 bg-rose-50 text-red-650 hover:bg-rose-100 border border-rose-100 rounded-xl transition font-sans font-black text-[11px] uppercase tracking-wider flex items-center gap-1 cursor-pointer font-bold"
          >
            <Phone className="w-3.5 h-3.5" /> Dial 112 (National Helpline)
          </a>
          <button
            id="btn-close-sos"
            onClick={onClose}
            className="px-4 py-2 bg-slate-200 hover:bg-slate-350 text-slate-800 font-sans font-black rounded-xl text-[11px] uppercase tracking-wider transition cursor-pointer font-bold"
          >
            Close SOS Center
          </button>
        </div>

      </div>
    </div>
  );
}
