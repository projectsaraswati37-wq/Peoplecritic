export interface SpeechOptions {
  rate?: number;
  pitch?: number;
  volume?: number;
  voice?: SpeechSynthesisVoice | null;
  language?: 'ml-IN' | 'en-US';
}

class SpeechService {
  private synth: SpeechSynthesis | null = null;
  private enabled = true;
  private queue: Array<{ text: string; options: SpeechOptions; resolve: () => void }> = [];
  private speaking = false;
  private preferredVoice: SpeechSynthesisVoice | null = null;
  private malayalamVoice: SpeechSynthesisVoice | null = null;
  private currentAudio: HTMLAudioElement | null = null;
  private onSpeakingChange: ((speaking: boolean) => void) | null = null;

  constructor() {
    if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
      this.synth = window.speechSynthesis;
      this.loadVoices();
      // Voices may load async
      this.synth.onvoiceschanged = () => this.loadVoices();
    }
  }

  private loadVoices() {
    if (!this.synth) return;
    const voices = this.synth.getVoices();
    // Prefer a deep/robotic-sounding English voice
    const preferred = voices.find(
      (v) =>
        v.lang.startsWith('en') &&
        (v.name.toLowerCase().includes('daniel') ||
          v.name.toLowerCase().includes('alex') ||
          v.name.toLowerCase().includes('fred') ||
          v.name.toLowerCase().includes('google uk') ||
          v.name.toLowerCase().includes('microsoft david') ||
          v.name.toLowerCase().includes('microsoft mark') ||
          v.name.toLowerCase().includes('microsoft zira'))
    );
    this.preferredVoice = preferred || voices.find((v) => v.lang.startsWith('en')) || null;
    this.malayalamVoice = voices.find((v) => v.lang.toLowerCase().startsWith('ml')) || null;
  }

  isSupported(): boolean {
    return typeof window !== 'undefined';
  }

  setEnabled(enabled: boolean) {
    this.enabled = enabled;
    if (!enabled) {
      this.stop();
    }
  }

  setOnSpeakingChange(cb: (speaking: boolean) => void) {
    this.onSpeakingChange = cb;
  }

  isEnabled(): boolean {
    return this.enabled;
  }

  speak(text: string, options: SpeechOptions = {}): Promise<void> {
    return new Promise((resolve) => {
      if (!this.enabled) {
        resolve();
        return;
      }
      this.queue.push({ text, options, resolve });
      if (!this.speaking) {
        this.processQueue();
      }
    });
  }

  private processQueue() {
    if (this.queue.length === 0) {
      this.speaking = false;
      this.onSpeakingChange?.(false);
      return;
    }
    const { text, options, resolve } = this.queue.shift()!;
    this.speaking = true;
    this.onSpeakingChange?.(true);

    if ((options.language ?? 'en-US') === 'ml-IN') {
      this.speakNeuralMalayalam(text, options).then(resolve).catch(() => {
        this.speakWithBrowserVoice(text, options, resolve);
      });
      return;
    }

    this.speakWithBrowserVoice(text, options, resolve);
  }

  private async speakNeuralMalayalam(text: string, options: SpeechOptions) {
    const response = await fetch('/api/speech', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ text, rate: options.rate ?? 0, pitch: options.pitch ?? 0 }),
    });
    if (!response.ok) throw new Error('Malayalam neural voice unavailable');
    const payload = await response.json() as { audio?: string };
    if (!payload.audio) throw new Error('Malayalam audio was empty');
    await new Promise<void>((resolve, reject) => {
      const audio = new Audio(`data:audio/mpeg;base64,${payload.audio}`);
      this.currentAudio = audio;
      audio.onended = () => { this.currentAudio = null; this.processQueue(); resolve(); };
      audio.onerror = () => { this.currentAudio = null; reject(new Error('Audio playback failed')); };
      audio.play().catch(reject);
    });
  }

  private speakWithBrowserVoice(text: string, options: SpeechOptions, resolve: () => void) {
    if (!this.synth) {
      resolve();
      this.processQueue();
      return;
    }

    const utterance = new SpeechSynthesisUtterance(text);
    utterance.rate = options.rate ?? 0.88;
    utterance.pitch = options.pitch ?? 1.05;
    utterance.volume = options.volume ?? 1;
    utterance.lang = options.language ?? 'en-US';
    utterance.voice = options.voice ?? (options.language === 'en-US' ? this.preferredVoice : this.malayalamVoice);

    utterance.onend = () => {
      resolve();
      this.processQueue();
    };
    utterance.onerror = () => {
      resolve();
      this.processQueue();
    };

    try {
      this.synth!.speak(utterance);
    } catch {
      resolve();
      this.processQueue();
    }
  }

  stop() {
    this.queue = [];
    this.speaking = false;
    this.currentAudio?.pause();
    this.currentAudio = null;
    this.onSpeakingChange?.(false);
    try {
      this.synth?.cancel();
    } catch {
      // ignore
    }
  }

  pause() {
    try {
      this.synth?.pause();
    } catch {
      // ignore
    }
  }

  resume() {
    try {
      this.synth?.resume();
    } catch {
      // ignore
    }
  }
}

export const speechService = new SpeechService();

export function speakSequence(lines: string[], delayBetween = 200): Promise<void> {
  return lines.reduce((promise, line) => {
    return promise.then(() => {
      return new Promise<void>((res) => {
        speechService.speak(line).then(() => {
          setTimeout(res, delayBetween);
        });
      });
    });
  }, Promise.resolve());
}
