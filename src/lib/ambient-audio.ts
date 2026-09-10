/**
 * Ambient Audio Synthesizer for MindMitra.
 * Generates calming traditional Assamese pentatonic flute melodies,
 * gentle tanpura drones, and peaceful acoustic hums using the Web Audio API.
 * Never requires external audio assets or network downloads.
 */

class AmbientAudioEngine {
  private ctx: AudioContext | null = null;
  private currentOsc: OscillatorNode | null = null;
  private currentGain: GainNode | null = null;
  private isPlaying = false;
  private melodyTimer: any = null;

  private initContext() {
    if (!this.ctx && typeof window !== "undefined") {
      const AudioCtx = window.AudioContext || (window as any).webkitAudioContext;
      if (AudioCtx) {
        this.ctx = new AudioCtx();
      }
    }
    if (this.ctx && this.ctx.state === "suspended") {
      void this.ctx.resume();
    }
  }

  // Pentatonic notes for Assamese Bihu / Flute folk melody (Sa, Re, Ga, Pa, Dha)
  private folkNotes = [261.63, 293.66, 329.63, 392.0, 440.0, 523.25];

  public playFolkFlute(onNoteChange?: (noteName: string) => void): boolean {
    this.stop();
    this.initContext();
    if (!this.ctx) return false;

    this.isPlaying = true;
    let noteIndex = 0;
    const melody = [0, 1, 2, 4, 3, 2, 1, 0, 4, 5, 4, 2, 1, 0];
    const noteNames = ["Sa", "Re", "Ga", "Dha", "Pa", "Ga", "Re", "Sa", "Dha", "Tā-Sa", "Dha", "Ga", "Re", "Sa"];

    const playNextNote = () => {
      if (!this.isPlaying || !this.ctx) return;

      const freq = this.folkNotes[melody[noteIndex % melody.length]];
      const name = noteNames[noteIndex % noteNames.length];
      if (onNoteChange) onNoteChange(name);

      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();

      // Flute-like gentle sine wave with subtle vibrato
      osc.type = "sine";
      osc.frequency.setValueAtTime(freq, this.ctx.currentTime);

      // Soft envelope (gentle attack, soft decay)
      gain.gain.setValueAtTime(0.001, this.ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.12, this.ctx.currentTime + 0.15);
      gain.gain.exponentialRampToValueAtTime(0.001, this.ctx.currentTime + 0.95);

      osc.connect(gain);
      gain.connect(this.ctx.destination);

      osc.start();
      osc.stop(this.ctx.currentTime + 1.0);

      noteIndex++;
      this.melodyTimer = setTimeout(playNextNote, 1100);
    };

    playNextNote();
    return true;
  }

  public playTanpuraDrone(): boolean {
    this.stop();
    this.initContext();
    if (!this.ctx) return false;

    this.isPlaying = true;
    const masterGain = this.ctx.createGain();
    masterGain.gain.setValueAtTime(0.08, this.ctx.currentTime);
    masterGain.connect(this.ctx.destination);

    // Root drone (Sa: 130.81 Hz) and Pa (196.00 Hz)
    const freqs = [130.81, 196.0, 261.63];
    freqs.forEach((freq) => {
      if (!this.ctx) return;
      const osc = this.ctx.createOscillator();
      osc.type = "triangle";
      osc.frequency.setValueAtTime(freq, this.ctx.currentTime);

      const gain = this.ctx.createGain();
      gain.gain.setValueAtTime(0.04, this.ctx.currentTime);

      osc.connect(gain);
      gain.connect(masterGain);
      osc.start();
    });

    this.currentGain = masterGain;
    return true;
  }

  public playCourtyardSounds(): boolean {
    this.stop();
    this.initContext();
    if (!this.ctx) return false;

    this.isPlaying = true;
    const masterGain = this.ctx.createGain();
    masterGain.gain.setValueAtTime(0.06, this.ctx.currentTime);
    masterGain.connect(this.ctx.destination);
    this.currentGain = masterGain;

    // Gentle low breeze drone (110 Hz & 164.81 Hz)
    [110.0, 164.81].forEach((freq) => {
      if (!this.ctx) return;
      const osc = this.ctx.createOscillator();
      osc.type = "sine";
      osc.frequency.setValueAtTime(freq, this.ctx.currentTime);
      const gain = this.ctx.createGain();
      gain.gain.setValueAtTime(0.025, this.ctx.currentTime);
      osc.connect(gain);
      gain.connect(masterGain);
      osc.start();
    });

    // Random soft birdsong chirps and bamboo breeze notes
    const birdNotes = [1760.0, 1975.5, 2349.3, 2637.0, 3136.0]; // high harmonic pentatonic
    const triggerBirdsong = () => {
      if (!this.isPlaying || !this.ctx) return;

      const freq = birdNotes[Math.floor(Math.random() * birdNotes.length)];
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();
      osc.type = "sine";
      osc.frequency.setValueAtTime(freq, this.ctx.currentTime);
      osc.frequency.exponentialRampToValueAtTime(freq * 1.25, this.ctx.currentTime + 0.12);

      gain.gain.setValueAtTime(0.001, this.ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.04, this.ctx.currentTime + 0.05);
      gain.gain.exponentialRampToValueAtTime(0.001, this.ctx.currentTime + 0.28);

      osc.connect(gain);
      gain.connect(masterGain);
      osc.start();
      osc.stop(this.ctx.currentTime + 0.35);

      const nextDelay = 2200 + Math.random() * 3200;
      this.melodyTimer = setTimeout(triggerBirdsong, nextDelay);
    };

    triggerBirdsong();
    return true;
  }

  public stop() {
    this.isPlaying = false;
    if (this.melodyTimer) {
      clearTimeout(this.melodyTimer);
      this.melodyTimer = null;
    }
    if (this.currentGain && this.ctx) {
      try {
        this.currentGain.gain.exponentialRampToValueAtTime(0.0001, this.ctx.currentTime + 0.3);
      } catch {
        // ignore
      }
      this.currentGain = null;
    }
  }

  public active(): boolean {
    return this.isPlaying;
  }
}

export const ambientAudio = new AmbientAudioEngine();
