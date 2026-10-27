/**
 * Carrera GT V10 Sound & Physics Engine (Web Audio API)
 * Supports embedded Base64 audio (zero CORS restrictions) and external fetch
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

    // Sound buffers
    this.buffers = {};

    // Active looping nodes & gains
    this.sources = {};
    this.gains = {};

    // Master nodes
    this.masterGain = null;
    this.compressor = null;

    // Engine parameters
    this.rpm = 920;
    this.targetRpm = 920;
    this.throttle = 0;       // 0.0 to 1.0
    this.targetThrottle = 0;
    this.speed = 0;          // km/h
    this.gear = 1;           // 1 to 6, or 0 (N)
    this.gearMode = 'A';     // 'A' (auto) or 'M' (manual) or 'N' (neutral)
    this.isRevLimiting = false;
    this.lastLimiterPulse = 0;

    // Pop / backfire cooldowns
    this.lastPopTime = 0;
    this.wasOnThrottle = false;

    // Base RPM calibration for sound files
    this.BASE_RPMS = {
      vlow: 1050,
      low: 2350,
      mid: 4400,
      high: 6300,
      ex_high: 8200,
      off_low: 1100,
      off_mid: 3500,
      off_high: 6500
    };

    // Gear ratios for Porsche Carrera GT (approx speed at 8400 RPM)
    this.gearMaxSpeeds = [0, 80, 135, 185, 235, 285, 335];
    this.gearMinSpeeds = [0, 0, 50, 95, 140, 190, 240];

    // Settings
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

    // Dynamics compressor for rich, punchy supercar master output
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

    // List of sound files to load
    const soundKeys = [
      'vlow', 'low', 'mid', 'high', 'ex_high',
      'off_low', 'off_mid', 'off_high',
      'transmission', 'gearup', 'geardn',
      'pop1', 'pop2', 'pop3', 'pop4'
    ];

    const loadPromises = soundKeys.map(async (key) => {
      try {
        let arrayBuf;
        // Priority 1: Embedded Base64 (works everywhere, including local file:/// without CORS)
        if (window.EMBEDDED_SOUNDS && window.EMBEDDED_SOUNDS[key]) {
          arrayBuf = base64ToArrayBuffer(window.EMBEDDED_SOUNDS[key]);
        } else {
          // Priority 2: Standard fetch
          const resp = await fetch(`sounds/${key}.mp3`);
          arrayBuf = await resp.arrayBuffer();
        }
        this.buffers[key] = await this.ctx.decodeAudioData(arrayBuf);
      } catch (e) {
        console.error(`Failed to decode sound buffer ${key}:`, e);
      }
    });

    await Promise.all(loadPromises);
    this.isReady = true;
    console.log('AudioEngine initialized. Loaded buffers:', Object.keys(this.buffers));
    return true;
  }

  async start() {
    if (!this.isReady) await this.init();
    if (this.ctx && this.ctx.state === 'suspended') {
      await this.ctx.resume();
    }

    if (this.isPlaying) return;

    // Start all continuous loops with initial gains
    const loopKeys = ['vlow', 'low', 'mid', 'high', 'ex_high', 'off_low', 'off_mid', 'off_high', 'transmission'];
    loopKeys.forEach(key => {
      if (!this.buffers[key]) return;
      const src = this.ctx.createBufferSource();
      src.buffer = this.buffers[key];
      src.loop = true;
      src.loopStart = 0;
      src.loopEnd = this.buffers[key].duration;

      const gain = this.ctx.createGain();
      gain.gain.setValueAtTime(0.001, this.ctx.currentTime);

      src.connect(gain);
      gain.connect(this.masterGain);
      src.start(0);

      this.sources[key] = src;
      this.gains[key] = gain;
    });

    this.isPlaying = true;
    this.rpm = 920;
    this.targetRpm = 920;
    this.updateAudioParameters();
    console.log('AudioEngine started. isPlaying:', this.isPlaying, 'ctx.state:', this.ctx.state);
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
    if (!this.ctx || !this.buffers[name] || !this.isPlaying) return;
    const src = this.ctx.createBufferSource();
    src.buffer = this.buffers[name];

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
    const chosen = pops[Math.floor(Math.random() * pops.length)];
    this.playOneShot(chosen, volume * this.popsAggressiveness, 0.08);
  }

  shiftUp() {
    if (this.gear < 6) {
      this.gear++;
      this.playOneShot('gearup', 0.85);
      this.triggerRandomPop(0.9);
      this.rpm = Math.max(2500, this.rpm * 0.68);
    }
  }

  shiftDown() {
    if (this.gear > 1) {
      this.gear--;
      this.playOneShot('geardn', 0.8);
      this.rpm = Math.min(8000, this.rpm * 1.35);
      this.triggerRandomPop(0.65);
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
          this.targetRpm = 920 + this.throttle * (8450 - 920);
          this.rpm += (this.targetRpm - this.rpm) * Math.min(1.0, dt * 16.0);
        } else {
          this.targetRpm = 920;
          this.rpm += (this.targetRpm - this.rpm) * Math.min(1.0, dt * 7.0);
        }
        this.speed = Math.max(0, this.speed - dt * 20.0);
      } else {
        const maxGearSpeed = this.gearMaxSpeeds[this.gear] || 80;
        const minGearSpeed = this.gearMinSpeeds[this.gear] || 0;

        if (this.throttle > 0.05) {
          const torqueFactor = Math.sin((this.rpm / 8400) * Math.PI) * 0.5 + 0.6;
          const accel = (60.0 / this.gear) * this.throttle * torqueFactor;
          this.speed += accel * dt;
        } else {
          const drag = 8.0 + (this.speed / 100.0) * 12.0;
          this.speed = Math.max(0, this.speed - drag * dt);
        }

        if (this.gearMode === 'A') {
          if (this.rpm >= 8350 && this.gear < 6) {
            this.shiftUp();
          } else if (this.speed < minGearSpeed && this.gear > 1 && this.throttle < 0.3) {
            this.shiftDown();
          }
        }

        const calculatedRpm = (this.speed / maxGearSpeed) * 8400;
        this.rpm = Math.max(920, calculatedRpm);
      }
    }

    // Rev limiter cut
    if (this.rpm >= 8400) {
      this.isRevLimiting = true;
      if (now - this.lastLimiterPulse > 0.065) {
        this.lastLimiterPulse = now;
        this.rpm = 8240 + Math.random() * 80;
        this.triggerRandomPop(0.85);
      }
    } else {
      this.isRevLimiting = false;
    }

    // Overrun pops
    if (this.wasOnThrottle && this.throttle < 0.05 && this.rpm > 2800) {
      if (now - this.lastPopTime > 0.22) {
        this.lastPopTime = now;
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

    const rpm = Math.max(600, Math.min(9500, this.rpm));
    const thr = Math.max(0, Math.min(1, this.throttle));

    // Playback rate (pitch) modulation
    for (const [key, baseRpm] of Object.entries(this.BASE_RPMS)) {
      if (this.sources[key]) {
        const rate = Math.max(0.3, Math.min(2.8, rpm / baseRpm));
        this.sources[key].playbackRate.setTargetAtTime(rate, now, smoothTime);
      }
    }

    // Gains for ON-throttle layers
    const g_vlow = this.calcGain(rpm, 0, 700, 1100, 2200);
    const g_low = this.calcGain(rpm, 1100, 2100, 2600, 4200);
    const g_mid = this.calcGain(rpm, 2400, 3800, 4800, 6400);
    const g_high = this.calcGain(rpm, 4600, 5800, 6600, 7800);
    const g_ex_high = this.calcGain(rpm, 6200, 7800, 8500, 10000);

    // Gains for OFF-throttle layers
    const g_off_low = this.calcGain(rpm, 0, 800, 1400, 2800);
    const g_off_mid = this.calcGain(rpm, 1600, 3200, 4200, 5800);
    const g_off_high = this.calcGain(rpm, 4200, 6200, 8600, 10000);

    const limiterCut = this.isRevLimiting ? 0.2 : 1.0;

    // Load blending: ensure rich idle rumble even at 0 throttle
    const idleFactor = Math.max(0, 1.0 - (rpm - 900) / 1000.0);
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

    // Transmission straight-cut whine
    if (this.gains['transmission'] && this.sources['transmission']) {
      const transRate = Math.max(0.3, Math.min(2.5, (this.speed / 120.0) * 1.6));
      this.sources['transmission'].playbackRate.setTargetAtTime(transRate, now, smoothTime);
      const transVol = Math.min(0.22, (this.speed / 180.0) * 0.2);
      applyGain('transmission', transVol);
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
      this.targetRpm = 920;
    } else {
      const ratio = this.speed / this.gearMaxSpeeds[this.gear];
      this.targetRpm = Math.max(1200, Math.min(8450, ratio * 8400));
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
