/**
 * Multi-Preset Supercar Sound & Physics Engine (Web Audio API)
 * Optimized for Tesla Model 3 / Model Y Multichannel & 3D Spatial Audio Architecture
 */

function base64ToArrayBuffer(base64) {
  const binaryString = window.atob(base64);
  const len = binaryString.length;
  const bytes = new Uint8Array(len);
  for (let i = 0; i < len; i++) {
    bytes[i] = binaryString.charCodeAt(i);
  }
  return bytes.buffer;
}

function safeSetPannerPosition(panner, x, y, z, ctx) {
  if (!panner) return;
  try {
    const t = ctx ? ctx.currentTime : 0;
    if (panner.positionX && panner.positionX.setValueAtTime) {
      panner.positionX.setValueAtTime(x, t);
      panner.positionY.setValueAtTime(y, t);
      panner.positionZ.setValueAtTime(z, t);
    } else if (typeof panner.setPosition === 'function') {
      panner.setPosition(x, y, z);
    }
  } catch (e) {
    // Silent fallback
  }
}

class AudioEngine {
  constructor() {
    this.ctx = null;
    this.isReady = false;
    this.isPlaying = false;

    // Active preset ID
    this.currentPresetId = 'carrera_gt';
    this.currentPreset = null;

    // Decoded audio buffers cache per preset
    this.presetBuffers = {};

    // Active looping nodes & gains
    this.sources = {};
    this.gains = {};

    // Master nodes & Tesla Spatial Audio Network
    this.masterGain = null;
    this.compressor = null;
    this.submixBus = null;
    
    // Cabin Buses
    this.exhaustBus = null;
    this.intakeBus = null;
    this.transBus = null;
    this.subBus = null;

    // Tesla Model 3 / Y Subwoofer Bass Shaker
    this.subwooferFilter = null;
    this.subwooferBooster = null;
    this.subwooferGain = null;
    this.bassShakeLevel = 1.0;

    // Tesla Soundstage Configuration
    this.soundstageMode = 'tesla_mid';
    this.frontRearFader = 0.2;

    // Engine parameters
    this.rpm = 920;
    this.targetRpm = 920;
    this.throttle = 0;
    this.targetThrottle = 0;
    this.brakePressure = 0;
    this.isBrakePressed = false;
    this.isThrottleHold = false;
    this.speed = 0;
    this.gear = 1;
    this.gearMode = 'A';
    this.isRevLimiting = false;
    this.lastLimiterPulse = 0;

    this.lastPopTime = 0;
    this.wasOnThrottle = false;

    // Engine specs defaults
    this.idleRpm = 920;
    this.redlineRpm = 8400;
    this.maxRpm = 10000;
    this.gearMaxSpeeds = [0, 80, 135, 185, 235, 285, 335];
    this.gearMinSpeeds = [0, 0, 50, 95, 140, 190, 240];
    this.BASE_RPMS = {
      vlow: 1050, low: 2350, mid: 4400, high: 6300, ex_high: 8200,
      off_low: 1100, off_mid: 3500, off_high: 6500
    };

    this.popsAggressiveness = 1.0;
    this.volume = 1.0;

    // Dual sound engine mode: 'dsp' (Procedural TeslaSound Engine) vs 'samples' (Assetto Corsa)
    this.soundMode = 'dsp';
    this.dspEngine = null;
    this.turboEngine = null;

    // Immediately prepare context so preset buffers decode even before first touch
    this.ensureContext();
  }

  ensureContext() {
    if ('audioSession' in navigator) {
      try {
        navigator.audioSession.type = 'playback';
      } catch (e) {}
    }
    if (!this.ctx) {
      const AudioContextClass = window.AudioContext || window.webkitAudioContext;
      if (AudioContextClass) {
        this.ctx = new AudioContextClass({ latencyHint: 'interactive' });
      }
      if (this.ctx) {
        this.ctx.addEventListener('statechange', async () => {
          if (this.isPlaying && (this.ctx.state === 'suspended' || this.ctx.state === 'interrupted')) {
            try {
              await this.ctx.resume();
            } catch (e) {}
          }
        });
      }
    }
    return this.ctx;
  }

  async init() {
    this.ensureContext();
    if (this.ctx && this.isReady) return true;

    if (this.ctx && (this.ctx.state === 'suspended' || this.ctx.state === 'interrupted')) {
      try {
        await Promise.race([
          this.ctx.resume(),
          new Promise(r => setTimeout(r, 60))
        ]).catch(() => {});
      } catch (e) {}
    }

    // High quality master dynamics compressor
    this.compressor = this.ctx.createDynamicsCompressor();
    this.compressor.threshold.setValueAtTime(-14, this.ctx.currentTime);
    this.compressor.knee.setValueAtTime(6, this.ctx.currentTime);
    this.compressor.ratio.setValueAtTime(3.5, this.ctx.currentTime);
    this.compressor.attack.setValueAtTime(0.003, this.ctx.currentTime);
    this.compressor.release.setValueAtTime(0.12, this.ctx.currentTime);

    // Master Gain (Post-compressor for authentic linear volume scaling and silent mute)
    this.masterGain = this.ctx.createGain();
    this.masterGain.gain.setValueAtTime(this.volume, this.ctx.currentTime);

    // Build Tesla Model 3 / Y Spatial Audio Buses
    this.buildTeslaSpatialAcoustics();

    // Signal chain: Submix -> Compressor -> Master Gain -> Destination
    this.compressor.connect(this.masterGain);
    this.masterGain.connect(this.ctx.destination);

    // Initialize Procedural DSP engine sharing this.ctx and feeding into submixBus
    if (window.DSPAudioEngine && !this.dspEngine) {
      this.dspEngine = new window.DSPAudioEngine(this.ctx, () => this.submixBus || this.masterGain || this.ctx.destination);
    }

    // Initialize Universal Turbo Sound Synthesizer feeding into intakeBus or submixBus
    if (window.TurboSoundEngine && !this.turboEngine) {
      this.turboEngine = new window.TurboSoundEngine(this.ctx, () => this.intakeBus || this.submixBus || this.masterGain || this.ctx.destination);
      this.turboEngine.init();
    }

    // Load initial preset
    if (this.soundMode === 'samples') {
      await this.loadPresetBuffers(this.currentPresetId);
    }

    this.isReady = true;
    console.log('Tesla AudioEngine ready. Current preset:', this.currentPresetId, 'Mode:', this.soundMode);
    return true;
  }

  buildTeslaSpatialAcoustics() {
    try {
      // Intermediate submix bus feeding into master compressor
      this.submixBus = this.ctx.createGain();
      this.submixBus.gain.setValueAtTime(1.0, this.ctx.currentTime);
      if (this.compressor) this.submixBus.connect(this.compressor);

      // Create dedicated cabin routing buses
      this.exhaustBus = this.ctx.createGain();
      this.exhaustBus.gain.setValueAtTime(1.0, this.ctx.currentTime);
      this.exhaustBus.connect(this.submixBus);

      this.intakeBus = this.ctx.createGain();
      this.intakeBus.gain.setValueAtTime(0.9, this.ctx.currentTime);
      this.intakeBus.connect(this.submixBus);

      this.transBus = this.ctx.createGain();
      this.transBus.gain.setValueAtTime(0.8, this.ctx.currentTime);
      this.transBus.connect(this.submixBus);

      // Tesla Model 3 / Y Subwoofer Bass Shaker
      this.subwooferFilter = this.ctx.createBiquadFilter();
      this.subwooferFilter.type = 'lowpass';
      this.subwooferFilter.frequency.setValueAtTime(80, this.ctx.currentTime);
      this.subwooferFilter.Q.setValueAtTime(1.8, this.ctx.currentTime);

      this.subwooferBooster = this.ctx.createBiquadFilter();
      this.subwooferBooster.type = 'peaking';
      this.subwooferBooster.frequency.setValueAtTime(45, this.ctx.currentTime);
      this.subwooferBooster.gain.setValueAtTime(6.0, this.ctx.currentTime);
      this.subwooferBooster.Q.setValueAtTime(1.2, this.ctx.currentTime);

      this.subwooferGain = this.ctx.createGain();
      this.subwooferGain.gain.setValueAtTime(this.bassShakeLevel, this.ctx.currentTime);

      this.subBus = this.ctx.createGain();
      this.subBus.connect(this.subwooferFilter);
      this.subwooferFilter.connect(this.subwooferBooster);
      this.subwooferBooster.connect(this.subwooferGain);
      this.subwooferGain.connect(this.submixBus);
    } catch (err) {
      console.warn('buildTeslaSpatialAcoustics warning:', err);
    }

    // Optional 3D panners with safe fallback
    try {
      this.exhaustPanner = this.ctx.createPanner();
      this.exhaustPanner.panningModel = 'equalpower';
      this.exhaustPanner.distanceModel = 'linear';
      this.exhaustPanner.maxDistance = 10000;
      this.exhaustPanner.rolloffFactor = 0;
      safeSetPannerPosition(this.exhaustPanner, 0, -0.2, 1.0, this.ctx);

      this.intakePanner = this.ctx.createPanner();
      this.intakePanner.panningModel = 'equalpower';
      this.intakePanner.distanceModel = 'linear';
      this.intakePanner.maxDistance = 10000;
      this.intakePanner.rolloffFactor = 0;
      safeSetPannerPosition(this.intakePanner, 0, 0.3, -1.0, this.ctx);
    } catch (e) {
      console.warn('PannerNode init warning:', e);
    }
  }

  setTeslaSoundstage(mode, fader = 0.2, bass = 1.0) {
    this.soundstageMode = mode;
    this.frontRearFader = fader;
    this.bassShakeLevel = bass;

    if (this.subwooferGain && this.ctx) {
      this.subwooferGain.gain.setTargetAtTime(this.bassShakeLevel * 1.2, this.ctx.currentTime, 0.05);
    }

    if (this.exhaustBus && this.intakeBus && this.ctx) {
      const now = this.ctx.currentTime;
      if (mode === 'tesla_mid') {
        this.exhaustBus.gain.setTargetAtTime(1.1, now, 0.05);
        this.intakeBus.gain.setTargetAtTime(0.8, now, 0.05);
      } else if (mode === 'tesla_front') {
        this.exhaustBus.gain.setTargetAtTime(0.9, now, 0.05);
        this.intakeBus.gain.setTargetAtTime(1.1, now, 0.05);
      } else {
        this.exhaustBus.gain.setTargetAtTime(1.0, now, 0.05);
        this.intakeBus.gain.setTargetAtTime(1.0, now, 0.05);
      }
    }
  }

  setSubwooferBoost(level) {
    this.bassShakeLevel = Math.max(0, Math.min(3.0, level));
    if (this.subwooferGain && this.ctx) {
      this.subwooferGain.gain.setTargetAtTime(this.bassShakeLevel * 1.2, this.ctx.currentTime, 0.05);
    }
    if (this.subwooferBooster && this.ctx) {
      const boostDb = (this.bassShakeLevel - 1.0) * 8.0;
      this.subwooferBooster.gain.setTargetAtTime(boostDb, this.ctx.currentTime, 0.05);
    }
  }

  async loadPresetBuffers(presetId) {
    if (this.presetBuffers[presetId] && Object.keys(this.presetBuffers[presetId]).length > 0) {
      this.applyPresetConfig(presetId);
      return true;
    }

    this.ensureContext();

    const presetData = window.CAR_PRESETS ? window.CAR_PRESETS[presetId] : null;
    if (!presetData) {
      console.error('Preset not found in window.CAR_PRESETS:', presetId);
      return false;
    }

    console.log(`[AudioEngine] Loading & decoding sound buffers for: ${presetId}`);
    const buffers = {};
    const decodePromises = Object.entries(presetData.sounds).map(async ([key, b64]) => {
      try {
        const arrayBuf = base64ToArrayBuffer(b64);
        const decoded = await this.ctx.decodeAudioData(arrayBuf);
        if (decoded) {
          buffers[key] = decoded;
        }
      } catch (err) {
        console.error(`Failed to decode ${key} for ${presetId}:`, err);
      }
    });

    await Promise.all(decodePromises);
    const count = Object.keys(buffers).length;
    console.log(`[AudioEngine] Decoded ${count} audio buffers for: ${presetId}`);

    if (count > 0) {
      this.presetBuffers[presetId] = buffers;
    }
    this.applyPresetConfig(presetId);
    return count > 0;
  }

  applyPresetConfig(presetId) {
    const p = window.CAR_PRESETS ? window.CAR_PRESETS[presetId] : null;
    if (!p) return;

    this.currentPresetId = presetId;
    this.currentPreset = p;
    this.idleRpm = p.idleRpm || 920;
    this.redlineRpm = p.redlineRpm || 8400;
    this.maxRpm = p.maxRpm || 10000;
    this.gearMaxSpeeds = p.gearMaxSpeeds || [0, 80, 135, 185, 235, 285, 335];
    this.BASE_RPMS = p.baseRpms || this.BASE_RPMS;

    if (this.rpm < this.idleRpm) {
      this.rpm = this.idleRpm;
      this.targetRpm = this.idleRpm;
    }

    // Auto-set soundstage profile based on vehicle layout
    if (presetId === 'carrera_gt') {
      this.setTeslaSoundstage('tesla_mid', 0.35, 1.1);
    } else if (presetId === 'supra_2jz' || presetId === 'amg_m177') {
      this.setTeslaSoundstage('tesla_front', 0.15, 1.25);
    } else if (presetId === 'bmw_z4_gt3') {
      this.setTeslaSoundstage('tesla_front', 0.20, 1.3);
    } else {
      this.setTeslaSoundstage('tesla_3d', 0.25, 1.4);
    }
  }

  async setPreset(presetId) {
    console.log('Switching preset to:', presetId);
    this.ensureContext();
    if (!this.isReady) {
      await this.init();
    }

    const wasPlaying = this.isPlaying;
    if (wasPlaying) {
      this.stop();
    }

    if (presetId.startsWith('dsp:') || (window.MOTORSOUND_CARS && window.MOTORSOUND_CARS.some(c => c.id === presetId))) {
      this.soundMode = 'dsp';
      const carId = presetId.replace(/^dsp:/, '');
      if (!this.dspEngine && this.ctx) {
        this.dspEngine = new window.DSPAudioEngine(this.ctx, () => this.submixBus || this.masterGain || this.ctx.destination);
      }
      if (this.dspEngine) {
        this.dspEngine.setCar(carId);
        this.currentPresetId = presetId;
        this.idleRpm = this.dspEngine.idleRpm;
        this.redlineRpm = this.dspEngine.redlineRpm;
        this.maxRpm = this.dspEngine.maxRpm;
      }
    } else {
      this.soundMode = 'samples';
      const sampleId = presetId.replace(/^sample:/, '');
      await this.loadPresetBuffers(sampleId);
    }

    if (wasPlaying) {
      await this.start();
    }
  }

  async start() {
    this.ensureContext();
    if (!this.isReady) await this.init();
    if (this.ctx && (this.ctx.state === 'suspended' || this.ctx.state === 'interrupted')) {
      try {
        await Promise.race([
          this.ctx.resume(),
          new Promise(r => setTimeout(r, 60))
        ]).catch(() => {});
      } catch (e) {}
    }

    if (this.isPlaying) return;

    if (this.soundMode === 'dsp') {
      if (!this.dspEngine && this.ctx) {
        this.dspEngine = new window.DSPAudioEngine(this.ctx, () => this.submixBus || this.masterGain || this.ctx.destination);
      }
      if (this.dspEngine) {
        await this.dspEngine.start();
        this.isPlaying = true;
        this.rpm = this.dspEngine.rpm;
        this.redlineRpm = this.dspEngine.redlineRpm;
        this.maxRpm = this.dspEngine.maxRpm;
        console.log(`Tesla DSP Engine running: ${this.dspEngine.car ? this.dspEngine.car.name : 'DSP'}`);
      }
      return;
    }

    // Ensure buffers are loaded for current preset
    if (!this.presetBuffers[this.currentPresetId] || Object.keys(this.presetBuffers[this.currentPresetId]).length === 0) {
      await this.loadPresetBuffers(this.currentPresetId);
    }

    const buffers = this.presetBuffers[this.currentPresetId] || {};
    const loopKeys = ['vlow', 'low', 'mid', 'high', 'ex_high', 'off_low', 'off_mid', 'off_high', 'transmission', 'blower'];

    let startedLoops = 0;
    loopKeys.forEach(key => {
      if (!buffers[key]) return;
      const src = this.ctx.createBufferSource();
      src.buffer = buffers[key];
      src.loop = true;
      src.loopStart = 0;
      src.loopEnd = buffers[key].duration;

      const gain = this.ctx.createGain();
      gain.gain.setValueAtTime(0.001, this.ctx.currentTime);

      src.connect(gain);

      // Route loops across Tesla Cabin Buses
      if (key === 'transmission') {
        gain.connect(this.transBus);
      } else if (key === 'vlow' || key === 'low') {
        gain.connect(this.exhaustBus);
        gain.connect(this.subBus);
      } else if (key === 'blower') {
        gain.connect(this.intakeBus);
      } else {
        gain.connect(this.exhaustBus);
        gain.connect(this.subBus);
      }

      src.start(0);

      this.sources[key] = src;
      this.gains[key] = gain;
      startedLoops++;
    });

    this.isPlaying = true;
    this.rpm = this.idleRpm;
    this.targetRpm = this.idleRpm;
    this.updateAudioParameters();
    console.log(`Tesla Engine running: ${this.currentPresetId} (${startedLoops} active loops)`);
  }

  stop() {
    if (this.turboEngine) {
      this.turboEngine.stop();
    }
    if (!this.isPlaying) return;
    if (this.soundMode === 'dsp') {
      if (this.dspEngine) {
        this.dspEngine.stop();
      }
      this.isPlaying = false;
      return;
    }
    Object.values(this.sources).forEach(src => {
      try { src.stop(); } catch (e) {}
    });
    this.sources = {};
    this.gains = {};
    this.isPlaying = false;
  }

  setTurboWhine(enabled) {
    if (this.turboEngine) this.turboEngine.setEnabled(enabled);
  }

  setTurboVolume(vol) {
    if (this.turboEngine) this.turboEngine.setVolume(vol);
  }

  setTurboBlowOff(enabled) {
    if (this.turboEngine) this.turboEngine.setBovEnabled(enabled);
  }

  setVolume(val) {
    this.volume = Math.max(0, Math.min(1, val));
    if (this.masterGain && this.ctx) {
      try {
        this.masterGain.gain.setValueAtTime(this.volume, this.ctx.currentTime);
      } catch (e) {
        this.masterGain.gain.value = this.volume;
      }
    }
  }

  playOneShot(name, volume = 0.8, pitchVar = 0.05, position = 'rear') {
    if (!this.ctx || !this.isPlaying) return;
    const buffers = this.presetBuffers[this.currentPresetId] || {};
    if (!buffers[name]) return;

    const src = this.ctx.createBufferSource();
    src.buffer = buffers[name];

    const rate = 1.0 + (Math.random() * 2 - 1) * pitchVar;
    src.playbackRate.setValueAtTime(rate, this.ctx.currentTime);

    const gain = this.ctx.createGain();
    gain.gain.setValueAtTime(volume, this.ctx.currentTime);

    src.connect(gain);

    if (name === 'bov') {
      gain.connect(this.intakeBus);
    } else if (name.startsWith('pop')) {
      gain.connect(this.exhaustBus);
      gain.connect(this.subBus);
    } else {
      gain.connect(this.exhaustBus);
    }

    src.start(0);
  }

  triggerRandomPop(volume = 0.85) {
    const pops = ['pop1', 'pop2', 'pop3', 'pop4'];
    const buffers = this.presetBuffers[this.currentPresetId] || {};
    const available = pops.filter(p => !!buffers[p]);
    if (available.length === 0) return;

    const chosen = available[Math.floor(Math.random() * available.length)];
    this.playOneShot(chosen, volume * this.popsAggressiveness, 0.08, 'rear');
  }

  shiftUp() {
    if (this.soundMode === 'dsp' && this.dspEngine) {
      this.dspEngine.shiftUp();
      return;
    }
    if (this.gear < 6) {
      this.gear++;
      this.playOneShot('gearup', 0.9, 0.04, 'rear');
      this.triggerRandomPop(1.0);
      this.rpm = Math.max(this.idleRpm * 1.5, this.rpm * 0.68);
    }
  }

  shiftDown() {
    if (this.soundMode === 'dsp' && this.dspEngine) {
      this.dspEngine.shiftDown();
      return;
    }
    if (this.gear > 1) {
      this.gear--;
      this.playOneShot('geardn', 0.85, 0.04, 'center');
      this.rpm = Math.min(this.redlineRpm * 0.95, this.rpm * 1.35);
      this.triggerRandomPop(0.75);
    }
  }

  setGear(g) {
    const target = parseInt(g, 10);
    if (this.soundMode === 'dsp' && this.dspEngine) {
      this.dspEngine.setGear(target);
      this.gear = target;
      return;
    }
    this.gear = Math.max(1, Math.min(6, target));
    this.triggerRandomPop(0.8);
  }

  calcGain(rpm, min, peak1, peak2, max) {
    if (rpm <= min || rpm >= max) return 0.0001;
    if (rpm >= peak1 && rpm <= peak2) return 1.0;
    if (rpm < peak1) return (rpm - min) / (peak1 - min);
    return (max - rpm) / (max - peak2);
  }

  updatePhysics(dt, controlMode = 'pedal') {
    if (this.soundMode === 'dsp' && this.dspEngine) {
      const isBrake = (this.brakePressure > 0.02) || this.isBrakePressed || false;
      this.dspEngine.updatePhysics(dt, controlMode, {
        throttle: this.targetThrottle,
        gearMode: this.gearMode,
        isBrake: isBrake,
        brake: this.brakePressure,
        hold: this.isThrottleHold,
        speed: this.speed,
        accel: this.accel || 0
      });
      this.rpm = this.dspEngine.rpm;
      this.speed = this.dspEngine.speed;
      this.gear = this.dspEngine.gear;
      this.redlineRpm = this.dspEngine.redlineRpm;
      this.maxRpm = this.dspEngine.maxRpm;
      this.throttle = this.dspEngine.throttle;
      this.isRevLimiting = this.dspEngine.isRevLimiting;

      // Update universal turbocharger for DSP mode
      if (this.turboEngine) {
        this.turboEngine.update(dt, this.rpm, this.redlineRpm, this.throttle, this.isPlaying, this.targetThrottle);
      }
      return;
    }

    const now = this.ctx ? this.ctx.currentTime : performance.now() / 1000;

    const throttleSpeed = this.targetThrottle > this.throttle ? 14.0 : 9.0;
    this.throttle += (this.targetThrottle - this.throttle) * Math.min(1.0, dt * throttleSpeed);

    if (controlMode === 'pedal') {
      const brakeForce = this.brakePressure > 0.02 ? this.brakePressure : (this.isBrakePressed ? 1.0 : 0.0);
      if (this.gearMode === 'N') {
        if (this.throttle > 0.02) {
          this.targetRpm = this.idleRpm + this.throttle * (this.redlineRpm * 1.02 - this.idleRpm);
          this.rpm += (this.targetRpm - this.rpm) * Math.min(1.0, dt * 16.0);
        } else {
          this.targetRpm = this.idleRpm;
          this.rpm += (this.targetRpm - this.rpm) * Math.min(1.0, dt * 7.0);
        }
        this.speed = Math.max(0, this.speed - dt * (20.0 + brakeForce * 60.0));
      } else {
        const maxGearSpeed = this.gearMaxSpeeds[this.gear] || 80;
        const minGearSpeed = (this.gearMaxSpeeds[this.gear - 1] || 0) * 0.6;

        if (this.throttle > 0.05 && brakeForce < 0.2) {
          const torqueFactor = Math.sin((this.rpm / this.redlineRpm) * Math.PI) * 0.5 + 0.6;
          const accel = (60.0 / this.gear) * this.throttle * torqueFactor;
          this.speed += accel * dt;
        } else {
          const drag = 8.0 + (this.speed / 100.0) * 12.0 + brakeForce * 75.0;
          this.speed = Math.max(0, this.speed - drag * dt);
        }

        if (this.gearMode === 'A') {
          if (this.rpm >= this.redlineRpm * 0.99 && this.gear < 6) {
            this.shiftUp();
          } else if (this.speed < minGearSpeed && this.gear > 1 && this.throttle < 0.3) {
            this.shiftDown();
          }
        }

        const calculatedRpm = (this.speed / maxGearSpeed) * this.redlineRpm;
        this.rpm = Math.max(this.idleRpm, calculatedRpm);
      }
    }

    // Rev limiter cut
    if (this.rpm >= this.redlineRpm) {
      this.isRevLimiting = true;
      if (now - this.lastLimiterPulse > 0.065) {
        this.lastLimiterPulse = now;
        this.rpm = this.redlineRpm * 0.975 + Math.random() * 80;
        this.triggerRandomPop(0.9);
      }
    } else {
      this.isRevLimiting = false;
    }

    // BOV & Overrun crackles
    if (this.wasOnThrottle && this.throttle < 0.05 && this.rpm > this.idleRpm * 2.5) {
      if (now - this.lastPopTime > 0.22) {
        this.lastPopTime = now;
        this.playOneShot('bov', 0.95);
        this.triggerRandomPop(0.8);
      }
    }
    this.wasOnThrottle = this.throttle > 0.25;

    // Update universal turbocharger for Samples mode
    if (this.turboEngine) {
      this.turboEngine.update(dt, this.rpm, this.redlineRpm, this.throttle, this.isPlaying, this.targetThrottle);
    }

    this.updateAudioParameters();
  }

  updateAudioParameters() {
    if (!this.isPlaying || !this.ctx) return;
    const now = this.ctx.currentTime;
    const smoothTime = 0.035;

    const rpm = Math.max(400, Math.min(this.maxRpm, this.rpm));
    const thr = Math.max(0, Math.min(1, this.throttle));

    // Pitch modulation
    for (const [key, baseRpm] of Object.entries(this.BASE_RPMS)) {
      if (this.sources[key]) {
        const rate = Math.max(0.3, Math.min(2.8, rpm / baseRpm));
        this.sources[key].playbackRate.setTargetAtTime(rate, now, smoothTime);
      }
    }

    const rL = this.redlineRpm;
    const hasExHigh = !!this.sources['ex_high'];

    const g_vlow = this.calcGain(rpm, 0, this.idleRpm * 0.8, this.idleRpm * 1.4, rL * 0.35);
    const g_low = this.calcGain(rpm, this.idleRpm * 1.1, rL * 0.22, rL * 0.38, rL * 0.58);
    const g_mid = this.calcGain(rpm, rL * 0.30, rL * 0.45, rL * 0.62, rL * 0.82);
    const g_high = hasExHigh
      ? this.calcGain(rpm, rL * 0.55, rL * 0.72, rL * 0.85, rL * 1.0)
      : this.calcGain(rpm, rL * 0.52, rL * 0.72, rL * 1.10, rL * 1.40);
    const g_ex_high = hasExHigh ? this.calcGain(rpm, rL * 0.75, rL * 0.92, rL * 1.02, rL * 1.25) : 0.0001;

    const g_off_low = this.calcGain(rpm, 0, this.idleRpm * 0.8, this.idleRpm * 1.6, rL * 0.40);
    const g_off_mid = this.calcGain(rpm, rL * 0.2, rL * 0.4, rL * 0.58, rL * 0.80);
    const g_off_high = this.calcGain(rpm, rL * 0.52, rL * 0.78, rL * 1.10, rL * 1.40);

    const limiterCut = this.isRevLimiting ? 0.2 : 1.0;

    const idleFactor = Math.max(0, 1.0 - (rpm - this.idleRpm) / 1000.0);
    const onWeight = Math.min(1.0, (Math.pow(thr, 0.75) + idleFactor * 0.7)) * limiterCut;
    const offWeight = Math.max(0.25, (1.0 - thr)) * 0.85;

    const applyGain = (key, val) => {
      if (this.gains[key]) {
        this.gains[key].gain.setTargetAtTime(Math.max(0.0001, val), now, smoothTime);
      }
    };

    applyGain('vlow', g_vlow * onWeight);
    applyGain('low', g_low * onWeight);
    applyGain('mid', g_mid * onWeight);
    applyGain('high', g_high * onWeight);
    applyGain('ex_high', g_ex_high * onWeight);

    applyGain('off_low', g_off_low * offWeight);
    applyGain('off_mid', g_off_mid * offWeight);
    applyGain('off_high', g_off_high * offWeight);

    // Whine & Supercharger Blower
    if (this.gains['transmission'] && this.sources['transmission']) {
      const transRate = Math.max(0.3, Math.min(2.5, (this.speed / 120.0) * 1.6));
      this.sources['transmission'].playbackRate.setTargetAtTime(transRate, now, smoothTime);
      const transVol = Math.min(0.22, (this.speed / 180.0) * 0.2);
      applyGain('transmission', transVol);
    }

    if (this.gains['blower'] && this.sources['blower']) {
      const blowerRate = Math.max(0.4, Math.min(2.5, (rpm / 4000.0) * 1.2));
      this.sources['blower'].playbackRate.setTargetAtTime(blowerRate, now, smoothTime);
      applyGain('blower', Math.min(0.35, (thr * 0.25 + 0.08)));
    }
  }

  applyTelemetry({ speed, acceleration, throttle, gForce }) {
    if (typeof speed === 'number' && !isNaN(speed)) {
      this.speed = Math.max(0, speed);
    }
    if (typeof acceleration === 'number') {
      this.accel = acceleration;
    }
    if (typeof throttle === 'number') {
      this.targetThrottle = throttle;
    }

    if (this.soundMode === 'dsp') {
      return;
    }
    for (let g = 1; g <= 6; g++) {
      if (this.speed <= this.gearMaxSpeeds[g]) {
        targetGear = g;
        break;
      }
      targetGear = 6;
    }

    if (targetGear !== this.gear && this.speed > 5) {
      if (targetGear > this.gear) {
        this.playOneShot('gearup', 0.85, 0.04, 'rear');
        this.triggerRandomPop(0.9);
      } else {
        this.playOneShot('geardn', 0.8, 0.04, 'center');
        this.triggerRandomPop(0.7);
      }
      this.gear = targetGear;
    }

    if (this.speed < 2) {
      this.targetRpm = this.idleRpm;
    } else {
      const ratio = this.speed / this.gearMaxSpeeds[this.gear];
      this.targetRpm = Math.max(this.idleRpm * 1.2, Math.min(this.redlineRpm * 1.02, ratio * this.redlineRpm));
    }

    if (typeof acceleration === 'number') {
      if (acceleration > 0.4) {
        this.targetThrottle = Math.min(1.0, (acceleration - 0.3) / 2.5);
      } else if (acceleration < -0.3) {
        this.targetThrottle = 0.0;
      } else {
        this.targetThrottle = Math.min(0.25, this.speed / 200.0);
      }
    } else if (typeof throttle === 'number') {
      this.targetThrottle = throttle;
    }
  }
}

window.AudioEngine = AudioEngine;
