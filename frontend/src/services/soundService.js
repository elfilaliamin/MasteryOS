// Professional Web Audio API Sound Synthesis Engine
// Zero-dependency, low-latency, fully offline synthesized micro-soundscapes

class SoundService {
  constructor() {
    this.audioCtx = null;
    this.isMuted = this.loadMutedState();
    this.volume = this.loadVolumeState();
    this.isUnlocked = false;

    // Attach user gesture listener to automatically unlock AudioContext on modern browsers
    if (typeof window !== 'undefined') {
      const unlock = () => {
        this.resumeContext();
        window.removeEventListener('click', unlock);
        window.removeEventListener('keydown', unlock);
        window.removeEventListener('touchstart', unlock);
      };
      window.addEventListener('click', unlock, { once: true });
      window.addEventListener('keydown', unlock, { once: true });
      window.addEventListener('touchstart', unlock, { once: true });
    }
  }

  loadMutedState() {
    try {
      const saved = localStorage.getItem('mastery_sound_enabled');
      if (saved !== null) {
        return saved === 'false';
      }
    } catch {
      // ignore
    }
    return false; // Default: sound enabled (not muted)
  }

  loadVolumeState() {
    try {
      const saved = localStorage.getItem('mastery_sound_volume');
      if (saved !== null) {
        const parsed = parseFloat(saved);
        if (!isNaN(parsed) && parsed >= 0 && parsed <= 1) {
          return parsed;
        }
      }
    } catch {
      // ignore
    }
    return 0.7; // Default: 70% volume
  }

  getAudioContext() {
    if (typeof window === 'undefined') return null;
    if (!this.audioCtx) {
      const AudioCtxClass = window.AudioContext || window.webkitAudioContext;
      if (AudioCtxClass) {
        this.audioCtx = new AudioCtxClass();
      }
    }
    return this.audioCtx;
  }

  resumeContext() {
    const ctx = this.getAudioContext();
    if (ctx && ctx.state === 'suspended') {
      ctx.resume().catch(() => {});
    }
    this.isUnlocked = true;
  }

  setIsMuted(muted) {
    this.isMuted = Boolean(muted);
    try {
      localStorage.setItem('mastery_sound_enabled', String(!this.isMuted));
      window.dispatchEvent(
        new CustomEvent('mastery_sound_state_change', {
          detail: { isMuted: this.isMuted, volume: this.volume },
        })
      );
    } catch {
      // ignore
    }
  }

  toggleMute() {
    this.setIsMuted(!this.isMuted);
    return this.isMuted;
  }

  setVolume(vol) {
    const clamped = Math.min(1, Math.max(0, Number(vol) || 0));
    this.volume = clamped;
    try {
      localStorage.setItem('mastery_sound_volume', String(clamped));
      window.dispatchEvent(
        new CustomEvent('mastery_sound_state_change', {
          detail: { isMuted: this.isMuted, volume: this.volume },
        })
      );
    } catch {
      // ignore
    }
  }

  // Create an envelope node with smooth attack and exponential decay
  createTone(freq, type = 'sine', startTime, duration, peakGain = 0.3) {
    const ctx = this.getAudioContext();
    if (!ctx) return null;

    const osc = ctx.createOscillator();
    const gain = ctx.createGain();

    osc.type = type;
    osc.frequency.setValueAtTime(freq, startTime);

    const safePeak = Math.max(0.0001, peakGain * this.volume);
    gain.gain.setValueAtTime(0.0001, startTime);
    gain.gain.linearRampToValueAtTime(safePeak, startTime + 0.015);
    gain.gain.exponentialRampToValueAtTime(0.0001, startTime + duration);

    osc.connect(gain);
    gain.connect(ctx.destination);

    osc.start(startTime);
    osc.stop(startTime + duration + 0.05);

    return { osc, gain };
  }

  // Positive Action: 1. Task Completed (Crisp chime & subtle resonance)
  playTaskComplete() {
    if (this.isMuted || this.volume <= 0) return;
    try {
      this.resumeContext();
      const ctx = this.getAudioContext();
      if (!ctx) return;

      const now = ctx.currentTime;
      // Primary bright melodic ping
      this.createTone(587.33, 'sine', now, 0.18, 0.35); // D5
      this.createTone(880.0, 'triangle', now + 0.04, 0.22, 0.28); // A5
      // Sparkling harmonic overtone
      this.createTone(1760.0, 'sine', now + 0.04, 0.12, 0.12);
    } catch {
      // Silently catch audio buffer quirks
    }
  }

  // Positive Action: 2. Lesson Advanced (Harmonic ascending dual-chime)
  playLessonComplete() {
    if (this.isMuted || this.volume <= 0) return;
    try {
      this.resumeContext();
      const ctx = this.getAudioContext();
      if (!ctx) return;

      const now = ctx.currentTime;
      // Step 1: Note C5 (523.25 Hz)
      this.createTone(523.25, 'sine', now, 0.25, 0.32);
      this.createTone(1046.5, 'sine', now, 0.15, 0.1);
      // Step 2: Note G5 (783.99 Hz) with sweet warm sustain
      this.createTone(783.99, 'sine', now + 0.12, 0.35, 0.35);
      this.createTone(1567.98, 'triangle', now + 0.12, 0.2, 0.12);
    } catch {
      // ignore
    }
  }

  // Positive Action: 3. Full Course Finished (Triumphant celebratory arpeggio & fanfare)
  playCourseComplete() {
    if (this.isMuted || this.volume <= 0) return;
    try {
      this.resumeContext();
      const ctx = this.getAudioContext();
      if (!ctx) return;

      const now = ctx.currentTime;
      // Major Arpeggio: C5 -> E5 -> G5 -> C6 -> E6
      const notes = [523.25, 659.25, 783.99, 1046.5, 1318.51];
      notes.forEach((freq, idx) => {
        const time = now + idx * 0.09;
        this.createTone(freq, 'triangle', time, 0.45, 0.3);
        this.createTone(freq * 1.5, 'sine', time, 0.3, 0.15);
      });

      // Culminating sustained celebratory chord
      const chordStart = now + 0.48;
      this.createTone(523.25, 'sine', chordStart, 0.7, 0.25);
      this.createTone(659.25, 'sine', chordStart, 0.7, 0.25);
      this.createTone(1046.5, 'sine', chordStart, 0.8, 0.35);
      this.createTone(2093.0, 'sine', chordStart + 0.05, 0.5, 0.15); // Shimmer
    } catch {
      // ignore
    }
  }

  // Positive Action: 4. Strategic Goal Milestone Reached (Deep resonant harmonic chord)
  playGoalComplete() {
    if (this.isMuted || this.volume <= 0) return;
    try {
      this.resumeContext();
      const ctx = this.getAudioContext();
      if (!ctx) return;

      const now = ctx.currentTime;
      // Rich resonant chord (F Major 9 harmony)
      const chord = [349.23, 440.0, 523.25, 659.25, 698.46];
      chord.forEach((freq) => {
        this.createTone(freq, 'sine', now, 0.55, 0.25);
        this.createTone(freq, 'triangle', now + 0.03, 0.4, 0.15);
      });
      // High harmonic bell
      this.createTone(1396.91, 'sine', now + 0.08, 0.45, 0.2);
    } catch {
      // ignore
    }
  }

  // Positive Action: 5. Habit Checked / Streak Extended (Tactile snappy pop)
  playHabitCheck() {
    if (this.isMuted || this.volume <= 0) return;
    try {
      this.resumeContext();
      const ctx = this.getAudioContext();
      if (!ctx) return;

      const now = ctx.currentTime;
      // Snappy wooden/tactile tick
      this.createTone(659.25, 'triangle', now, 0.1, 0.4);
      this.createTone(1318.51, 'sine', now + 0.02, 0.08, 0.25);
      // Soft sub tap
      this.createTone(329.63, 'sine', now, 0.08, 0.3);
    } catch {
      // ignore
    }
  }

  // Positive Action: 6. Gamification Level Up (Orchestral Fanfare & Shimmer)
  playLevelUp() {
    if (this.isMuted || this.volume <= 0) return;
    try {
      this.resumeContext();
      const ctx = this.getAudioContext();
      if (!ctx) return;

      const now = ctx.currentTime;
      // Ascending triumphant fanfare: G4 -> C5 -> E5 -> G5 -> C6
      const fanfare = [392.0, 523.25, 659.25, 783.99, 1046.5];
      fanfare.forEach((freq, idx) => {
        const time = now + idx * 0.11;
        this.createTone(freq, 'triangle', time, 0.4, 0.32);
        this.createTone(freq * 2, 'sine', time, 0.25, 0.12);
      });

      // Majestic grand finale chord with shimmering decay
      const finaleTime = now + 0.55;
      this.createTone(523.25, 'sine', finaleTime, 1.1, 0.35); // C5
      this.createTone(659.25, 'sine', finaleTime, 1.1, 0.3);  // E5
      this.createTone(783.99, 'sine', finaleTime, 1.1, 0.3);  // G5
      this.createTone(1046.5, 'sine', finaleTime, 1.2, 0.4);  // C6
      this.createTone(2093.0, 'sine', finaleTime + 0.05, 0.8, 0.2); // Sparkling shimmer
    } catch {
      // ignore
    }
  }

  // Unified dispatcher
  playSound(type) {
    switch (type) {
      case 'task':
      case 'taskComplete':
        this.playTaskComplete();
        break;
      case 'lesson':
      case 'lessonComplete':
        this.playLessonComplete();
        break;
      case 'course':
      case 'courseComplete':
        this.playCourseComplete();
        break;
      case 'goal':
      case 'goalComplete':
        this.playGoalComplete();
        break;
      case 'habit':
      case 'habitCheck':
        this.playHabitCheck();
        break;
      case 'levelup':
      case 'levelUp':
        this.playLevelUp();
        break;
      default:
        this.playTaskComplete();
        break;
    }
  }
}

export const soundService = new SoundService();
