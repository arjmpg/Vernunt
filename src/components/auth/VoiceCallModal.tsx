import React, { useState, useEffect } from 'react';
import { Phone, PhoneCall, PhoneOff, Volume2, RotateCcw, Check, ShieldCheck, Sparkles } from 'lucide-react';
import { voiceCallSimulator } from '../../utils/voiceCallSimulator.ts';

interface VoiceCallModalProps {
  isOpen: boolean;
  phone: string;
  otpCode: string;
  onClose: () => void;
  onAutoFillAndVerify: (code: string) => void;
}

export default function VoiceCallModal({
  isOpen,
  phone,
  otpCode,
  onClose,
  onAutoFillAndVerify
}: VoiceCallModalProps) {
  const [callState, setCallState] = useState<'ringing' | 'connected' | 'ended'>('ringing');
  const [callDuration, setCallDuration] = useState(0);
  const [isSpeaking, setIsSpeaking] = useState(false);

  const cleanPhone = phone.replace(/\D/g, '').slice(-10);

  useEffect(() => {
    if (isOpen) {
      setCallState('ringing');
      setCallDuration(0);
      setIsSpeaking(false);
      // Start ringing sound
      voiceCallSimulator.startRinging();
    } else {
      voiceCallSimulator.stopAll();
    }

    return () => {
      voiceCallSimulator.stopAll();
    };
  }, [isOpen]);

  // Duration timer when connected
  useEffect(() => {
    let interval: any;
    if (callState === 'connected') {
      interval = setInterval(() => {
        setCallDuration(d => d + 1);
      }, 1000);
    }
    return () => clearInterval(interval);
  }, [callState]);

  if (!isOpen) return null;

  const handleAnswerCall = () => {
    voiceCallSimulator.stopRinging();
    setCallState('connected');
    setIsSpeaking(true);
    voiceCallSimulator.speakOtp(otpCode, () => {
      setIsSpeaking(false);
    });
  };

  const handleRepeatSpeech = () => {
    setIsSpeaking(true);
    voiceCallSimulator.speakOtp(otpCode, () => {
      setIsSpeaking(false);
    });
  };

  const handleDeclineOrEnd = () => {
    voiceCallSimulator.stopAll();
    setCallState('ended');
    setTimeout(() => {
      onClose();
    }, 400);
  };

  const handleAcceptAndVerify = () => {
    voiceCallSimulator.stopAll();
    onAutoFillAndVerify(otpCode);
    onClose();
  };

  const formatTimer = (sec: number) => {
    const mins = Math.floor(sec / 60);
    const s = sec % 60;
    return `${mins.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4 animate-fade-in">
      <div className="bg-slate-900 border border-slate-700 text-white w-full max-w-sm rounded-3xl overflow-hidden shadow-2xl flex flex-col items-center p-6 text-center animate-scale-up">
        
        {/* Caller Avatar & Status */}
        <div className="mt-4 mb-4 relative">
          <div className={`w-24 h-24 rounded-full flex items-center justify-center transition-all ${
            callState === 'ringing' 
              ? 'bg-rose-500/20 ring-4 ring-rose-500/50 animate-pulse' 
              : 'bg-emerald-500/20 ring-4 ring-emerald-500/50'
          }`}>
            <div className="w-18 h-18 rounded-full bg-gradient-to-tr from-rose-600 to-amber-500 flex items-center justify-center shadow-lg">
              {callState === 'ringing' ? (
                <PhoneCall className="w-9 h-9 text-white animate-bounce" />
              ) : (
                <ShieldCheck className="w-9 h-9 text-white" />
              )}
            </div>
          </div>
          {isSpeaking && (
            <span className="absolute -bottom-1 -right-1 bg-emerald-500 text-white p-1.5 rounded-full shadow-md animate-ping">
              <Volume2 className="w-3.5 h-3.5" />
            </span>
          )}
        </div>

        {/* Caller Details */}
        <h3 className="font-serif font-black text-xl text-white tracking-wide">
          Vernunt Safety Desk
        </h3>
        <p className="text-xs font-mono text-emerald-400 font-semibold mt-1">
          +91 80 4719 0200
        </p>
        <p className="text-[11px] text-slate-400 mt-1">
          Calling Parent mobile: <span className="text-slate-200 font-mono">+91 {cleanPhone}</span>
        </p>

        {/* State Banner */}
        <div className="my-5 w-full">
          {callState === 'ringing' && (
            <div className="py-2 px-4 bg-slate-800/80 rounded-2xl border border-slate-700/60 inline-flex items-center gap-2 text-xs font-semibold text-rose-400">
              <span className="w-2 h-2 rounded-full bg-rose-500 animate-ping" />
              <span>Incoming Verification Call...</span>
            </div>
          )}

          {callState === 'connected' && (
            <div className="space-y-3">
              <div className="py-1.5 px-3 bg-emerald-950/80 border border-emerald-500/30 rounded-xl inline-flex items-center gap-2 text-xs font-mono font-bold text-emerald-300">
                <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
                <span>Connected • {formatTimer(callDuration)}</span>
              </div>

              {/* Animated audio waves */}
              <div className="flex items-center justify-center gap-1.5 h-7">
                {[0.4, 0.9, 0.6, 1.0, 0.7, 0.9, 0.5, 0.8, 0.3].map((h, i) => (
                  <span
                    key={i}
                    style={{
                      height: isSpeaking ? `${h * 24}px` : '4px',
                      transition: 'height 0.2s ease-in-out'
                    }}
                    className={`w-1 rounded-full ${isSpeaking ? 'bg-emerald-400' : 'bg-slate-600'}`}
                  />
                ))}
              </div>

              <div className="p-3 bg-slate-800/90 rounded-2xl border border-slate-700 text-left space-y-1">
                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">
                  Spoken Verification Code
                </span>
                <div className="flex items-center justify-between">
                  <span className="font-mono text-2xl font-black tracking-[0.3em] text-amber-300">
                    {otpCode}
                  </span>
                  <button
                    type="button"
                    onClick={handleRepeatSpeech}
                    className="p-1.5 bg-slate-700 hover:bg-slate-600 rounded-lg text-slate-300 text-xs font-semibold flex items-center gap-1 transition cursor-pointer"
                    title="Repeat voice code"
                  >
                    <RotateCcw className="w-3.5 h-3.5" />
                    <span>Repeat</span>
                  </button>
                </div>
                <p className="text-[11px] text-slate-400 italic">
                  "Your six-digit verification code is {otpCode.split('').join(' ')}"
                </p>
              </div>
            </div>
          )}
        </div>

        {/* Action Controls */}
        {callState === 'ringing' ? (
          <div className="flex items-center justify-between w-full px-4 pt-2">
            <button
              type="button"
              onClick={handleDeclineOrEnd}
              className="flex flex-col items-center gap-1.5 cursor-pointer group"
            >
              <div className="w-14 h-14 rounded-full bg-red-600 hover:bg-red-700 text-white flex items-center justify-center shadow-lg transition active:scale-90">
                <PhoneOff className="w-6 h-6" />
              </div>
              <span className="text-[11px] font-bold text-slate-400 group-hover:text-red-400">Decline</span>
            </button>

            <button
              type="button"
              onClick={handleAnswerCall}
              className="flex flex-col items-center gap-1.5 cursor-pointer group"
            >
              <div className="w-14 h-14 rounded-full bg-emerald-500 hover:bg-emerald-600 text-white flex items-center justify-center shadow-lg ring-4 ring-emerald-500/40 animate-pulse transition active:scale-90">
                <Phone className="w-6 h-6" />
              </div>
              <span className="text-[11px] font-bold text-emerald-400 group-hover:text-emerald-300">Answer Call</span>
            </button>
          </div>
        ) : (
          <div className="w-full space-y-2 pt-2">
            <button
              type="button"
              onClick={handleAcceptAndVerify}
              className="w-full py-3 bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-700 hover:to-teal-700 text-white font-extrabold text-xs sm:text-sm rounded-2xl shadow-lg transition active:scale-95 flex items-center justify-center gap-2 cursor-pointer"
            >
              <Check className="w-4 h-4" />
              <span>Auto-Fill Code &amp; Verify Now</span>
            </button>

            <button
              type="button"
              onClick={handleDeclineOrEnd}
              className="w-full py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 font-semibold text-xs rounded-xl transition cursor-pointer flex items-center justify-center gap-1.5"
            >
              <PhoneOff className="w-3.5 h-3.5 text-red-400" />
              <span>End Call</span>
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
