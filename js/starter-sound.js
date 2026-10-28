/**
 * TeslaSound Pro - Authentic Supercar Starter Sound (v7.9)
 * Pure low-frequency mechanical starter rotation & compression thuds.
 * ZERO high-pitch square/sawtooth waves, ZERO squeaks or screeches.
 */
class StarterSound {
  constructor(ctx, getDestination) {
    this.ctx = ctx;
    this.getDestination = getDestination || (() => ctx.destination);
    this.isCranking = false;
    this.crankTimer = null;
  }

  /**
   * Play realistic deep starter crank sequence
   * @param {number} duration Crank duration in seconds (default 0.35s)
   * @param {function} onCatch Callback when ignition catches and engine flares
   * @param {function} onComplete Callback when crank completes
   */
  startCrank(duration = 0.35, onCatch = null, onComplete = null) {
    if (!this.ctx || this.isCranking) return;
    this.isCranking = true;
    const now = this.ctx.currentTime;
    const dest = this.getDestination();

    // Starter Master Bus (with steep Low-Pass filter at 220 Hz to eliminate ANY squeaks)
    const masterGain = this.ctx.createGain();
    const lowPass = this.ctx.createBiquadFilter();
    lowPass.type = 'lowpass';
    lowPass.frequency.setValueAtTime(220, now); // Absolute ceiling: no squeaks or buzzes can pass!
    lowPass.Q.setValueAtTime(0.7, now);

    masterGain.gain.setValueAtTime(0.45, now);
    masterGain.connect(lowPass);
    lowPass.connect(dest);

    // 1. Warm mechanical starter rotation (deep sine waves at 78 Hz & 156 Hz)
    const motorNodes = this._createDeepStarterRotation(now, duration, masterGain);

    // 2. Rhythmic low compression thumps (65 Hz sub-bass)
    const chugNodes = this._createLowCompressionThumps(now, duration, masterGain);

    // Schedule ignition catch at duration
    const catchMs = Math.round(duration * 1000);
    this.crankTimer = setTimeout(() => {
      this.isCranking = false;
      if (!this.ctx) return;
      const catchNow = this.ctx.currentTime;

      // Soft natural fade out
      masterGain.gain.setTargetAtTime(0.0001, catchNow, 0.05);

      setTimeout(() => {
        try {
          motorNodes.forEach(n => { if (n.stop) n.stop(); n.disconnect(); });
          chugNodes.forEach(n => { if (n.stop) n.stop(); n.disconnect(); });
          masterGain.disconnect();
          lowPass.disconnect();
        } catch (e) {}
      }, 150);

      if (onCatch) onCatch();
      if (onComplete) onComplete();
    }, catchMs);
  }

  stopCrank() {
    if (this.crankTimer) {
      clearTimeout(this.crankTimer);
      this.crankTimer = null;
    }
    this.isCranking = false;
  }

  // Deep, warm starter motor armature hum (strictly low-frequency sine waves)
  _createDeepStarterRotation(t, duration, dest) {
    const nodes = [];
    try {
      const osc1 = this.ctx.createOscillator();
      const osc2 = this.ctx.createOscillator();
      const gain = this.ctx.createGain();

      osc1.type = 'sine';
      osc2.type = 'sine';

      // Cranking frequency: 78 Hz fundamental + 156 Hz warm octave (flywheel teeth engagement)
      osc1.frequency.setValueAtTime(72, t);
      osc1.frequency.linearRampToValueAtTime(84, t + 0.1);

      osc2.frequency.setValueAtTime(144, t);
      osc2.frequency.linearRampToValueAtTime(168, t + 0.1);

      gain.gain.setValueAtTime(0.001, t);
      gain.gain.linearRampToValueAtTime(0.4, t + 0.04);
      gain.gain.setValueAtTime(0.4, t + duration - 0.03);

      osc1.connect(gain);
      osc2.connect(gain);
      gain.connect(dest);

      osc1.start(t);
      osc2.start(t);
      osc1.stop(t + duration + 0.1);
      osc2.stop(t + duration + 0.1);
      nodes.push(osc1, osc2, gain);
    } catch (e) {}
    return nodes;
  }

  // Deep low-frequency cylinder compression pulses (65 Hz sub-bass thud)
  _createLowCompressionThumps(t, duration, dest) {
    const nodes = [];
    try {
      const thudOsc = this.ctx.createOscillator();
      const thudGain = this.ctx.createGain();
      const lfo = this.ctx.createOscillator();
      const lfoGain = this.ctx.createGain();

      thudOsc.type = 'triangle';
      thudOsc.frequency.setValueAtTime(62, t);

      // 7.5 Hz compression cadence
      lfo.frequency.setValueAtTime(7.5, t);
      lfoGain.gain.setValueAtTime(0.28, t);

      thudGain.gain.setValueAtTime(0.28, t);
      lfo.connect(lfoGain);
      lfoGain.connect(thudGain.gain);

      thudOsc.connect(thudGain);
      thudGain.connect(dest);

      lfo.start(t);
      thudOsc.start(t);
      lfo.stop(t + duration + 0.1);
      thudOsc.stop(t + duration + 0.1);

      nodes.push(thudOsc, thudGain, lfo, lfoGain);
    } catch (e) {}
    return nodes;
  }
}

window.StarterSound = StarterSound;
