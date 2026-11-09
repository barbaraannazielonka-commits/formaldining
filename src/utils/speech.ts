/**
 * Audio and Speech synthesis utility for English language learners
 */

class SpeechService {
  private synth: SpeechSynthesis | null = null;
  private voice: SpeechSynthesisVoice | null = null;
  private rate: number = 0.9; // Slightly slower for clear ESL comprehension
  private pitch: number = 1.0;
  private isMuted: boolean = false;

  constructor() {
    if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
      this.synth = window.speechSynthesis;
      this.loadVoice();
      if (speechSynthesis.onvoiceschanged !== undefined) {
        speechSynthesis.onvoiceschanged = () => this.loadVoice();
      }
    }
  }

  private loadVoice() {
    if (!this.synth) return;
    const voices = this.synth.getVoices();
    // Prioritize natural English voices
    const preferredVoice =
      voices.find(
        (v) =>
          v.lang.startsWith('en') &&
          (v.name.includes('Natural') ||
            v.name.includes('Google') ||
            v.name.includes('Samantha') ||
            v.name.includes('Daniel') ||
            v.name.includes('Serena'))
      ) ||
      voices.find((v) => v.lang.startsWith('en')) ||
      voices[0];

    if (preferredVoice) {
      this.voice = preferredVoice;
    }
  }

  public speak(text: string, options?: { rate?: number; onEnd?: () => void }) {
    if (!this.synth || this.isMuted) return;

    this.synth.cancel(); // Stop ongoing speech

    const utterance = new SpeechSynthesisUtterance(text);
    if (this.voice) {
      utterance.voice = this.voice;
    }
    utterance.rate = options?.rate ?? this.rate;
    utterance.pitch = this.pitch;
    utterance.lang = 'en-US';

    if (options?.onEnd) {
      utterance.onend = options.onEnd;
    }

    this.synth.speak(utterance);
  }

  public stop() {
    if (this.synth) {
      this.synth.cancel();
    }
  }

  public setMuted(muted: boolean) {
    this.isMuted = muted;
    if (muted) this.stop();
  }

  public getMuted(): boolean {
    return this.isMuted;
  }

  public setRate(rate: number) {
    this.rate = rate;
  }

  public getRate(): number {
    return this.rate;
  }
}

export const speechService = new SpeechService();

/**
 * Web Audio Cafe Ambience Synthesizer
 * Generates relaxing, warm cafe background sound with zero external assets
 */
class AmbientCafeAudio {
  private ctx: AudioContext | null = null;
  private isPlaying: boolean = false;
  private masterGain: GainNode | null = null;

  public start() {
    if (this.isPlaying) return;
    try {
      const AudioCtx = window.AudioContext || (window as any).webkitAudioContext;
      if (!AudioCtx) return;
      this.ctx = new AudioCtx();

      this.masterGain = this.ctx.createGain();
      this.masterGain.gain.setValueAtTime(0.06, this.ctx.currentTime); // Soft volume
      this.masterGain.connect(this.ctx.destination);

      // Create warm low-pass filtered noise to simulate distant cafe bustle
      const bufferSize = this.ctx.sampleRate * 2;
      const noiseBuffer = this.ctx.createBuffer(1, bufferSize, this.ctx.sampleRate);
      const output = noiseBuffer.getChannelData(0);
      let b0 = 0, b1 = 0, b2 = 0;
      for (let i = 0; i < bufferSize; i++) {
        const white = Math.random() * 2 - 1;
        b0 = 0.99886 * b0 + white * 0.0555179;
        b1 = 0.99332 * b1 + white * 0.0750759;
        b2 = 0.96900 * b2 + white * 0.1538520;
        output[i] = (b0 + b1 + b2) * 0.11;
      }

      const whiteNoise = this.ctx.createBufferSource();
      whiteNoise.buffer = noiseBuffer;
      whiteNoise.loop = true;

      const filter = this.ctx.createBiquadFilter();
      filter.type = 'lowpass';
      filter.frequency.setValueAtTime(380, this.ctx.currentTime);

      whiteNoise.connect(filter);
      filter.connect(this.masterGain);
      whiteNoise.start();

      this.isPlaying = true;
    } catch (e) {
      console.warn('Ambient audio could not initialize:', e);
    }
  }

  public stop() {
    if (!this.isPlaying || !this.ctx) return;
    try {
      this.ctx.close();
      this.ctx = null;
      this.isPlaying = false;
    } catch (e) {
      console.warn(e);
    }
  }

  public toggle(): boolean {
    if (this.isPlaying) {
      this.stop();
      return false;
    } else {
      this.start();
      return true;
    }
  }

  public getActive(): boolean {
    return this.isPlaying;
  }
}

export const ambientAudio = new AmbientCafeAudio();
