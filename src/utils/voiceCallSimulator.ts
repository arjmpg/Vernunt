/**
 * Voice Call Verification Engine & Ringtone Synthesizer
 * Uses Web Audio API for telephone ringtones and Web SpeechSynthesis for clear voice OTP reading.
 * Zero external audio files required — runs 100% reliably in any modern browser.
 */

class VoiceCallSimulator {
  private audioCtx: AudioContext | null = null;
  private ringOscillator1: OscillatorNode | null = null;
  private ringOscillator2: OscillatorNode | null = null;
  private ringGain: GainNode | null = null;
  private ringInterval: any = null;
  private isRinging: boolean = false;

  private getAudioContext(): AudioContext | null {
    if (typeof window === 'undefined') return null;
    try {
      const AudioContextClass = window.AudioContext || (window as any).webkitAudioContext;
      if (!this.audioCtx && AudioContextClass) {
        this.audioCtx = new AudioContextClass();
      }
      if (this.audioCtx && this.audioCtx.state === 'suspended') {
        this.audioCtx.resume();
      }
      return this.audioCtx;
    } catch (e) {
      console.debug('[VoiceCall] AudioContext not available:', e);
      return null;
    }
  }

  /**
   * Starts playing a realistic telephone ringing tone (440Hz + 480Hz US/India standard cadence)
   */
  startRinging(): void {
    if (this.isRinging) return;
    this.isRinging = true;

    try {
      const ctx = this.getAudioContext();
      if (!ctx) return;

      const playBurst = () => {
        if (!this.isRinging) return;
        try {
          const osc1 = ctx.createOscillator();
          const osc2 = ctx.createOscillator();
          const gain = ctx.createGain();

          osc1.type = 'sine';
          osc2.type = 'sine';
          osc1.frequency.setValueAtTime(440, ctx.currentTime);
          osc2.frequency.setValueAtTime(480, ctx.currentTime);

          gain.gain.setValueAtTime(0.08, ctx.currentTime);
          // Ring for 1.8 seconds then ramp down
          gain.gain.exponentialRampToValueAtTime(0.0001, ctx.currentTime + 1.8);

          osc1.connect(gain);
          osc2.connect(gain);
          gain.connect(ctx.destination);

          osc1.start(ctx.currentTime);
          osc2.start(ctx.currentTime);
          osc1.stop(ctx.currentTime + 1.8);
          osc2.stop(ctx.currentTime + 1.8);
        } catch (e) {
          console.debug('Ring burst note:', e);
        }
      };

      playBurst();
      this.ringInterval = setInterval(() => {
        if (this.isRinging) {
          playBurst();
        } else {
          clearInterval(this.ringInterval);
        }
      }, 3500);
    } catch (e) {
      console.debug('startRinging error:', e);
    }
  }

  /**
   * Stops the telephone ringtone
   */
  stopRinging(): void {
    this.isRinging = false;
    if (this.ringInterval) {
      clearInterval(this.ringInterval);
      this.ringInterval = null;
    }
  }

  /**
   * Speaks the OTP code aloud using browser SpeechSynthesis with natural pauses between digits
   */
  speakOtp(otpCode: string, onEnd?: () => void): void {
    this.stopRinging();
    if (typeof window === 'undefined' || !('speechSynthesis' in window)) {
      onEnd?.();
      return;
    }

    try {
      window.speechSynthesis.cancel(); // Stop any pending speech

      const spacedDigits = otpCode.split('').join(', ');
      const messageText = `Hello from Vernunt Child Safety Desk. Your six-digit verification code is: ${spacedDigits}. Repeating code: ${spacedDigits}. Thank you.`;

      const utterance = new SpeechSynthesisUtterance(messageText);
      utterance.rate = 0.88; // Slightly slower for crisp clarity
      utterance.pitch = 1.05; // Friendly, professional cadence

      // Pick English (India) or standard English voice if available
      const voices = window.speechSynthesis.getVoices();
      const preferredVoice = voices.find(v => v.lang === 'en-IN' || v.lang === 'en-GB' || v.lang.startsWith('en'));
      if (preferredVoice) {
        utterance.voice = preferredVoice;
      }

      utterance.onend = () => {
        onEnd?.();
      };

      utterance.onerror = (e) => {
        console.debug('Speech error note:', e);
        onEnd?.();
      };

      window.speechSynthesis.speak(utterance);
    } catch (err) {
      console.warn('speakOtp error:', err);
      onEnd?.();
    }
  }

  /**
   * Cancels any active speech or ringing
   */
  stopAll(): void {
    this.stopRinging();
    if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
      try {
        window.speechSynthesis.cancel();
      } catch {
        // ignore
      }
    }
  }
}

export const voiceCallSimulator = new VoiceCallSimulator();
