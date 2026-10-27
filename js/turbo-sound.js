/**
 * Ultra-Realistic Turbocharger & Wastegate Sound Synthesizer
 * Organic Aerodynamic Resonance Modeling + Studio Blow-Off Valve (BOV)
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
    this.peakSpool = 0.0;
    this.lastThrottle = 0.0;
    this.lastTargetThrottle = 0.0;
    this.lastBovTime = 0.0;
    this.bovBuffer = null;
    this.bovLoading = false;
    this.hasVented = false;

    // Master Audio Chain
    this.masterGain = null;
    this.noiseBuffer = null;
    this.noiseSource = null;

    // Aerodynamic Whistle Filters (Air Cavitation Resonance)
    this.whistleBandpass1 = null;
    this.whistleBandpass2 = null;
    this.whistleGain1 = null;
    this.whistleGain2 = null;

    // Air Induction Rush Filter
    this.intakeHissFilter = null;
    this.intakeHissGain = null;

    // Metallic Rotor Chime (Subtle Blade Ringing)
    this.metallicOsc = null;
    this.metallicGain = null;
    this.rotorLFO = null;
    this.rotorLFOGain = null;
  }

  async init() {
    if (this.isInitialized || !this.ctx) return;

    try {
      const dest = this.getDestination() || this.ctx.destination;

      // Master Turbo Gain
      this.masterGain = this.ctx.createGain();
      this.masterGain.gain.setValueAtTime(this.enabled ? (this.volume / 100.0) : 0, this.ctx.currentTime);
      this.masterGain.connect(dest);

      // 1. Generate High-Resolution Airflow Turbulence Stream
      // Using broadband pink/air noise rather than computer sine oscillators
      const bufferLength = Math.max(2048, Math.floor(this.ctx.sampleRate * 2.5));
      this.noiseBuffer = this.ctx.createBuffer(1, bufferLength, this.ctx.sampleRate);
      const data = this.noiseBuffer.getChannelData(0);
      let b0 = 0, b1 = 0, b2 = 0;
      for (let i = 0; i < bufferLength; i++) {
        const white = Math.random() * 2 - 1;
        // 3-pole pinking filter for smooth, organic airflow acoustics
        b0 = 0.99765 * b0 + white * 0.0990460;
        b1 = 0.96300 * b1 + white * 0.2965164;
        b2 = 0.57000 * b2 + white * 1.0526913;
        data[i] = (b0 + b1 + b2 + white * 0.1848) * 0.45;
      }

      this.noiseSource = this.ctx.createBufferSource();
      this.noiseSource.buffer = this.noiseBuffer;
      this.noiseSource.loop = true;

      // 2. Primary Resonant Aerodynamic Turbine Filter (Q = 17)
      // Generates genuine compressed air whistle through the compressor housing
      this.whistleBandpass1 = this.ctx.createBiquadFilter();
      this.whistleBandpass1.type = 'bandpass';
      this.whistleBandpass1.Q.setValueAtTime(17.0, this.ctx.currentTime);
      this.whistleBandpass1.frequency.setValueAtTime(2100, this.ctx.currentTime);

      this.whistleGain1 = this.ctx.createGain();
      this.whistleGain1.gain.setValueAtTime(0, this.ctx.currentTime);

      // 3. Second Turbine Cavity Resonance (Harmonic Blade Shear, Q = 13)
      this.whistleBandpass2 = this.ctx.createBiquadFilter();
      this.whistleBandpass2.type = 'bandpass';
      this.whistleBandpass2.Q.setValueAtTime(13.0, this.ctx.currentTime);
      this.whistleBandpass2.frequency.setValueAtTime(4100, this.ctx.currentTime);

      this.whistleGain2 = this.ctx.createGain();
      this.whistleGain2.gain.setValueAtTime(0, this.ctx.currentTime);

      // 4. Air Induction Rush (Pressurized Air Suction through Intercooler)
      this.intakeHissFilter = this.ctx.createBiquadFilter();
      this.intakeHissFilter.type = 'bandpass';
      this.intakeHissFilter.Q.setValueAtTime(2.2, this.ctx.currentTime);
      this.intakeHissFilter.frequency.setValueAtTime(2800, this.ctx.currentTime);

      this.intakeHissGain = this.ctx.createGain();
      this.intakeHissGain.gain.setValueAtTime(0, this.ctx.currentTime);

      // Connect Noise Generator through the filter banks
      this.noiseSource.connect(this.whistleBandpass1);
      this.whistleBandpass1.connect(this.whistleGain1);
      this.whistleGain1.connect(this.masterGain);

      this.noiseSource.connect(this.whistleBandpass2);
      this.whistleBandpass2.connect(this.whistleGain2);
      this.whistleGain2.connect(this.masterGain);

      this.noiseSource.connect(this.intakeHissFilter);
      this.intakeHissFilter.connect(this.intakeHissGain);
      this.intakeHissGain.connect(this.masterGain);

      this.noiseSource.start();

      // 5. Metallic Rotor Chime (Subtle Titanium Blade Passing Ring at High Boost)
      this.metallicOsc = this.ctx.createOscillator();
      this.metallicOsc.type = 'triangle';
      this.metallicOsc.frequency.setValueAtTime(2100, this.ctx.currentTime);

      this.rotorLFO = this.ctx.createOscillator();
      this.rotorLFO.frequency.setValueAtTime(9.2, this.ctx.currentTime);

      this.rotorLFOGain = this.ctx.createGain();
      this.rotorLFOGain.gain.setValueAtTime(14.0, this.ctx.currentTime);

      this.rotorLFO.connect(this.rotorLFOGain);
      this.rotorLFOGain.connect(this.metallicOsc.frequency);

      this.metallicGain = this.ctx.createGain();
      this.metallicGain.gain.setValueAtTime(0, this.ctx.currentTime);

      this.metallicOsc.connect(this.metallicGain);
      this.metallicGain.connect(this.masterGain);

      this.metallicOsc.start();
      this.rotorLFO.start();

      // Load studio-recorded blow-off sample
      this.loadStudioBov();

      this.isInitialized = true;
    } catch (e) {
      console.warn('TurboSoundEngine init warning:', e);
    }
  }

  async loadStudioBov() {
    if (this.bovBuffer || this.bovLoading || !this.ctx) return;
    this.bovLoading = true;
    try {
      let b64 = null;
      if (window.CAR_PRESETS) {
        if (window.CAR_PRESETS.amg_m177 && window.CAR_PRESETS.amg_m177.sounds && window.CAR_PRESETS.amg_m177.sounds.bov) {
          b64 = window.CAR_PRESETS.amg_m177.sounds.bov;
        } else if (window.CAR_PRESETS.supra_2jz && window.CAR_PRESETS.supra_2jz.sounds && window.CAR_PRESETS.supra_2jz.sounds.bov) {
          b64 = window.CAR_PRESETS.supra_2jz.sounds.bov;
        }
      }
      if (b64) {
        const binaryString = window.atob(b64);
        const bytes = new Uint8Array(binaryString.length);
        for (let i = 0; i < binaryString.length; i++) {
          bytes[i] = binaryString.charCodeAt(i);
        }
        this.ctx.decodeAudioData(bytes.buffer.slice(0), (decoded) => {
          this.bovBuffer = decoded;
          this.bovLoading = false;
        }, () => {
          this.bovLoading = false;
        });
      } else {
        this.bovLoading = false;
      }
    } catch (e) {
      this.bovLoading = false;
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
   * Authentic Blow-Off Valve (Venting Pressurized Air / Compressor Flutter)
   */
  triggerBlowOff(spool) {
    if (!this.enabled || !this.bovEnabled || this.volume <= 0 || !this.ctx) return;
    const now = this.ctx.currentTime;
    if (now - this.lastBovTime < 0.28) return; // cooldown
    this.lastBovTime = now;

    const clampedSpool = Math.max(0.15, Math.min(1.0, spool || 0.5));
    const bovVol = Math.max(0.15, Math.min(1.0, (clampedSpool * 1.3) * (this.volume / 100.0) * 0.95));

    // 1. Play real studio-recorded BOV sample if available
    if (this.bovBuffer) {
      try {
        const src = this.ctx.createBufferSource();
        src.buffer = this.bovBuffer;
        // Natural slight pitch variation (+/- 5%)
        src.playbackRate.setValueAtTime(0.95 + Math.random() * 0.1, now);

        const gain = this.ctx.createGain();
        gain.gain.setValueAtTime(bovVol, now);

        src.connect(gain);
        gain.connect(this.masterGain);
        src.start(now);
        return;
      } catch (e) {}
    }

    // 2. High-fidelity procedural flutter fallback
    try {
      const bovGain = this.ctx.createGain();
      const bovFilter = this.ctx.createBiquadFilter();
      bovFilter.type = 'bandpass';
      bovFilter.frequency.setValueAtTime(3200, now);
      bovFilter.frequency.exponentialRampToValueAtTime(850, now + 0.35);
      bovFilter.Q.setValueAtTime(3.5, now);

      const bovNoise = this.ctx.createBufferSource();
      bovNoise.buffer = this.noiseBuffer;
      bovNoise.loop = true;

      const pulseIntervals = [0.0, 0.065, 0.13, 0.195, 0.26, 0.325];
      pulseIntervals.forEach((tOffset, idx) => {
        const pStart = now + tOffset;
        const decay = Math.pow(0.68, idx);
        const pAmp = Math.max(0.001, bovVol * decay);
        bovGain.gain.setValueAtTime(pAmp, pStart);
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
  update(dt, rpm, redlineRpm, throttle, isEngineRunning, targetThrottle) {
    if (!this.isInitialized) this.init();
    if (!this.isInitialized || !this.ctx) return;

    if (!this.bovBuffer && !this.bovLoading) {
      this.loadStudioBov();
    }

    const safeRpm = Math.max(0, rpm || 0);
    const safeRedline = Math.max(3000, redlineRpm || 7000);
    const safeThrottle = Math.max(0, Math.min(1.0, throttle || 0));
    const safeTargetThrottle = (targetThrottle !== undefined && targetThrottle !== null)
      ? Math.max(0, Math.min(1.0, targetThrottle))
      : safeThrottle;
    const effectiveThrottle = Math.max(safeThrottle, safeTargetThrottle);

    if (!this.enabled || !isEngineRunning || this.volume <= 0) {
      this.spool = 0;
      this.peakSpool = 0;
      if (this.whistleGain1) this.whistleGain1.gain.setTargetAtTime(0, this.ctx.currentTime, 0.05);
      if (this.whistleGain2) this.whistleGain2.gain.setTargetAtTime(0, this.ctx.currentTime, 0.05);
      if (this.intakeHissGain) this.intakeHissGain.gain.setTargetAtTime(0, this.ctx.currentTime, 0.05);
      if (this.metallicGain) this.metallicGain.gain.setTargetAtTime(0, this.ctx.currentTime, 0.05);
      this.lastThrottle = safeThrottle;
      this.lastTargetThrottle = safeTargetThrottle;
      return;
    }

    // REAL TURBO BOOST PHYSICS:
    // A turbo requires both exhaust velocity (RPM > 1600) AND throttle load (> 12%) to build boost!
    const minSpoolRpm = 1600;
    const fullSpoolRpm = Math.min(5800, safeRedline * 0.85);

    let targetBoost = 0.0;
    if (safeRpm > minSpoolRpm && effectiveThrottle > 0.12) {
      const rpmFactor = Math.min(1.0, Math.max(0, (safeRpm - minSpoolRpm) / (fullSpoolRpm - minSpoolRpm)));
      const throttleFactor = Math.pow((effectiveThrottle - 0.12) / 0.88, 1.15);
      targetBoost = Math.min(1.0, Math.pow(rpmFactor, 0.65) * throttleFactor);
    }

    // Realistic Turbo Lag / Spool Inertia:
    if (targetBoost > this.spool) {
      // Spools up quickly under throttle load (~0.25 - 0.3s)
      this.spool += (targetBoost - this.spool) * Math.min(1.0, dt * 5.0);
    } else {
      // Rapid boost drop when throttle closes
      this.spool += (targetBoost - this.spool) * Math.min(1.0, dt * 6.5);
    }

    // Track peak boost achieved under current throttle application
    if (safeTargetThrottle > 0.18) {
      this.hasVented = false;
      if (this.spool > 0.10) {
        this.peakSpool = Math.max(this.peakSpool || 0, this.spool);
      }
    }

    // Blow-Off Valve (BOV) Trigger Logic:
    // Triggers cleanly once when driver lifts off throttle under boost
    const boostAtLift = Math.max(this.spool, this.peakSpool || 0);
    const targetLift = (this.lastTargetThrottle - safeTargetThrottle > 0.10);
    const smoothedLift = (this.lastThrottle - safeThrottle > 0.04);
    const directClose = (safeTargetThrottle < 0.08 && (this.peakSpool || 0) > 0.12);

    if (!this.hasVented && (targetLift || smoothedLift || directClose) && boostAtLift > 0.12) {
      this.triggerBlowOff(boostAtLift);
      this.hasVented = true;
      this.peakSpool = 0;
    } else if (effectiveThrottle < 0.08) {
      this.peakSpool = 0;
    }

    this.lastThrottle = safeThrottle;
    this.lastTargetThrottle = safeTargetThrottle;

    // Organic Aerodynamic Frequencies:
    // Turbine spool tone sweeps smoothly from 1,800 Hz up to 4,200 Hz
    const primaryFreq = 1800 + this.spool * 2400;
    const harmonicFreq = primaryFreq * 1.92;

    this.whistleBandpass1.frequency.setTargetAtTime(primaryFreq, this.ctx.currentTime, 0.04);
    this.whistleBandpass2.frequency.setTargetAtTime(harmonicFreq, this.ctx.currentTime, 0.04);
    this.intakeHissFilter.frequency.setTargetAtTime(2200 + this.spool * 1800, this.ctx.currentTime, 0.04);

    if (this.metallicOsc) {
      this.metallicOsc.frequency.setTargetAtTime(primaryFreq, this.ctx.currentTime, 0.04);
    }

    // Amplitudes:
    // Aerodynamic Whistle: natural curve with spool
    const whistleAmp1 = Math.pow(this.spool, 1.4) * 0.42;
    const whistleAmp2 = Math.pow(this.spool, 1.6) * 0.22;
    // Air rush through intake pipe
    const airHissAmp = Math.pow(this.spool, 1.2) * (0.2 + 0.8 * safeThrottle) * 0.32;
    // Metallic rotor blade chime (subtle bite, never synthetic)
    const metallicAmp = Math.pow(this.spool, 1.8) * 0.065;

    this.whistleGain1.gain.setTargetAtTime(whistleAmp1, this.ctx.currentTime, 0.04);
    this.whistleGain2.gain.setTargetAtTime(whistleAmp2, this.ctx.currentTime, 0.04);
    this.intakeHissGain.gain.setTargetAtTime(airHissAmp, this.ctx.currentTime, 0.04);
    if (this.metallicGain) {
      this.metallicGain.gain.setTargetAtTime(metallicAmp, this.ctx.currentTime, 0.04);
    }
  }

  stop() {
    this.spool = 0;
    if (this.whistleGain1 && this.ctx) this.whistleGain1.gain.setValueAtTime(0, this.ctx.currentTime);
    if (this.whistleGain2 && this.ctx) this.whistleGain2.gain.setValueAtTime(0, this.ctx.currentTime);
    if (this.intakeHissGain && this.ctx) this.intakeHissGain.gain.setValueAtTime(0, this.ctx.currentTime);
    if (this.metallicGain && this.ctx) this.metallicGain.gain.setValueAtTime(0, this.ctx.currentTime);
  }
}

// Export globally
window.TurboSoundEngine = TurboSoundEngine;
