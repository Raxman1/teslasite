/**
 * DSPAudioEngine — Procedural Engine Sound & Drivetrain Controller
 * Powered by EngineDSP and Vehicle simulation
 */
class DSPAudioEngine {
  constructor(audioContext, destinationOrGetter) {
    this.ctx = audioContext;
    this.destinationOrGetter = destinationOrGetter;
    if ('audioSession' in navigator) {
      try {
        navigator.audioSession.type = 'playback';
      } catch (e) {}
    }
    this.car = null;
    this.vehicle = null;
    this.node = null;
    this.fader = null;
    this.post = () => {};
    this.workletPromise = null;
    this.isReady = false;
    this.isPlaying = false;
    this.engineGen = 0;

    // Adjustable tuning parameters (100% authentic teslasound.io defaults)
    this.character = 0.75; // 0.15 (quiet stock) .. 1.0 (aggressive open straight pipes)
    this.crackle = 0.75;   // 0.0 .. 1.5 (afterfire pops & bangs)
    this.whineLevel = 1.0; // 0.0 .. 2.0 (turbo/supercharger whine volume)
    this.whinePitch = 1.0; // 0.5 .. 1.8 (whine pitch multiplier)
    this.idleRpmOffset = 0;// -150 .. +350 RPM (idle lope)
    this.limiterMode = 'hard'; // 'hard' (2-step aggressive) | 'soft' (smooth bounce)
    this.throttleResponse = 'sport'; // 'linear' | 'sport' | 'race'
    this.shiftProfile = 'comfort'; // 'comfort' (обычные / пониженные) | 'sport' (спорт / повышенные)
    this.rpmMultiplier = 1.0;      // 1.0x (норма) | 2.0x (спорт) | 3.0x (экстрим)
    this.intensity = 0.70;         // 0.35 (comfort) | 0.70 (sport) | 1.0 (insane throttle response)

    // Default car: Mercedes CLS 63 AMG «Банан»
    this.setCar('cls63-amg');
  }

  setCar(carId) {
    const cars = window.MOTORSOUND_CARS || [];
    const found = cars.find(c => c.id === carId) || cars.find(c => c.id === 'gt3') || cars[0];
    if (!found) return;

    this.car = found;
    this.baseIdleRpm = (found.engine && found.engine.idleRpm) ? found.engine.idleRpm : 800;
    this.vehicle = new window.Vehicle(found);
    if (this.rpmMultiplier) {
      this.vehicle.rpmMultiplier = this.rpmMultiplier;
    }
    if (this.shiftProfile) {
      this.vehicle.shiftProfile = this.shiftProfile;
    }
    if (this.intensity !== undefined) {
      this.vehicle.intensity = this.intensity;
    }
    this.applyTuningParams();
    console.log('[DSPAudioEngine] Selected car:', found.name);

    if (this.isPlaying) {
      this.rebuildNode();
    }
  }

  applyTuningParams() {
    if (!this.vehicle || !this.vehicle.e) return;
    const baseIdle = this.baseIdleRpm || (this.car && this.car.engine ? this.car.engine.idleRpm : 800);
    this.vehicle.e.idleRpm = Math.max(450, baseIdle + this.idleRpmOffset);
    this.vehicle.e.softLimiter = (this.limiterMode === 'soft');
  }

  async rebuildNode() {
    this.engineGen++;
    const currentGen = this.engineGen;

    if (this.node && this.fader) {
      const oldNode = this.node;
      const oldFader = this.fader;
      try {
        oldFader.gain.linearRampToValueAtTime(0.0001, this.ctx.currentTime + 0.12);
        setTimeout(() => {
          try {
            oldNode.disconnect();
            oldFader.disconnect();
          } catch (e) {}
        }, 160);
      } catch (e) {}
    }

    this.node = null;
    this.fader = null;
    this.post = () => {};

    if (!this.car) return;

    const synth = await this._createSynthNode(this.car.engine);
    if (currentGen !== this.engineGen) {
      try { synth.node.disconnect(); } catch (e) {}
      return;
    }

    const fader = this.ctx.createGain();
    fader.gain.setValueAtTime(1.0, this.ctx.currentTime);

    try {
      synth.node.connect(fader);
    } catch (e) {
      console.warn('[DSPAudioEngine] synth.node.connect warning:', e);
    }

    // Resolve destination node safely
    let targetDest = null;
    if (typeof this.destinationOrGetter === 'function') {
      try { targetDest = this.destinationOrGetter(); } catch (e) {}
    } else {
      targetDest = this.destinationOrGetter;
    }

    try {
      if (targetDest && typeof targetDest.connect === 'function') {
        fader.connect(targetDest);
      } else {
        fader.connect(this.ctx.destination);
      }
    } catch (err) {
      console.warn('[DSPAudioEngine] Destination connect warning, falling back to ctx.destination:', err);
      try {
        fader.connect(this.ctx.destination);
      } catch (err2) {
        console.error('[DSPAudioEngine] Direct destination fallback error:', err2);
      }
    }

    this.node = synth.node;
    this.fader = fader;
    this.post = synth.post;
    this.isReady = true;

    if (this.vehicle) {
      this.vehicle.running = true;
      this.vehicle.startT = 3.0; // Skip crank so revs are immediately responsive
    }
  }

  async _createSynthNode(engineCfg) {
    const seed = (Math.random() * 4294967295) >>> 0;
    const DSP_URL = 'js/dsp/engine-dsp.js';

    if (this.ctx.audioWorklet && window.AudioWorkletNode) {
      try {
        if (!this.workletPromise) {
          this.workletPromise = this.ctx.audioWorklet.addModule(DSP_URL);
        }
        await Promise.race([
          this.workletPromise,
          new Promise((_, reject) => setTimeout(() => reject(new Error('Worklet timeout')), 2500))
        ]);

        const node = new AudioWorkletNode(this.ctx, 'engine-processor', {
          numberOfInputs: 0,
          numberOfOutputs: 1,
          outputChannelCount: [2],
          processorOptions: { config: engineCfg, seed: seed }
        });

        return {
          node: node,
          post: (msg) => node.port.postMessage(msg)
        };
      } catch (err) {
        console.warn('AudioWorklet unavailable or timed out, using ScriptProcessor fallback:', err);
      }
    }

    // High-performance ScriptProcessorNode fallback with window.EngineDSP
    const dsp = window.EngineDSP.create(this.ctx.sampleRate, engineCfg, seed);
    const node = this.ctx.createScriptProcessor(1024, 1, 2);
    node.onaudioprocess = (e) => {
      const out = e.outputBuffer;
      dsp.process(out.getChannelData(0), out.getChannelData(1), out.length);
    };

    // WebKit / iOS Safari ScriptProcessor wake-up dummy connection
    try {
      const dummy = this.ctx.createBufferSource();
      dummy.buffer = this.ctx.createBuffer(1, 1, this.ctx.sampleRate);
      dummy.loop = true;
      dummy.connect(node);
      dummy.start(0);
    } catch (e) {}

    return {
      node: node,
      post: (msg) => dsp.message(msg)
    };
  }

  async start() {
    if (this.ctx.state === 'suspended' || this.ctx.state === 'interrupted') {
      try {
        await Promise.race([
          this.ctx.resume(),
          new Promise(r => setTimeout(r, 60))
        ]).catch(() => {});
      } catch (e) {}
    }

    if (!this.node) {
      await this.rebuildNode();
    }

    this.isPlaying = true;
    if (this.vehicle) {
      this.vehicle.running = true;
      this.vehicle.startT = 3.0;
    }
    console.log('[DSPAudioEngine] Running:', this.car ? this.car.name : 'unknown');
  }

  stop() {
    this.isPlaying = false;
    if (this.vehicle) {
      this.vehicle.running = false;
      this.vehicle.rpm = 0;
    }
    if (this.node && this.fader) {
      const oldNode = this.node;
      const oldFader = this.fader;
      try {
        oldFader.gain.linearRampToValueAtTime(0.0001, this.ctx.currentTime + 0.1);
        setTimeout(() => {
          try {
            oldNode.disconnect();
            oldFader.disconnect();
          } catch (e) {}
        }, 150);
      } catch (e) {}
      this.node = null;
      this.fader = null;
      this.post = () => {};
    }
  }

  updatePhysics(dt, controlMode, inputState = {}) {
    if (!this.vehicle) return;

    let input;
    const gearMode = inputState.gearMode || 'A';
    const isNeutral = (gearMode === 'N');

    if (controlMode === 'gps') {
      input = {
        source: 'gps',
        gearMode: gearMode,
        speed: (inputState.speed || 0) / 3.6, // km/h to m/s
        accel: inputState.accel || 0
      };
    } else {
      // Manual / Virtual Gas & Brake Pedal mode
      const rawThr = Math.max(0, Math.min(1, inputState.throttle || 0));
      
      // Throttle response curve
      let thr = rawThr;
      if (this.throttleResponse === 'sport') {
        thr = Math.pow(rawThr, 0.82);
      } else if (this.throttleResponse === 'race') {
        thr = Math.pow(rawThr, 0.65);
      }

      const brk = Math.max(0, Math.min(1, inputState.brake !== undefined ? inputState.brake : (inputState.isBrake ? 1 : 0)));
      input = {
        source: 'demo',
        gearMode: gearMode,
        gas: isNeutral ? 0 : thr,
        brake: brk,
        rev: isNeutral ? thr : 0,
        hold: !!inputState.hold
      };
    }

    this.applyTuningParams();
    this.vehicle.update(dt, input);

    // Send calculated combustion parameters to DSP synthesizer
    if (this.isPlaying && this.post) {
      this.post({
        type: 'params',
        rpm: this.vehicle.rpm,
        load: this.vehicle.load,
        overrun: this.vehicle.overrun,
        cut: this.vehicle.cut,
        character: this.character,
        crackle: this.crackle,
        whinePitch: this.whinePitch,
        whineLevel: this.whineLevel,
        speed: this.vehicle.speed,
        rev: this.vehicle.revPedal
      });

      // Deliver gear shift clicks
      if (this.vehicle.clicks && this.vehicle.clicks.length > 0) {
        while (this.vehicle.clicks.length > 0) {
          const strength = this.vehicle.clicks.shift();
          this.post({ type: 'click', strength: strength });
        }
      }
    }
  }

  shiftUp() {
    if (!this.vehicle || !this.car) return;
    if (this.vehicle.neutral) {
      this.vehicle.neutral = false;
      this.vehicle.gear = 1;
      return;
    }
    const maxGears = (this.car.vehicle && this.car.vehicle.ratios) ? this.car.vehicle.ratios.length : 6;
    if (this.vehicle.gear < maxGears) {
      this.vehicle._startShift(this.vehicle.gear + 1);
    }
  }

  shiftDown() {
    if (!this.vehicle) return;
    if (this.vehicle.neutral) {
      this.vehicle.neutral = false;
      this.vehicle.gear = 1;
      return;
    }
    if (this.vehicle.gear > 1) {
      this.vehicle._startShift(this.vehicle.gear - 1);
    }
  }

  setRpmMultiplier(mult) {
    this.rpmMultiplier = Math.max(0.5, Math.min(5.0, parseFloat(mult) || 1.0));
    if (this.vehicle) {
      this.vehicle.rpmMultiplier = this.rpmMultiplier;
      if (this.vehicle.running && this.rpmMultiplier > 1.0) {
        this.vehicle.blip = 0.22;
        if (this.vehicle.neutral) {
          this.vehicle.revPedal = Math.min(0.65, (this.vehicle.revPedal || 0) + 0.35);
        }
      }
    }
  }

  setShiftProfile(profile) {
    this.shiftProfile = (profile === 'sport') ? 'sport' : 'comfort';
    if (this.vehicle) {
      this.vehicle.shiftProfile = this.shiftProfile;
      if (this.vehicle.running && this.shiftProfile === 'sport') {
        this.vehicle.blip = 0.22;
        if (this.vehicle.neutral) {
          this.vehicle.revPedal = Math.min(0.65, (this.vehicle.revPedal || 0) + 0.35);
        } else if (this.vehicle.gear > 1) {
          this.vehicle._startShift(Math.max(1, this.vehicle.gear - 1));
        }
      }
    }
  }

  setGear(g) {
    if (!this.vehicle || !this.car) return;
    const maxGears = (this.car.vehicle && this.car.vehicle.ratios) ? this.car.vehicle.ratios.length : 7;
    const target = Math.max(1, Math.min(maxGears, parseInt(g, 10)));
    this.vehicle.neutral = false;
    this.vehicle._startShift(target);
  }

  setIntensity(val) {
    this.intensity = Math.max(0.1, Math.min(1.5, parseFloat(val) || 0.7));
    if (this.vehicle) {
      this.vehicle.intensity = this.intensity;
    }
  }

  setCharacter(val) {
    this.character = Math.max(0.1, Math.min(1.0, parseFloat(val) || 0.75));
  }

  setCrackle(val) {
    this.crackle = Math.max(0.0, Math.min(2.0, parseFloat(val) || 0.75));
  }

  get rpm() { return this.vehicle ? this.vehicle.rpm : 900; }
  get speed() { return this.vehicle ? this.vehicle.speed * 3.6 : 0; }
  get gear() { return (this.vehicle && !this.vehicle.neutral) ? this.vehicle.gear : 0; }
  get redlineRpm() { return (this.car && this.car.engine) ? this.car.engine.redlineRpm : 8000; }
  get maxRpm() { return (this.car && this.car.engine) ? this.car.engine.limiterRpm * 1.05 : 9500; }
  get idleRpm() { return (this.car && this.car.engine) ? this.car.engine.idleRpm : 850; }
  get throttle() { return this.vehicle ? (this.vehicle.neutral ? Math.max(this.vehicle.revPedal || 0, this.vehicle.throttle || 0) : this.vehicle.throttle) : 0; }
  get isRevLimiting() { return this.vehicle ? !!this.vehicle.limiterCut : false; }
}

window.DSPAudioEngine = DSPAudioEngine;
