/**
 * Turbocharger & Wastegate Flutter Sound Synthesizer
 * High-fidelity procedural turbine spool, air intake hiss & blow-off valve (stututu)
 * Works universally across both DSP Synthesis and HD Sample modes.
 */
class TurboSoundEngine {
  constructor(ctx, getDestination) {
    this.ctx = ctx;
    this.getDestination = typeof getDestination === 'function' ? getDestination : () => getDestination;

    this.enabled = true;
    this.volume = 100; // 0 to 150%
    this.bovEnabled = true;

    this.isInitialized = false;
    this.spool = 0.0;
    this.lastThrottle = 0.0;
    this.lastBovTime = 0.0;

    // Audio Nodes
    this.masterGain = null;
    this.whistleOsc = null;
    this.whistleHarmonic = null;
    this.whistleLFO = null;
    this.lfoGain = null;
    this.whistleGain = null;
    this.harmonicGain = null;

    this.noiseNode = null;
    this.airFilter = null;
    this.airResonance = null;
    this.airGain = null;
    this.noiseBuffer = null;
  }

  init() {
    if (this.isInitialized || !this.ctx) return;

    try {
      const dest = this.getDestination() || this.ctx.destination;

      // Master Turbo Gain
      this.masterGain = this.ctx.createGain();
      this.masterGain.gain.setValueAtTime(this.enabled ? (this.volume / 100.0) : 0, this.ctx.currentTime);
      this.masterGain.connect(dest);

      // 1. Generate 2-second looped noise buffer for intake & spool rush
      const bufferLength = Math.max(1024, Math.floor(this.ctx.sampleRate * 2));
      this.noiseBuffer = this.ctx.createBuffer(1, bufferLength, this.ctx.sampleRate);
      const data = this.noiseBuffer.getChannelData(0);
      let lastOut = 0.0;
      for (let i = 0; i < bufferLength; i++) {
        // Pink-ish noise filter for smooth, organic airflow
        const white = Math.random() * 2 - 1;
        lastOut = (lastOut + 0.03 * white) / 1.03;
        data[i] = lastOut * 3.5;
      }

      this.noiseNode = this.ctx.createBufferSource();
      this.noiseNode.buffer = this.noiseBuffer;
      this.noiseNode.loop = true;

      // Bandpass filter tracking spool frequency
      this.airFilter = this.ctx.createBiquadFilter();
      this.airFilter.type = 'bandpass';
      this.airFilter.frequency.setValueAtTime(1600, this.ctx.currentTime);
      this.airFilter.Q.setValueAtTime(2.6, this.ctx.currentTime);

      this.airResonance = this.ctx.createBiquadFilter();
      this.airResonance.type = 'peaking';
      this.airResonance.frequency.setValueAtTime(2800, this.ctx.currentTime);
      this.airResonance.Q.setValueAtTime(3.0, this.ctx.currentTime);
      this.airResonance.gain.setValueAtTime(5.0, this.ctx.currentTime);

      this.airGain = this.ctx.createGain();
      this.airGain.gain.setValueAtTime(0, this.ctx.currentTime);

      this.noiseNode.connect(this.airFilter);
      this.airFilter.connect(this.airResonance);
      this.airResonance.connect(this.airGain);
      this.airGain.connect(this.masterGain);
      this.noiseNode.start();

      // 2. High-Frequency Impeller Whistle Oscillators
      this.whistleOsc = this.ctx.createOscillator();
      this.whistleOsc.type = 'sine';
      this.whistleOsc.frequency.setValueAtTime(1200, this.ctx.currentTime);

      this.whistleHarmonic = this.ctx.createOscillator();
      this.whistleHarmonic.type = 'sine';
      this.whistleHarmonic.frequency.setValueAtTime(2400, this.ctx.currentTime);

      // Aerodynamic turbulence LFO vibrato (approx 9 Hz)
      this.whistleLFO = this.ctx.createOscillator();
      this.whistleLFO.type = 'sine';
      this.whistleLFO.frequency.setValueAtTime(9.5, this.ctx.currentTime);

      this.lfoGain = this.ctx.createGain();
      this.lfoGain.gain.setValueAtTime(14.0, this.ctx.currentTime);

      this.whistleLFO.connect(this.lfoGain);
      this.lfoGain.connect(this.whistleOsc.frequency);
      this.lfoGain.connect(this.whistleHarmonic.frequency);

      this.whistleGain = this.ctx.createGain();
      this.whistleGain.gain.setValueAtTime(0, this.ctx.currentTime);

      this.harmonicGain = this.ctx.createGain();
      this.harmonicGain.gain.setValueAtTime(0.24, this.ctx.currentTime);

      this.whistleOsc.connect(this.whistleGain);
      this.whistleHarmonic.connect(this.harmonicGain);
      this.harmonicGain.connect(this.whistleGain);
      this.whistleGain.connect(this.masterGain);

      this.whistleOsc.start();
      this.whistleHarmonic.start();
      this.whistleLFO.start();

      this.isInitialized = true;
    } catch (e) {
      console.warn('TurboSoundEngine init warning:', e);
    }
  }

  setEnabled(val) {
    this.enabled = !!val;
    if (this.masterGain && this.ctx) {
      const targetGain = this.enabled ? (this.volume / 100.0) : 0;
      this.masterGain.gain.setTargetAtTime(targetGain, this.ctx.currentTime, 0.05);
    }
  }

  setVolume(vol) {
    this.volume = Math.max(0, Math.min(150, vol));
    if (this.masterGain && this.ctx) {
      const targetGain = this.enabled ? (this.volume / 100.0) : 0;
      this.masterGain.gain.setTargetAtTime(targetGain, this.ctx.currentTime, 0.05);
    }
  }

  setBovEnabled(val) {
    this.bovEnabled = !!val;
  }

  /**
   * Synthesize atmospheric blow-off venting & wastegate flutter (stututu)
   */
  triggerBlowOff(spool) {
    if (!this.enabled || !this.bovEnabled || this.volume <= 0 || !this.ctx || !this.noiseBuffer) return;
    const now = this.ctx.currentTime;
    if (now - this.lastBovTime < 0.38) return; // cooldown
    this.lastBovTime = now;

    try {
      const bovGain = this.ctx.createGain();
      const bovFilter = this.ctx.createBiquadFilter();
      bovFilter.type = 'bandpass';
      bovFilter.frequency.setValueAtTime(3400, now);
      bovFilter.frequency.exponentialRampToValueAtTime(950, now + 0.36);
      bovFilter.Q.setValueAtTime(3.2, now);

      const bovNoise = this.ctx.createBufferSource();
      bovNoise.buffer = this.noiseBuffer;
      bovNoise.loop = true;

      // Peak amplitude proportional to boost spool and user volume
      const maxBov = Math.min(0.55, spool * (this.volume / 100.0) * 0.48);

      // Stututu rhythmic pressure release flutter pulses
      const pulseIntervals = [0.0, 0.065, 0.13, 0.195, 0.26, 0.325];
      pulseIntervals.forEach((tOffset, idx) => {
        const pStart = now + tOffset;
        const decay = Math.pow(0.68, idx);
        bovGain.gain.setValueAtTime(maxBov * decay, pStart);
        bovGain.gain.exponentialRampToValueAtTime(0.0001, pStart + 0.055);
      });

      bovNoise.connect(bovFilter);
      bovFilter.connect(bovGain);
      bovGain.connect(this.masterGain);

      bovNoise.start(now);
      bovNoise.stop(now + 0.42);

      setTimeout(() => {
        try {
          bovNoise.disconnect();
          bovFilter.disconnect();
          bovGain.disconnect();
        } catch (e) {}
      }, 500);
    } catch (e) {}
  }

  /**
   * Per-frame physics & sound update at 60 FPS
   */
  update(dt, rpm, redlineRpm, throttle, isEngineRunning) {
    if (!this.isInitialized) this.init();
    if (!this.isInitialized || !this.ctx) return;

    const safeRpm = Math.max(0, rpm || 0);
    const safeRedline = Math.max(3000, redlineRpm || 7000);
    const safeThrottle = Math.max(0, Math.min(1.0, throttle || 0));

    if (!this.enabled || !isEngineRunning || this.volume <= 0) {
      this.spool = 0;
      if (this.whistleGain) this.whistleGain.gain.setTargetAtTime(0, this.ctx.currentTime, 0.05);
      if (this.airGain) this.airGain.gain.setTargetAtTime(0, this.ctx.currentTime, 0.05);
      this.lastThrottle = safeThrottle;
      return;
    }

    // Boost target: rises with RPM & throttle
    const rpmNorm = Math.min(1.0, Math.max(0, (safeRpm - 700) / (safeRedline - 700)));
    const targetSpool = safeThrottle > 0.04
      ? Math.min(1.0, Math.pow(rpmNorm, 0.65) * (0.28 + 0.72 * safeThrottle))
      : 0.0;

    // Spool inertia (realistic turbo lag)
    if (targetSpool > this.spool) {
      this.spool += (targetSpool - this.spool) * Math.min(1.0, dt * 5.2);
    } else {
      this.spool += (targetSpool - this.spool) * Math.min(1.0, dt * 4.2);
    }

    // Check for Blow-off / Wastegate trigger (fast throttle lift from boost)
    if ((this.lastThrottle - safeThrottle > 0.22) && this.spool > 0.18) {
      this.triggerBlowOff(this.spool);
    }
    this.lastThrottle = safeThrottle;

    // Whistle frequency range: ~1,200 Hz up to ~3,950 Hz
    const targetFreq = 1200 + this.spool * 2750;
    this.whistleOsc.frequency.setTargetAtTime(targetFreq, this.ctx.currentTime, 0.04);
    this.whistleHarmonic.frequency.setTargetAtTime(targetFreq * 2.01, this.ctx.currentTime, 0.04);

    // Air rush bandpass filter frequency
    this.airFilter.frequency.setTargetAtTime(1550 + this.spool * 2400, this.ctx.currentTime, 0.04);

    // Audio Gain envelopes
    const whistleAmp = Math.pow(this.spool, 1.35) * 0.32;
    const airAmp = Math.pow(this.spool, 1.2) * (0.25 + 0.75 * safeThrottle) * 0.28;

    this.whistleGain.gain.setTargetAtTime(whistleAmp, this.ctx.currentTime, 0.04);
    this.airGain.gain.setTargetAtTime(airAmp, this.ctx.currentTime, 0.04);
  }

  stop() {
    this.spool = 0;
    if (this.whistleGain && this.ctx) this.whistleGain.gain.setValueAtTime(0, this.ctx.currentTime);
    if (this.airGain && this.ctx) this.airGain.gain.setValueAtTime(0, this.ctx.currentTime);
  }
}

// Export globally
window.TurboSoundEngine = TurboSoundEngine;
