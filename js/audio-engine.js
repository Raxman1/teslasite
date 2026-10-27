/**
 * Multi-Preset Supercar Sound & Physics Engine (Web Audio API)
 * Seamlessly switches between Carrera GT, Supra 2JZ, AMG GT-R, BMW Z4 GT3, Dragster
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

class AudioEngine {
  constructor() {
    this.ctx = null;
    this.isReady = false;
    this.isPlaying = false;

    // Active preset ID
    this.currentPresetId = 'carrera_gt';
    this.currentPreset = null;

    // Decoded audio buffers cache per preset: { presetId: { soundKey: AudioBuffer } }
    this.presetBuffers = {};

    // Active looping nodes & gains
    this.sources = {};
    this.gains = {};

    // Master nodes
    this.masterGain = null;
    this.compressor = null;

    // Engine parameters
    this.rpm = 920;
    this.targetRpm = 920;
    this.throttle = 0;
    this.targetThrottle = 0;
    this.speed = 0;
    this.gear = 1;
    this.gearMode = 'A';
    this.isRevLimiting = false;
    this.lastLimiterPulse = 0;

    this.lastPopTime = 0;
    this.wasOnThrottle = false;

    // Defaults (overwritten by preset)
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
  }

  async init() {
    if (this.ctx && this.isReady) return true;

    const AudioContextClass = window.AudioContext || window.webkitAudioContext;
    if (!this.ctx) {
      this.ctx = new AudioContextClass({ latencyHint: 'interactive' });
    }

    if (this.ctx.state === 'suspended') {
      await this.ctx.resume();
    }

    this.compressor = this.ctx.createDynamicsCompressor();
    this.compressor.threshold.setValueAtTime(-14, this.ctx.currentTime);
    this.compressor.knee.setValueAtTime(6, this.ctx.currentTime);
    this.compressor.ratio.setValueAtTime(3.5, this.ctx.currentTime);
    this.compressor.attack.setValueAtTime(0.003, this.ctx.currentTime);
    this.compressor.release.setValueAtTime(0.12, this.ctx.currentTime);

    this.masterGain = this.ctx.createGain();
    this.masterGain.gain.setValueAtTime(this.volume, this.ctx.currentTime);

    this.masterGain.connect(this.compressor);
    this.compressor.connect(this.ctx.destination);

    // Load initial preset
    await this.loadPresetBuffers(this.currentPresetId);

    this.isReady = true;
    console.log('AudioEngine initialized with preset:', this.currentPresetId);
    return true;
  }

  async loadPresetBuffers(presetId) {
    if (this.presetBuffers[presetId]) {
      this.applyPresetConfig(presetId);
      return true;
    }

    const presetData = window.CAR_PRESETS ? window.CAR_PRESETS[presetId] : null;
    if (!presetData) {
      console.error('Preset not found in window.CAR_PRESETS:', presetId);
      return false;
    }

    const buffers = {};
    const decodePromises = Object.entries(presetData.sounds).map(async ([key, b64]) => {
      try {
        const arrayBuf = base64ToArrayBuffer(b64);
        buffers[key] = await this.ctx.decodeAudioData(arrayBuf);
      } catch (err) {
        console.error(`Failed to decode ${key} for ${presetId}:`, err);
      }
    });

    await Promise.all(decodePromises);
    this.presetBuffers[presetId] = buffers;
    this.applyPresetConfig(presetId);
    return true;
  }

  applyPresetConfig(presetId) {
    const p = window.CAR_PRESETS[presetId];
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
  }

  async setPreset(presetId) {
    console.log('Switching preset to:', presetId);
    const wasPlaying = this.isPlaying;
    if (wasPlaying) {
      this.stop();
    }

    await this.loadPresetBuffers(presetId);

    if (wasPlaying) {
      await this.start();
    }
  }

  async start() {
    if (!this.isReady) await this.init();
    if (this.ctx && this.ctx.state === 'suspended') {
      await this.ctx.resume();
    }

    if (this.isPlaying) return;

    const buffers = this.presetBuffers[this.currentPresetId] || {};
    const loopKeys = ['vlow', 'low', 'mid', 'high', 'ex_high', 'off_low', 'off_mid', 'off_high', 'transmission', 'blower'];

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
      gain.connect(this.masterGain);
      src.start(0);

      this.sources[key] = src;
      this.gains[key] = gain;
    });

    this.isPlaying = true;
    this.rpm = this.idleRpm;
    this.targetRpm = this.idleRpm;
    this.updateAudioParameters();
    console.log(`AudioEngine running: ${this.currentPresetId}, state: ${this.ctx.state}`);
  }

  stop() {
    if (!this.isPlaying) return;
    Object.values(this.sources).forEach(src => {
      try { src.stop(); } catch (e) {}
    });
    this.sources = {};
    this.gains = {};
    this.isPlaying = false;
  }

  setVolume(val) {
    this.volume = Math.max(0, Math.min(1, val));
    if (this.masterGain && this.ctx) {
      this.masterGain.gain.setTargetAtTime(this.volume, this.ctx.currentTime, 0.05);
    }
  }

  playOneShot(name, volume = 0.8, pitchVar = 0.05) {
    if (!this.ctx || !this.isPlaying) return;
    const buffers = this.presetBuffers[this.currentPresetId] || {};
    if (!buffers[name]) return;

    const src = this.ctx.createBufferSource();
    src.buffer = buffers[name];

    const rate = 1.0 + (Math.random() * 2 - 1) * pitchVar;
    src.playbackRate.setValueAtTime(rate, this.ctx.currentTime);

    const gain = this.ctx.createGain();
    gain.gain.setValueAtTime(volume * this.volume, this.ctx.currentTime);

    src.connect(gain);
    gain.connect(this.masterGain);
    src.start(0);
  }

  triggerRandomPop(volume = 0.75) {
    const pops = ['pop1', 'pop2', 'pop3', 'pop4'];
    const buffers = this.presetBuffers[this.currentPresetId] || {};
    const available = pops.filter(p => !!buffers[p]);
    if (available.length === 0) return;

    const chosen = available[Math.floor(Math.random() * available.length)];
    this.playOneShot(chosen, volume * this.popsAggressiveness, 0.08);
  }

  shiftUp() {
    if (this.gear < 6) {
      this.gear++;
      this.playOneShot('gearup', 0.9);
      this.triggerRandomPop(0.95);
      this.rpm = Math.max(this.idleRpm * 1.5, this.rpm * 0.68);
    }
  }

  shiftDown() {
    if (this.gear > 1) {
      this.gear--;
      this.playOneShot('geardn', 0.85);
      this.rpm = Math.min(this.redlineRpm * 0.95, this.rpm * 1.35);
      this.triggerRandomPop(0.7);
    }
  }

  calcGain(rpm, min, peak1, peak2, max) {
    if (rpm <= min || rpm >= max) return 0.0001;
    if (rpm >= peak1 && rpm <= peak2) return 1.0;
    if (rpm < peak1) return (rpm - min) / (peak1 - min);
    return (max - rpm) / (max - peak2);
  }

  updatePhysics(dt, controlMode = 'pedal') {
    const now = this.ctx ? this.ctx.currentTime : performance.now() / 1000;

    const throttleSpeed = this.targetThrottle > this.throttle ? 14.0 : 9.0;
    this.throttle += (this.targetThrottle - this.throttle) * Math.min(1.0, dt * throttleSpeed);

    if (controlMode === 'pedal') {
      if (this.gearMode === 'N') {
        if (this.throttle > 0.02) {
          this.targetRpm = this.idleRpm + this.throttle * (this.redlineRpm * 1.02 - this.idleRpm);
          this.rpm += (this.targetRpm - this.rpm) * Math.min(1.0, dt * 16.0);
        } else {
          this.targetRpm = this.idleRpm;
          this.rpm += (this.targetRpm - this.rpm) * Math.min(1.0, dt * 7.0);
        }
        this.speed = Math.max(0, this.speed - dt * 20.0);
      } else {
        const maxGearSpeed = this.gearMaxSpeeds[this.gear] || 80;
        const minGearSpeed = (this.gearMaxSpeeds[this.gear - 1] || 0) * 0.6;

        if (this.throttle > 0.05) {
          const torqueFactor = Math.sin((this.rpm / this.redlineRpm) * Math.PI) * 0.5 + 0.6;
          const accel = (60.0 / this.gear) * this.throttle * torqueFactor;
          this.speed += accel * dt;
        } else {
          const drag = 8.0 + (this.speed / 100.0) * 12.0;
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
        this.triggerRandomPop(0.85);
      }
    } else {
      this.isRevLimiting = false;
    }

    // Turbo blow-off valve (BOV) & overrun pops on lift-off
    if (this.wasOnThrottle && this.throttle < 0.05 && this.rpm > this.idleRpm * 2.5) {
      if (now - this.lastPopTime > 0.22) {
        this.lastPopTime = now;
        // Play BOV flutter if available
        this.playOneShot('bov', 0.9);
        this.triggerRandomPop(0.75);
      }
    }
    this.wasOnThrottle = this.throttle > 0.25;

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

    // Dynamic band ranges based on car redline
    const rL = this.redlineRpm;
    const g_vlow = this.calcGain(rpm, 0, this.idleRpm * 0.8, this.idleRpm * 1.3, rL * 0.3);
    const g_low = this.calcGain(rpm, this.idleRpm * 1.1, rL * 0.25, rL * 0.35, rL * 0.55);
    const g_mid = this.calcGain(rpm, rL * 0.3, rL * 0.45, rL * 0.6, rL * 0.78);
    const g_high = this.calcGain(rpm, rL * 0.55, rL * 0.72, rL * 0.85, rL * 1.0);
    const g_ex_high = this.calcGain(rpm, rL * 0.75, rL * 0.92, rL * 1.02, rL * 1.25);

    const g_off_low = this.calcGain(rpm, 0, this.idleRpm * 0.8, this.idleRpm * 1.6, rL * 0.35);
    const g_off_mid = this.calcGain(rpm, rL * 0.2, rL * 0.4, rL * 0.55, rL * 0.75);
    const g_off_high = this.calcGain(rpm, rL * 0.55, rL * 0.78, rL * 1.05, rL * 1.25);

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

    let targetGear = 1;
    for (let g = 1; g <= 6; g++) {
      if (this.speed <= this.gearMaxSpeeds[g]) {
        targetGear = g;
        break;
      }
      targetGear = 6;
    }

    if (targetGear !== this.gear && this.speed > 5) {
      if (targetGear > this.gear) {
        this.playOneShot('gearup', 0.85);
        this.triggerRandomPop(0.9);
      } else {
        this.playOneShot('geardn', 0.8);
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
