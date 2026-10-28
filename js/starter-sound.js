/**
 * TeslaSound Pro - Authentic Supercar Starter Motor Synthesizer (v7.8)
 * Synthesizes high-torque DC starter motor whine, mechanical solenoid clack,
 * rhythmic 6Hz compression strokes, and bendix disengagement.
 */
class StarterSound {
  constructor(ctx, getDestination) {
    this.ctx = ctx;
    this.getDestination = getDestination || (() => ctx.destination);
    this.isCranking = false;
    this.crankTimer = null;
  }

  /**
   * Play full realistic starter crank sequence
   * @param {number} duration Duration of cranking in seconds before engine fires (default 1.05s)
   * @param {function} onCatch Callback when ignition catches and engine flares up
   * @param {function} onComplete Callback when starter is fully finished and disengaged
   */
  startCrank(duration = 1.05, onCatch = null, onComplete = null) {
    if (!this.ctx || this.isCranking) return;
    this.isCranking = true;
    const now = this.ctx.currentTime;
    const dest = this.getDestination();

    // Starter Master Gain & Highpass Filter
    const masterGain = this.ctx.createGain();
    masterGain.gain.setValueAtTime(1.0, now);
    masterGain.connect(dest);

    // 1. Initial Solenoid Engagement Clack (t = 0.0s)
    this._playSolenoidClack(now, masterGain);

    // 2. High-Torque Electric Starter Motor Whine
    const motorNodes = this._createStarterMotor(now, duration, masterGain);

    // 3. Cylinder Compression Resistance Chugs (6.2 Hz rhythmic thuds)
    const chugNodes = this._createCompressionChugs(now, duration, masterGain);

    // Schedule Engine Ignition Catch (at duration)
    const catchTimeMs = Math.round(duration * 1000);
    this.crankTimer = setTimeout(() => {
      this.isCranking = false;
      const catchNow = this.ctx.currentTime;

      // Disengage starter motor with smooth spin-down fade
      masterGain.gain.setTargetAtTime(0.001, catchNow, 0.08);

      // Solenoid Disengagement Bendix Click
      this._playDisengageClick(catchNow, dest);

      // Clean up nodes after fade out
      setTimeout(() => {
        try {
          motorNodes.forEach(n => { if (n.stop) n.stop(); n.disconnect(); });
          chugNodes.forEach(n => { if (n.stop) n.stop(); n.disconnect(); });
          masterGain.disconnect();
        } catch (e) {}
      }, 250);

      if (onCatch) onCatch();
      if (onComplete) onComplete();
    }, catchTimeMs);
  }

  stopCrank() {
    if (this.crankTimer) {
      clearTimeout(this.crankTimer);
      this.crankTimer = null;
    }
    this.isCranking = false;
  }

  // Heavy mechanical solenoid engagement clack
  _playSolenoidClack(t, dest) {
    try {
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();
      const filter = this.ctx.createBiquadFilter();

      osc.type = 'triangle';
      osc.frequency.setValueAtTime(180, t);
      osc.frequency.exponentialRampToValueAtTime(45, t + 0.045);

      filter.type = 'lowpass';
      filter.frequency.setValueAtTime(800, t);

      gain.gain.setValueAtTime(0.75, t);
      gain.gain.exponentialRampToValueAtTime(0.001, t + 0.05);

      osc.connect(filter);
      filter.connect(gain);
      gain.connect(dest);

      osc.start(t);
      osc.stop(t + 0.06);

      // Metallic click transient
      const clickBuf = this.ctx.createBuffer(1, Math.floor(this.ctx.sampleRate * 0.03), this.ctx.sampleRate);
      const data = clickBuf.getChannelData(0);
      for (let i = 0; i < data.length; i++) {
        data[i] = (Math.random() * 2 - 1) * Math.exp(-i / (this.ctx.sampleRate * 0.004));
      }
      const clickSrc = this.ctx.createBufferSource();
      clickSrc.buffer = clickBuf;
      const clickFilter = this.ctx.createBiquadFilter();
      clickFilter.type = 'bandpass';
      clickFilter.frequency.value = 2400;
      clickFilter.Q.value = 3.0;
      const clickGain = this.ctx.createGain();
      clickGain.gain.setValueAtTime(0.6, t);
      clickSrc.connect(clickFilter);
      clickFilter.connect(clickGain);
      clickGain.connect(dest);
      clickSrc.start(t);
    } catch (e) {}
  }

  // Electric starter motor rotating at ~3000 RPM (fundamental ~340 Hz + harmonics)
  _createStarterMotor(t, duration, dest) {
    const nodes = [];
    try {
      // Motor fundamental oscillator
      const osc1 = this.ctx.createOscillator();
      const osc2 = this.ctx.createOscillator();
      const gain = this.ctx.createGain();

      osc1.type = 'sawtooth';
      osc2.type = 'square';

      // Pitch curve: quick ramp up from 180 Hz to 345 Hz as starter reaches cranking speed
      osc1.frequency.setValueAtTime(180, t);
      osc1.frequency.exponentialRampToValueAtTime(345, t + 0.12);

      osc2.frequency.setValueAtTime(360, t);
      osc2.frequency.exponentialRampToValueAtTime(690, t + 0.12);

      // 6.2 Hz Compression stroke pitch modulation (resistance of pistons compressing air)
      const lfo = this.ctx.createOscillator();
      const lfoGain = this.ctx.createGain();
      lfo.frequency.setValueAtTime(6.2, t); // ~240 cranking RPM / 40 = 6 Hz
      lfoGain.gain.setValueAtTime(28, t);   // +/- 28 Hz pitch dip per stroke

      lfo.connect(lfoGain);
      lfoGain.connect(osc1.frequency);
      lfoGain.connect(osc2.frequency);
      lfo.start(t);
      lfo.stop(t + duration + 0.2);
      nodes.push(lfo, lfoGain);

      // Resonant motor casing filter
      const filter = this.ctx.createBiquadFilter();
      filter.type = 'bandpass';
      filter.frequency.setValueAtTime(750, t);
      filter.Q.setValueAtTime(2.2, t);

      // Starter motor volume envelope
      gain.gain.setValueAtTime(0.001, t);
      gain.gain.linearRampToValueAtTime(0.48, t + 0.08);
      gain.gain.setValueAtTime(0.48, t + duration - 0.05);

      osc1.connect(filter);
      osc2.connect(filter);
      filter.connect(gain);
      gain.connect(dest);

      osc1.start(t);
      osc2.start(t);
      osc1.stop(t + duration + 0.2);
      osc2.stop(t + duration + 0.2);
      nodes.push(osc1, osc2, filter, gain);
    } catch (e) {}
    return nodes;
  }

  // Rhythmic cylinder compression strokes (thumping air displacement)
  _createCompressionChugs(t, duration, dest) {
    const nodes = [];
    try {
      // Noise burst modulated at 6.2 Hz
      const bufferSize = Math.floor(this.ctx.sampleRate * (duration + 0.1));
      const noiseBuffer = this.ctx.createBuffer(1, bufferSize, this.ctx.sampleRate);
      const output = noiseBuffer.getChannelData(0);
      for (let i = 0; i < bufferSize; i++) {
        output[i] = Math.random() * 2 - 1;
      }

      const whiteNoise = this.ctx.createBufferSource();
      whiteNoise.buffer = noiseBuffer;

      // Filter to deep metallic intake/compression thud
      const filter = this.ctx.createBiquadFilter();
      filter.type = 'lowpass';
      filter.frequency.setValueAtTime(280, t);

      // Tremolo amplitude modulation for compression chugs
      const amGain = this.ctx.createGain();
      const amLfo = this.ctx.createOscillator();
      const amLfoScale = this.ctx.createGain();

      amLfo.frequency.setValueAtTime(6.2, t);
      amLfoScale.gain.setValueAtTime(0.35, t);
      amGain.gain.setValueAtTime(0.35, t);

      amLfo.connect(amLfoScale);
      amLfoScale.connect(amGain.gain);

      whiteNoise.connect(filter);
      filter.connect(amGain);
      amGain.connect(dest);

      amLfo.start(t);
      whiteNoise.start(t);
      amLfo.stop(t + duration + 0.1);
      whiteNoise.stop(t + duration + 0.1);

      nodes.push(whiteNoise, filter, amGain, amLfo, amLfoScale);
    } catch (e) {}
    return nodes;
  }

  // Bendix overrunning clutch release click when engine catches
  _playDisengageClick(t, dest) {
    try {
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();
      osc.type = 'sine';
      osc.frequency.setValueAtTime(1200, t);
      osc.frequency.exponentialRampToValueAtTime(300, t + 0.08);

      gain.gain.setValueAtTime(0.35, t);
      gain.gain.exponentialRampToValueAtTime(0.001, t + 0.08);

      osc.connect(gain);
      gain.connect(dest);
      osc.start(t);
      osc.stop(t + 0.09);
    } catch (e) {}
  }
}

window.StarterSound = StarterSound;
