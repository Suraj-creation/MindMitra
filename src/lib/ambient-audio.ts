// Ambient Audio Synthesizer for MindMitra
// Uses Web Audio API for gentle acoustic grounding (Flute, Courtyard, Tanpura drone)

class AmbientAudioEngine {
  private ctx: AudioContext | null = null;
  private activeNodes: Array<{ stop?: () => void; disconnect: () => void }> = [];
  private isPlaying = false;

  private getContext(): AudioContext | null {
    if (typeof window === "undefined") return null;
    if (!this.ctx) {
      const AudioCtx = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
      if (AudioCtx) {
        this.ctx = new AudioCtx();
      }
    }
    if (this.ctx && this.ctx.state === "suspended") {
      void this.ctx.resume();
    }
    return this.ctx;
  }

  public playFolkFlute(): void {
    this.stop();
    const ctx = this.getContext();
    if (!ctx) return;

    this.isPlaying = true;
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();

    osc.type = "sine";
    osc.frequency.setValueAtTime(440, ctx.currentTime); // A4
    // Gentle bamboo flute vibrato
    const lfo = ctx.createOscillator();
    const lfoGain = ctx.createGain();
    lfo.frequency.setValueAtTime(5, ctx.currentTime);
    lfoGain.gain.setValueAtTime(4, ctx.currentTime);
    lfo.connect(osc.frequency);

    gain.gain.setValueAtTime(0.001, ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.08, ctx.currentTime + 1.2);

    osc.connect(gain);
    gain.connect(ctx.destination);

    osc.start();
    lfo.start();

    this.activeNodes.push({
      stop: () => {
        try {
          osc.stop();
          lfo.stop();
        } catch {
          // Ignore if already stopped
        }
      },
      disconnect: () => {
        osc.disconnect();
        lfo.disconnect();
        gain.disconnect();
      },
    });
  }

  public playCourtyardSounds(): void {
    this.stop();
    const ctx = this.getContext();
    if (!ctx) return;

    this.isPlaying = true;
    // Ambient gentle breeze / courtyard white noise filtered
    const bufferSize = ctx.sampleRate * 2;
    const buffer = ctx.createBuffer(1, bufferSize, ctx.sampleRate);
    const data = buffer.getChannelData(0);
    let lastOut = 0.0;
    for (let i = 0; i < bufferSize; i++) {
      const white = Math.random() * 2 - 1;
      data[i] = (lastOut + 0.02 * white) / 1.02; // Pink noise
      lastOut = data[i];
    }

    const noise = ctx.createBufferSource();
    noise.buffer = buffer;
    noise.loop = true;

    const filter = ctx.createBiquadFilter();
    filter.type = "lowpass";
    filter.frequency.setValueAtTime(320, ctx.currentTime);

    const gain = ctx.createGain();
    gain.gain.setValueAtTime(0.001, ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.04, ctx.currentTime + 2.0);

    noise.connect(filter);
    filter.connect(gain);
    gain.connect(ctx.destination);

    noise.start();

    this.activeNodes.push({
      stop: () => {
        try {
          noise.stop();
        } catch {
          // Ignore
        }
      },
      disconnect: () => {
        noise.disconnect();
        filter.disconnect();
        gain.disconnect();
      },
    });
  }

  public playTanpuraDrone(): void {
    this.stop();
    const ctx = this.getContext();
    if (!ctx) return;

    this.isPlaying = true;
    const frequencies = [146.83, 220, 293.66]; // D3, A3, D4
    frequencies.forEach((freq) => {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = "triangle";
      osc.frequency.setValueAtTime(freq, ctx.currentTime);

      gain.gain.setValueAtTime(0.001, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.03, ctx.currentTime + 1.5);

      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start();

      this.activeNodes.push({
        stop: () => {
          try {
            osc.stop();
          } catch {
            // Ignore
          }
        },
        disconnect: () => {
          osc.disconnect();
          gain.disconnect();
        },
      });
    });
  }

  /**
   * Dementia-friendly gentle brass bell / singing bowl chime for medication reminders.
   * Plays a warm 3-tone peaceful ascending triad (C5 -> E5 -> G5) with natural acoustic decay.
   */
  public playMedicationChime(): void {
    const ctx = this.getContext();
    if (!ctx) return;

    const notes = [
      { freq: 523.25, time: 0.0, dur: 1.8 }, // C5
      { freq: 659.25, time: 0.28, dur: 1.8 }, // E5
      { freq: 783.99, time: 0.56, dur: 2.4 }, // G5
    ];

    notes.forEach(({ freq, time, dur }) => {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();

      osc.type = "sine";
      osc.frequency.setValueAtTime(freq, ctx.currentTime + time);

      // Warm attack and gentle bell ring-out
      const startTime = ctx.currentTime + time;
      gain.gain.setValueAtTime(0.0001, startTime);
      gain.gain.exponentialRampToValueAtTime(0.09, startTime + 0.04);
      gain.gain.exponentialRampToValueAtTime(0.0001, startTime + dur);

      osc.connect(gain);
      gain.connect(ctx.destination);

      osc.start(startTime);
      osc.stop(startTime + dur + 0.1);

      this.activeNodes.push({
        stop: () => {
          try {
            osc.stop();
          } catch {
            // Safe
          }
        },
        disconnect: () => {
          osc.disconnect();
          gain.disconnect();
        },
      });
    });
  }

  public stop(): void {
    this.isPlaying = false;
    for (const node of this.activeNodes) {
      try {
        if (node.stop) node.stop();
        node.disconnect();
      } catch {
        // Safe disposal
      }
    }
    this.activeNodes = [];
  }

  public getStatus(): { isPlaying: boolean } {
    return { isPlaying: this.isPlaying };
  }
}

export const ambientAudio = new AmbientAudioEngine();
