/**
 * Main Application Coordinator
 * UI, Canvas Gauges, Interactive Pedal, Telemetry HUD & Mode Manager
 */
document.addEventListener('DOMContentLoaded', () => {
  // Instances
  const audio = new AudioEngine();
  const telemetry = new TelemetryTracker({
    onUpdate: handleTelemetryUpdate,
    onError: handleTelemetryError
  });
  const p2p = new P2PBridge({
    onTelemetryReceived: handleRemoteTelemetry,
    onStatusChange: handleP2PStatus
  });

  // State
  let activeTab = 'pedal'; // 'pedal' | 'gps' | 'p2p'
  let isPedalPressed = false;
  let pedalThrottle = 0;
  let animationFrameId = null;
  let lastFrameTime = performance.now();

  // DOM Elements
  const startBtn = document.getElementById('startBtn');
  const fullscreenBtn = document.getElementById('fullscreenBtn');
  const p2pModalBtn = document.getElementById('p2pModalBtn');
  const p2pModal = document.getElementById('p2pModal');
  const closeModalBtn = document.getElementById('closeModalBtn');
  const connectPhoneBtn = document.getElementById('connectPhoneBtn');
  const phoneCodeInput = document.getElementById('phoneCodeInput');
  const engineVolumeSlider = document.getElementById('engineVolumeSlider');
  const engineVolumeText = document.getElementById('engineVolumeText');

  if (engineVolumeSlider) {
    engineVolumeSlider.addEventListener('input', (e) => {
      const val = parseInt(e.target.value, 10);
      const vol = val / 100.0;
      if (engineVolumeText) engineVolumeText.textContent = `${val}%`;
      audio.setVolume(vol);
    });
  }

  // Mode Switcher & DSP Tuning Elements
  const modeDspBtn = document.getElementById('modeDspBtn');
  const modeSamplesBtn = document.getElementById('modeSamplesBtn');
  const dspTuningBox = document.getElementById('dspTuningBox');
  const toggleAdvDspBtn = document.getElementById('toggleAdvDspBtn');
  const advDspBox = document.getElementById('advDspBox');
  const characterSlider = document.getElementById('characterSlider');
  const characterValText = document.getElementById('characterValText');
  const crackleSlider = document.getElementById('crackleSlider');
  const crackleValText = document.getElementById('crackleValText');
  const whineLevelSlider = document.getElementById('whineLevelSlider');
  const whineLevelValText = document.getElementById('whineLevelValText');
  const whinePitchSlider = document.getElementById('whinePitchSlider');
  const whinePitchValText = document.getElementById('whinePitchValText');
  const idleOffsetSlider = document.getElementById('idleOffsetSlider');
  const idleOffsetValText = document.getElementById('idleOffsetValText');
  const limiterHardBtn = document.getElementById('limiterHardBtn');
  const limiterSoftBtn = document.getElementById('limiterSoftBtn');
  const respLinearBtn = document.getElementById('respLinearBtn');
  const respSportBtn = document.getElementById('respSportBtn');
  const respRaceBtn = document.getElementById('respRaceBtn');

  // Preset Selector Elements
  const presetSelect = document.getElementById('presetSelect');
  const brandBadge = document.getElementById('brandBadge');
  const brandTitle = document.getElementById('brandTitle');
  const pedalLogo = document.querySelector('.pedal-logo');

  let currentEngineMode = 'dsp'; // 'dsp' | 'samples'

  const DSP_PRESETS = [
    { id: 'dsp:cls63-amg', name: 'Mercedes CLS 63 AMG «Банан»', badge: '5.5L BiTurbo V8 · 585 HP' },
    { id: 'dsp:g63-amg', name: 'Mercedes-AMG G 63 «Гелик»', badge: '4.0L V8 · Side Pipes' },
    { id: 'dsp:c63-amg-w204', name: 'Mercedes C 63 AMG (W204)', badge: '6.2L V8 NA · 507 HP' },
    { id: 'dsp:sls-amg', name: 'Mercedes SLS AMG', badge: '6.2L V8 Gullwing' },
    { id: 'dsp:gt3', name: 'Porsche 911 GT3', badge: '9,000 RPM Flat-6' },
    { id: 'dsp:porsche-911-gt3-rs-991', name: 'Porsche 911 GT3 RS', badge: '9,000 RPM PDK' },
    { id: 'dsp:porsche-911-turbo-s', name: 'Porsche 911 Turbo S', badge: '3.7L Twin-Turbo' },
    { id: 'dsp:ferrari-v12', name: 'Ferrari V12', badge: '6.5L V12 · 8,900 RPM' },
    { id: 'dsp:ferrari-enzo', name: 'Ferrari Enzo', badge: '6.0L V12 · 8,200 RPM' },
    { id: 'dsp:lamborghini-veneno', name: 'Lamborghini Veneno', badge: '6.5L V12 · 8,500 RPM' },
    { id: 'dsp:lamborghini-urus', name: 'Lamborghini Urus', badge: '4.0L Biturbo V8' },
    { id: 'dsp:bugatti-chiron', name: 'Bugatti Chiron', badge: '8.0L W16 Quad-Turbo' },
    { id: 'dsp:hellcat', name: 'Dodge Hellcat', badge: '6.2L Supercharged V8' },
    { id: 'dsp:v8-muscle', name: 'V8 Muscle', badge: '6.2L Crossplane V8' },
    { id: 'dsp:audi-rs6', name: 'Audi RS 6 Avant', badge: '4.0L Twin-Turbo V8' },
    { id: 'dsp:bmw-m3', name: 'BMW M3 Competition', badge: '3.0L Twin-Turbo I6' },
    { id: 'dsp:nissan-gtr-nismo-r35', name: 'Nissan GT-R NISMO', badge: '3.8L Twin-Turbo V6' },
    { id: 'dsp:slipstream', name: 'F1 Slipstream', badge: '1.6L Hybrid · 12,000 RPM' },
    { id: 'dsp:city-shifter', name: 'Shift Maniac', badge: '10 Short Gears' },
    { id: 'dsp:tesla-roadster-thrust', name: 'Tesla Roadster', badge: 'SpaceX Thrusters' },
    { id: 'dsp:electric-zen', name: 'ElectricZen', badge: 'Sci-Fi Electric' },
    { id: 'dsp:haunted-hearse', name: 'Haunted Hearse', badge: 'Ghost Choir' }
  ];

  const SAMPLE_PRESETS = [
    { id: 'sample:carrera_gt', name: 'Porsche Carrera GT', badge: '5.7L V10' },
    { id: 'sample:supra_2jz', name: 'Toyota Supra 2JZ', badge: 'Turbo I6 800HP' },
    { id: 'sample:amg_m177', name: 'Mercedes-AMG GT-R', badge: 'Biturbo V8' },
    { id: 'sample:bmw_z4_gt3', name: 'BMW Z4 GT3', badge: 'Race V8' },
    { id: 'sample:dragster', name: 'Top Fuel Dragster', badge: 'Blown Nitro 10,000HP' }
  ];

  function getShortBrandLogo(fullName) {
    if (!fullName) return 'SPORT';
    const n = fullName.toUpperCase();
    if (n.includes('CLS 63') || n.includes('G 63') || n.includes('C 63') || n.includes('SLS') || n.includes('AMG') || n.includes('MERCEDES')) return 'AMG';
    if (n.includes('PORSCHE') || n.includes('GT3') || n.includes('CARRERA')) return 'PORSCHE';
    if (n.includes('FERRARI') || n.includes('ENZO')) return 'FERRARI';
    if (n.includes('LAMBORGHINI') || n.includes('VENENO') || n.includes('URUS')) return 'LAMBO';
    if (n.includes('BUGATTI') || n.includes('CHIRON')) return 'BUGATTI';
    if (n.includes('DODGE') || n.includes('HELLCAT')) return 'HELLCAT';
    if (n.includes('AUDI') || n.includes('RS6') || n.includes('RS 6')) return 'AUDI';
    if (n.includes('BMW') || n.includes('M3') || n.includes('Z4')) return 'BMW M';
    if (n.includes('GT-R') || n.includes('GTR') || n.includes('NISMO')) return 'GT-R';
    if (n.includes('SUPRA') || n.includes('2JZ')) return 'SUPRA';
    if (n.includes('TESLA') || n.includes('ROADSTER')) return 'TESLA';
    return fullName.split(' ')[0].toUpperCase().substring(0, 6);
  }

  function updateBrandDisplay(name, badge) {
    if (brandTitle) brandTitle.textContent = name;
    if (brandBadge) brandBadge.textContent = badge;
    if (pedalLogo) pedalLogo.textContent = getShortBrandLogo(name);
  }

  function populatePresetDropdown(mode) {
    if (!presetSelect) return;
    presetSelect.innerHTML = '';
    const list = mode === 'dsp' ? DSP_PRESETS : SAMPLE_PRESETS;
    list.forEach(item => {
      const opt = document.createElement('option');
      opt.value = item.id;
      opt.textContent = `${item.name} (${item.badge})`;
      presetSelect.appendChild(opt);
    });
    const first = list[0];
    presetSelect.value = first.id;
    updateBrandDisplay(first.name, first.badge);
    if (dspTuningBox) {
      dspTuningBox.style.display = mode === 'dsp' ? 'block' : 'none';
    }
    if (audio) {
      audio.setPreset(first.id).catch(() => {});
    }
  }

  if (modeDspBtn && modeSamplesBtn) {
    modeDspBtn.addEventListener('click', async () => {
      if (currentEngineMode === 'dsp') return;
      currentEngineMode = 'dsp';
      modeDspBtn.classList.add('active');
      modeSamplesBtn.classList.remove('active');
      populatePresetDropdown('dsp');
      await audio.setPreset(presetSelect.value);
    });

    modeSamplesBtn.addEventListener('click', async () => {
      if (currentEngineMode === 'samples') return;
      currentEngineMode = 'samples';
      modeSamplesBtn.classList.add('active');
      modeDspBtn.classList.remove('active');
      populatePresetDropdown('samples');
      await audio.setPreset(presetSelect.value);
    });
  }

  if (characterSlider) {
    characterSlider.addEventListener('input', (e) => {
      const val = parseInt(e.target.value, 10);
      if (characterValText) characterValText.textContent = `${val}%`;
      if (audio.dspEngine) audio.dspEngine.character = val / 100.0;
    });
  }

  if (crackleSlider) {
    crackleSlider.addEventListener('input', (e) => {
      const val = parseInt(e.target.value, 10);
      if (crackleValText) crackleValText.textContent = `${val}%`;
      if (audio.dspEngine) audio.dspEngine.crackle = val / 100.0;
    });
  }

  // whineLevelSlider is synchronized with universal turbo system below

  if (whinePitchSlider) {
    whinePitchSlider.addEventListener('input', (e) => {
      const val = parseInt(e.target.value, 10);
      if (whinePitchValText) whinePitchValText.textContent = `${val}%`;
      if (audio.dspEngine) audio.dspEngine.whinePitch = val / 100.0;
    });
  }

  if (toggleAdvDspBtn && advDspBox) {
    toggleAdvDspBtn.addEventListener('click', () => {
      const isOpen = advDspBox.style.display !== 'none';
      advDspBox.style.display = isOpen ? 'none' : 'block';
      toggleAdvDspBtn.classList.toggle('active', !isOpen);
      toggleAdvDspBtn.textContent = isOpen ? '⚙️ Опции' : '✕ Скрыть';
    });
  }

  if (idleOffsetSlider) {
    idleOffsetSlider.addEventListener('input', (e) => {
      const val = parseInt(e.target.value, 10);
      if (idleOffsetValText) idleOffsetValText.textContent = `${val >= 0 ? '+' : ''}${val} RPM`;
      if (audio.dspEngine) {
        audio.dspEngine.idleRpmOffset = val;
        audio.dspEngine.applyTuningParams();
      }
    });
  }

  if (limiterHardBtn && limiterSoftBtn) {
    limiterHardBtn.addEventListener('click', () => {
      limiterHardBtn.classList.add('active');
      limiterSoftBtn.classList.remove('active');
      if (audio.dspEngine) {
        audio.dspEngine.limiterMode = 'hard';
        audio.dspEngine.applyTuningParams();
      }
    });
    limiterSoftBtn.addEventListener('click', () => {
      limiterSoftBtn.classList.add('active');
      limiterHardBtn.classList.remove('active');
      if (audio.dspEngine) {
        audio.dspEngine.limiterMode = 'soft';
        audio.dspEngine.applyTuningParams();
      }
    });
  }

  if (respLinearBtn && respSportBtn && respRaceBtn) {
    const setResp = (mode, activeBtn) => {
      [respLinearBtn, respSportBtn, respRaceBtn].forEach(b => b.classList.remove('active'));
      activeBtn.classList.add('active');
      if (audio.dspEngine) audio.dspEngine.throttleResponse = mode;
    };
    respLinearBtn.addEventListener('click', () => setResp('linear', respLinearBtn));
    respSportBtn.addEventListener('click', () => setResp('sport', respSportBtn));
    respRaceBtn.addEventListener('click', () => setResp('race', respRaceBtn));
  }

  // Populate default mode (DSP)
  populatePresetDropdown('dsp');

  // Tesla Audio Optimization Elements
  const stageBtns = document.querySelectorAll('.stage-btn');
  const bassSlider = document.getElementById('bassSlider');
  const bassLevelText = document.getElementById('bassLevelText');

  if (stageBtns) {
    stageBtns.forEach(btn => {
      btn.addEventListener('click', () => {
        stageBtns.forEach(b => b.classList.remove('active'));
        btn.classList.add('active');
        const mode = btn.dataset.stage;
        audio.setTeslaSoundstage(mode);
      });
    });
  }

  if (bassSlider) {
    bassSlider.addEventListener('input', (e) => {
      const val = parseInt(e.target.value, 10);
      bassLevelText.textContent = `${val}%`;
      audio.bassShakeLevel = val / 100.0;
      if (audio.subwooferGain && audio.ctx) {
        audio.subwooferGain.gain.setTargetAtTime(audio.bassShakeLevel * 1.2, audio.ctx.currentTime, 0.05);
      }
    });
  }

  // Universal Turbocharger Sound Elements (Dual Controls Synchronized)
  const turboToggleBtn = document.getElementById('turboToggleBtn');
  const turboToggleText = document.getElementById('turboToggleText');
  const turboStateBadge = document.getElementById('turboStateBadge');
  const turboVolumeSlider = document.getElementById('turboVolumeSlider');
  const turboVolumeValText = document.getElementById('turboVolumeValText');
  const advWhineToggleBtn = document.getElementById('advWhineToggleBtn');
  const turboBovCheck = document.getElementById('turboBovCheck');

  let isTurboWhineActive = true;

  function updateTurboWhineUI(enabled, vol) {
    isTurboWhineActive = enabled;
    
    // 1. Dedicated Turbo Box UI
    if (turboStateBadge) {
      turboStateBadge.textContent = enabled ? 'ВКЛ' : 'ВЫКЛ';
      turboStateBadge.classList.toggle('active', enabled);
    }
    if (turboToggleBtn) {
      turboToggleBtn.classList.toggle('active', enabled);
      if (turboToggleText) turboToggleText.textContent = enabled ? 'ВКЛ' : 'ВЫКЛ';
    }
    if (turboVolumeValText) {
      turboVolumeValText.textContent = enabled ? `${vol}%` : 'ВЫКЛ';
    }
    if (turboVolumeSlider && parseInt(turboVolumeSlider.value, 10) !== vol) {
      turboVolumeSlider.value = vol;
    }

    // 2. Collapsible DSP Options UI (synchronized)
    if (advWhineToggleBtn) {
      advWhineToggleBtn.classList.toggle('active', enabled);
      advWhineToggleBtn.textContent = enabled ? 'ВКЛ' : 'ВЫКЛ';
    }
    if (whineLevelValText) {
      whineLevelValText.textContent = enabled ? `${vol}%` : 'ВЫКЛ';
    }
    if (whineLevelSlider && parseInt(whineLevelSlider.value, 10) !== vol) {
      whineLevelSlider.value = vol;
    }

    // 3. Audio Engines
    audio.setTurboWhine(enabled);
    audio.setTurboVolume(vol);
    if (audio.dspEngine) {
      audio.dspEngine.whineLevel = enabled ? (vol / 100.0) : 0;
    }
  }

  function handleTurboToggle() {
    ensureAudioActive();
    const newState = !isTurboWhineActive;
    let vol = turboVolumeSlider ? parseInt(turboVolumeSlider.value, 10) : 100;
    if (newState && vol === 0) vol = 100;
    updateTurboWhineUI(newState, vol);
  }

  if (turboToggleBtn) turboToggleBtn.addEventListener('click', handleTurboToggle);
  if (advWhineToggleBtn) advWhineToggleBtn.addEventListener('click', handleTurboToggle);

  function handleTurboVolumeInput(e) {
    ensureAudioActive();
    const val = parseInt(e.target.value, 10);
    const enabled = val > 0;
    updateTurboWhineUI(enabled, val);
  }

  if (turboVolumeSlider) turboVolumeSlider.addEventListener('input', handleTurboVolumeInput);
  if (whineLevelSlider) whineLevelSlider.addEventListener('input', handleTurboVolumeInput);

  if (turboBovCheck) {
    turboBovCheck.addEventListener('change', (e) => {
      ensureAudioActive();
      audio.setTurboBlowOff(e.target.checked);
    });
  }

  // Gauge Elements
  const canvas = document.getElementById('gaugeCanvas');
  const ctx = canvas.getContext('2d');
  const gearDisplay = document.getElementById('gearDisplay');
  const speedDisplay = document.getElementById('speedDisplay');
  const rpmNumeric = document.getElementById('rpmNumeric');
  const shiftLeds = document.querySelectorAll('.shift-led');

  // HUD Elements
  const hudSpeed = document.getElementById('hudSpeed');
  const hudAccel = document.getElementById('hudAccel');
  const hudGForce = document.getElementById('hudGForce');
  const hudAccuracy = document.getElementById('hudAccuracy');
  const hudRate = document.getElementById('hudRate');
  const hudCoords = document.getElementById('hudCoords');
  const gDot = document.getElementById('gDot');

  // Dual Pedal Elements (Brake & Gas)
  const pedalFrame = document.getElementById('pedalFrame');
  const pedalPlate = document.getElementById('pedalPlate');
  const pedalPercent = document.getElementById('pedalPercent');
  const pedalFill = document.getElementById('pedalFill');

  const brakeFrame = document.getElementById('brakeFrame');
  const brakePlate = document.getElementById('brakePlate');
  const brakePercent = document.getElementById('brakePercent');
  const brakeFill = document.getElementById('brakeFill');

  const blipBtn = document.getElementById('blipBtn');
  const launchBtn = document.getElementById('launchBtn');
  const holdThrottleBtn = document.getElementById('holdThrottleBtn');
  let isThrottleHold = false;
  let isLaunchControl = false;
  let isBlipping = false;
  let blipTimeout = null;
  let launchTimer1 = null;
  let launchTimer2 = null;
  let brakePressure = 0;
  let isBrakePressed = false;

  // Mode Buttons
  const tabBtns = document.querySelectorAll('.tab-btn');
  const gearBtns = document.querySelectorAll('.gear-mode-btn');

  // Set Canvas resolution - safe version (strictly 1:1 circular ratio)
  let _canvasCssSide = 380;
  function resizeCanvas() {
    try {
      const dpr = window.devicePixelRatio || 1;
      const rect = canvas.getBoundingClientRect();
      const cssW = (rect && rect.width > 80) ? rect.width
                 : (canvas.offsetWidth > 80 ? canvas.offsetWidth : 380);
      const cssH = (rect && rect.height > 80) ? rect.height
                 : (canvas.offsetHeight > 80 ? canvas.offsetHeight : 380);
      const side = Math.min(cssW, cssH);
      _canvasCssSide = side;
      const newSide = Math.round(side * dpr);
      canvas.width  = newSide;
      canvas.height = newSide;
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0); // reset + scale in one call, no compounding
    } catch (e) {
      console.warn('resizeCanvas error:', e);
    }
  }
  window.addEventListener('resize', resizeCanvas);
  resizeCanvas();
  setTimeout(resizeCanvas, 100);
  window.scrollTo(0, 0);

  // 0. PRESET SELECTOR
  if (presetSelect) {
    presetSelect.addEventListener('change', async (e) => {
      const selectedId = e.target.value;
      const list = currentEngineMode === 'dsp' ? DSP_PRESETS : SAMPLE_PRESETS;
      const presetInfo = list.find(item => item.id === selectedId);
      if (presetInfo) {
        updateBrandDisplay(presetInfo.name, presetInfo.badge);
        brandTitle.textContent = `${presetInfo.name} ⏳`;
      }
      try {
        await audio.setPreset(selectedId);
      } catch (err) {
        console.error('Error switching preset:', err);
      }
      if (presetInfo) {
        brandTitle.textContent = presetInfo.name;
      }
      if (!audio.isPlaying) {
        await unlockAndStartEngine();
      }
    });
  }

  // iOS Safari & Tesla Audio Session Unlocker
  // Plays valid silent audio to force iOS out of "Ambient" into "Playback" (bypasses silent switch)
  function unlockSafariAndTeslaAudio() {
    try {
      const ctx = audio.ensureContext();
      if (ctx) {
        if (ctx.state === 'suspended') {
          ctx.resume().catch(() => {});
        }
        // iOS Safari one-sample dummy buffer unlock
        try {
          const buf = ctx.createBuffer(1, 1, 22050);
          const src = ctx.createBufferSource();
          src.buffer = buf;
          src.connect(ctx.destination);
          src.start(0);
        } catch (e) {}
      }
      if (mediaSessionKeeper) {
        mediaSessionKeeper.volume = 0.05;
        mediaSessionKeeper.play().catch(() => {});
      }
    } catch (e) {}
  }

  // Pre-unlock on first user interaction anywhere
  function handleGlobalUnlock() {
    unlockSafariAndTeslaAudio();
    if (!audio.isPlaying && !isStartingAudio) {
      unlockAndStartEngine();
    }
  }
  window.addEventListener('touchstart', handleGlobalUnlock, { once: true, passive: true });
  window.addEventListener('pointerdown', handleGlobalUnlock, { once: true, passive: true });
  window.addEventListener('click', handleGlobalUnlock, { once: true });

  // 1. ENGINE START / STOP BUTTON & AUTO-UNLOCK
  let isStartingAudio = false;
  async function unlockAndStartEngine() {
    if (audio.isPlaying || isStartingAudio) return;
    isStartingAudio = true;
    startBtn.textContent = 'ЗАПУСК...';
    startBtn.disabled = true;

    // Synchronously unlock audio before any async awaits
    unlockSafariAndTeslaAudio();

    try {
      if (presetSelect && presetSelect.value && audio.currentPresetId !== presetSelect.value) {
        await audio.setPreset(presetSelect.value);
      }
      await audio.start();
      initTeslaMediaSession();
      startBtn.textContent = '⏹ ЗАГЛУШИТЬ';
      startBtn.className = 'btn btn-danger';
      startBtn.disabled = false;
      requestScreenWakeLock();
      updateMediaSessionInfo();
      console.log('Engine successfully started!');
    } catch (err) {
      console.error('Audio start failed:', err);
      startBtn.textContent = 'START ENGINE';
      startBtn.className = 'btn btn-primary';
      startBtn.disabled = false;
    } finally {
      isStartingAudio = false;
    }
  }

  startBtn.addEventListener('click', async () => {
    unlockSafariAndTeslaAudio();
    if (!audio.isPlaying) {
      await unlockAndStartEngine();
    } else {
      audio.stop();
      releaseScreenWakeLock();
      updateMediaSessionInfo();
      startBtn.textContent = 'START ENGINE';
      startBtn.className = 'btn btn-primary';
    }
  });

  // Auto-start audio on first user touch/click on the pedal or action buttons
  function ensureAudioActive() {
    unlockSafariAndTeslaAudio();
    if (!audio.isPlaying) {
      unlockAndStartEngine();
    }
  }

  // 2. FULLSCREEN BUTTON (Tesla Browser fullscreen support)
  fullscreenBtn.addEventListener('click', () => {
    if (!document.fullscreenElement) {
      document.documentElement.requestFullscreen().catch(() => {});
      fullscreenBtn.textContent = '✕ Окно';
    } else {
      document.exitFullscreen().catch(() => {});
      fullscreenBtn.textContent = '⛶ Полный экран';
    }
  });

  // 3. TAB MODE SWITCHER
  tabBtns.forEach(btn => {
    btn.addEventListener('click', () => {
      tabBtns.forEach(b => b.classList.remove('active'));
      btn.classList.add('active');
      activeTab = btn.dataset.tab;

      if (activeTab === 'gps') {
        telemetry.start();
      } else if (activeTab === 'p2p') {
        openP2PModal();
      }
    });
  });

  // 4. GEAR SELECTOR (N / D / M)
  const shiftUpBtn = document.getElementById('shiftUpBtn');
  const shiftDownBtn = document.getElementById('shiftDownBtn');
  const gearNumBtns = document.querySelectorAll('.gear-num-btn');

  function switchToManualAndShift(action) {
    ensureAudioActive();
    audio.gearMode = 'M';
    gearBtns.forEach(b => b.classList.toggle('active', b.dataset.mode === 'M'));
    if (audio.dspEngine && audio.dspEngine.vehicle) {
      audio.dspEngine.vehicle.neutral = false;
      if (audio.dspEngine.vehicle.gear < 1) audio.dspEngine.vehicle.gear = 1;
    }
    if (action === 'up') {
      audio.shiftUp();
    } else if (action === 'down') {
      audio.shiftDown();
    } else if (typeof action === 'number') {
      audio.setGear(action);
    }
    showShiftNotification(`▲ ПЕРЕДАЧА ${audio.gear || 1}`);
  }

  if (shiftUpBtn) shiftUpBtn.addEventListener('click', () => switchToManualAndShift('up'));
  if (shiftDownBtn) shiftDownBtn.addEventListener('click', () => switchToManualAndShift('down'));

  gearNumBtns.forEach(btn => {
    btn.addEventListener('click', () => {
      const g = parseInt(btn.dataset.gear, 10);
      switchToManualAndShift(g);
    });
  });

  gearBtns.forEach(btn => {
    btn.addEventListener('click', () => {
      gearBtns.forEach(b => b.classList.remove('active'));
      btn.classList.add('active');
      const mode = btn.dataset.mode;
      audio.gearMode = mode;
      if (mode === 'N') {
        audio.gear = 0;
        if (audio.dspEngine && audio.dspEngine.vehicle) {
          audio.dspEngine.vehicle.neutral = true;
          audio.dspEngine.vehicle.holdSpeed = 0;
        }
      } else if (mode === 'M') {
        if (audio.gear === 0) audio.gear = 1;
        if (audio.dspEngine && audio.dspEngine.vehicle) {
          audio.dspEngine.vehicle.neutral = false;
          if (audio.dspEngine.vehicle.gear < 1) audio.dspEngine.vehicle.gear = 1;
        }
      } else {
        // D (Auto)
        if (audio.gear === 0) audio.gear = 1;
        if (audio.dspEngine && audio.dspEngine.vehicle) {
          audio.dspEngine.vehicle.neutral = false;
          if (audio.dspEngine.vehicle.gear < 1) audio.dspEngine.vehicle.gear = 1;
        }
      }
    });
  });

  // 5. INTERACTIVE DUAL SPORTS PEDALS (Continuous Pressure & 3D Tilt Dragging)
  function setPedalPressure(val) {
    ensureAudioActive();
    pedalThrottle = Math.max(0, Math.min(1, val));
    audio.targetThrottle = pedalThrottle;
    audio.isThrottleHold = isThrottleHold;

    const pct = Math.round(pedalThrottle * 100);
    if (pedalPercent) pedalPercent.textContent = `${pct}%`;
    if (pedalFill) pedalFill.style.width = `${pct}%`;

    if (pedalPlate) {
      const angle = 15 + pedalThrottle * 18;
      const transY = pedalThrottle * 14;
      const transZ = 10 - pedalThrottle * 25;
      pedalPlate.style.transform = `rotateX(${angle}deg) translateY(${transY}px) translateZ(${transZ}px)`;
      pedalPlate.style.boxShadow = `0 ${Math.max(4, 12 - pedalThrottle * 8)}px 20px rgba(0,0,0,0.8), 0 0 ${pedalThrottle * 25}px rgba(255, 153, 0, 0.7)`;
    }
    if (pedalFrame) {
      pedalFrame.classList.toggle('active', pedalThrottle > 0.05);
    }
  }

  // Global helper to stop/cancel any active automated pedal sequence
  function stopAllActionModes() {
    if (isThrottleHold) {
      isThrottleHold = false;
      audio.isThrottleHold = false;
      if (holdThrottleBtn) {
        holdThrottleBtn.classList.remove('active');
        holdThrottleBtn.innerHTML = '🔒 Круиз';
      }
    }

    if (isLaunchControl) {
      isLaunchControl = false;
      if (launchTimer1) { clearTimeout(launchTimer1); launchTimer1 = null; }
      if (launchTimer2) { clearTimeout(launchTimer2); launchTimer2 = null; }
      if (launchBtn) {
        launchBtn.classList.remove('active');
        launchBtn.innerHTML = '🚀 Launch';
      }
    }

    if (isBlipping) {
      isBlipping = false;
      if (blipTimeout) { clearTimeout(blipTimeout); blipTimeout = null; }
      if (blipBtn) {
        blipBtn.classList.remove('active');
        blipBtn.innerHTML = '💥 Перегазовка';
      }
    }

    setPedalPressure(0);
  }

  function setBrakePressure(val) {
    ensureAudioActive();
    brakePressure = Math.max(0, Math.min(1, val));
    audio.brakePressure = brakePressure;
    audio.isBrakePressed = brakePressure > 0.05;

    // Pressing brake immediately disengages Cruise, Launch Control, and Blip
    if (brakePressure > 0.08) {
      if (isThrottleHold || isLaunchControl || isBlipping) {
        stopAllActionModes();
      }
    }

    const pct = Math.round(brakePressure * 100);
    if (brakePercent) brakePercent.textContent = `${pct}%`;
    if (brakeFill) brakeFill.style.width = `${pct}%`;

    if (brakePlate) {
      const angle = 15 + brakePressure * 16;
      const transY = brakePressure * 12;
      const transZ = 10 - brakePressure * 22;
      brakePlate.style.transform = `rotateX(${angle}deg) translateY(${transY}px) translateZ(${transZ}px)`;
      brakePlate.style.boxShadow = `0 ${Math.max(4, 12 - brakePressure * 8)}px 20px rgba(0,0,0,0.8), 0 0 ${brakePressure * 25}px rgba(255, 59, 48, 0.8)`;
    }
    if (brakeFrame) {
      brakeFrame.classList.toggle('active', brakePressure > 0.05);
    }
  }

  // Pointer drag for Gas Pedal
  function handleGasPointer(e) {
    if (!pedalFrame) return;
    const rect = pedalFrame.getBoundingClientRect();
    const clientY = e.clientY || (e.touches && e.touches[0].clientY);
    if (clientY === undefined) return;

    // Bottom is 100%, top is 0%
    const relativeY = clientY - rect.top;
    const progress = Math.max(0, Math.min(1, relativeY / rect.height));
    setPedalPressure(Math.pow(progress, 0.92));
  }

  if (pedalFrame) {
    pedalFrame.addEventListener('pointerdown', (e) => {
      isPedalPressed = true;
      try { pedalFrame.setPointerCapture(e.pointerId); } catch (err) {}
      handleGasPointer(e);
    });

    pedalFrame.addEventListener('pointermove', (e) => {
      if (isPedalPressed) {
        handleGasPointer(e);
      }
    });

    const releaseGas = () => {
      if (isPedalPressed) {
        isPedalPressed = false;
        if (!isThrottleHold && !isLaunchControl && !isBlipping) {
          setPedalPressure(0);
        }
      }
    };
    pedalFrame.addEventListener('pointerup', releaseGas);
    pedalFrame.addEventListener('pointercancel', releaseGas);

    // Explicit touch fallback
    pedalFrame.addEventListener('touchstart', (e) => {
      e.preventDefault();
      isPedalPressed = true;
      handleGasPointer(e);
    }, { passive: false });
    pedalFrame.addEventListener('touchmove', (e) => {
      e.preventDefault();
      if (isPedalPressed) handleGasPointer(e);
    }, { passive: false });
    pedalFrame.addEventListener('touchend', releaseGas);
  }

  // Pointer drag for Brake Pedal
  function handleBrakePointer(e) {
    if (!brakeFrame) return;
    const rect = brakeFrame.getBoundingClientRect();
    const clientY = e.clientY || (e.touches && e.touches[0].clientY);
    if (clientY === undefined) return;

    const relativeY = clientY - rect.top;
    const progress = Math.max(0, Math.min(1, relativeY / rect.height));
    setBrakePressure(Math.pow(progress, 0.95));
  }

  if (brakeFrame) {
    brakeFrame.addEventListener('pointerdown', (e) => {
      isBrakePressed = true;
      try { brakeFrame.setPointerCapture(e.pointerId); } catch (err) {}
      handleBrakePointer(e);
    });

    brakeFrame.addEventListener('pointermove', (e) => {
      if (isBrakePressed) {
        handleBrakePointer(e);
      }
    });

    const releaseBrake = () => {
      if (isBrakePressed) {
        isBrakePressed = false;
        setBrakePressure(0);
      }
    };
    brakeFrame.addEventListener('pointerup', releaseBrake);
    brakeFrame.addEventListener('pointercancel', releaseBrake);

    // Explicit touch fallback
    brakeFrame.addEventListener('touchstart', (e) => {
      e.preventDefault();
      isBrakePressed = true;
      handleBrakePointer(e);
    }, { passive: false });
    brakeFrame.addEventListener('touchmove', (e) => {
      e.preventDefault();
      if (isBrakePressed) handleBrakePointer(e);
    }, { passive: false });
    brakeFrame.addEventListener('touchend', releaseBrake);
  }

  // Throttle Hold / Cruise Toggle Button (Cancellable)
  if (holdThrottleBtn) {
    holdThrottleBtn.addEventListener('click', () => {
      if (isThrottleHold) {
        // Toggle OFF
        stopAllActionModes();
      } else {
        // Toggle ON
        stopAllActionModes();
        ensureAudioActive();
        isThrottleHold = true;
        audio.isThrottleHold = true;
        holdThrottleBtn.classList.add('active');
        holdThrottleBtn.innerHTML = '⏹ Стоп';
        setPedalPressure(0.48); // engage comfortable 48% cruising throttle
      }
    });
  }

  // Quick Action Buttons (Cancellable)
  if (blipBtn) {
    blipBtn.addEventListener('click', () => {
      if (isBlipping) {
        // Stop blip
        stopAllActionModes();
        return;
      }

      stopAllActionModes();
      ensureAudioActive();
      isBlipping = true;
      blipBtn.classList.add('active');
      blipBtn.innerHTML = '⏹ Стоп';

      setPedalPressure(0.9);

      blipTimeout = setTimeout(() => {
        if (isBlipping) {
          isBlipping = false;
          blipBtn.classList.remove('active');
          blipBtn.innerHTML = '💥 Перегазовка';
          setPedalPressure(0);
        }
      }, 360);
    });
  }

  if (launchBtn) {
    launchBtn.addEventListener('click', () => {
      if (isLaunchControl) {
        // Cancel/Abort launch immediately
        stopAllActionModes();
        return;
      }

      stopAllActionModes();
      ensureAudioActive();
      isLaunchControl = true;
      launchBtn.classList.add('active');
      launchBtn.innerHTML = '⏹ Стоп';

      audio.gear = 1;
      audio.gearMode = 'A';
      gearBtns.forEach(b => b.classList.toggle('active', b.dataset.mode === 'A'));

      // Hold launch RPM
      setPedalPressure(0.55);

      launchTimer1 = setTimeout(() => {
        if (!isLaunchControl) return;
        launchBtn.innerHTML = '🔥 GO!';
        setPedalPressure(1.0);
        if (audio.triggerRandomPop) audio.triggerRandomPop(1.0);

        launchTimer2 = setTimeout(() => {
          if (isLaunchControl) {
            stopAllActionModes();
          }
        }, 2200);
      }, 1800);
    });
  }

  // 6. KEYBOARD HOTKEYS (Proportional Response)
  let keyThrottleInterval = null;
  let keyBrakeInterval = null;

  window.addEventListener('keydown', (e) => {
    if (e.target.tagName === 'INPUT') return;
    if (e.code === 'Space' || e.code === 'KeyW' || e.code === 'ArrowUp') {
      e.preventDefault();
      ensureAudioActive();
      if (!keyThrottleInterval) {
        setPedalPressure(Math.max(pedalThrottle, 0.25));
        keyThrottleInterval = setInterval(() => {
          setPedalPressure(Math.min(1.0, pedalThrottle + 0.12));
        }, 35);
      }
    } else if (e.code === 'KeyS' || e.code === 'ArrowDown') {
      e.preventDefault();
      ensureAudioActive();
      stopAllActionModes();
      if (!keyBrakeInterval) {
        setBrakePressure(Math.max(brakePressure, 0.3));
        keyBrakeInterval = setInterval(() => {
          setBrakePressure(Math.min(1.0, brakePressure + 0.15));
        }, 35);
      }
    } else if (e.code === 'KeyE') {
      audio.gearMode = 'M';
      gearBtns.forEach(b => b.classList.toggle('active', b.dataset.mode === 'M'));
      audio.shiftUp();
      showShiftNotification(`▲ ПЕРЕДАЧА ${audio.gear || 1} (+)`);
    } else if (e.code === 'KeyQ') {
      audio.gearMode = 'M';
      gearBtns.forEach(b => b.classList.toggle('active', b.dataset.mode === 'M'));
      audio.shiftDown();
      showShiftNotification(`▼ ПЕРЕДАЧА ${audio.gear || 1} (-)`);
    }
  });

  window.addEventListener('keyup', (e) => {
    if (e.code === 'Space' || e.code === 'KeyW' || e.code === 'ArrowUp') {
      if (keyThrottleInterval) {
        clearInterval(keyThrottleInterval);
        keyThrottleInterval = null;
      }
      if (!isThrottleHold) setPedalPressure(0);
    } else if (e.code === 'KeyS' || e.code === 'ArrowDown') {
      if (keyBrakeInterval) {
        clearInterval(keyBrakeInterval);
        keyBrakeInterval = null;
      }
      setBrakePressure(0);
    }
  });

  // 7. TELEMETRY & GPS UPDATES
  function handleTelemetryUpdate(data) {
    hudSpeed.textContent = `${data.speed} км/ч`;
    hudAccel.textContent = `${data.acceleration > 0 ? '+' : ''}${data.acceleration} м/с²`;
    hudGForce.textContent = `${data.gForce} G`;
    hudAccuracy.textContent = data.accuracy ? `±${data.accuracy} м` : '–';
    hudRate.textContent = data.hz > 0 ? `${data.hz} Гц` : 'GPS 1 Гц';
    if (data.latitude) {
      hudCoords.textContent = `${data.latitude.toFixed(4)}, ${data.longitude.toFixed(4)}`;
    }

    // Move G-ball
    const maxG = 1.2;
    const clampedG = Math.max(-maxG, Math.min(maxG, data.gForce));
    const ballY = 50 - (clampedG / maxG) * 45; // Forward is up
    gDot.style.top = `${ballY}%`;

    // Feed into sound engine if GPS mode active
    if (activeTab === 'gps') {
      audio.applyTelemetry(data);
    }

    // If phone client, stream to Tesla host via P2P WebRTC
    if (p2p.role === 'client' && p2p.isConnected) {
      p2p.sendTelemetry(data);
    }
  }

  function handleRemoteTelemetry(data) {
    // Received telemetry from connected smartphone
    handleTelemetryUpdate(data);
    audio.applyTelemetry(data);
  }

  function handleTelemetryError(err) {
    if (hudAccuracy) hudAccuracy.textContent = 'Ожидание';
    if (hudCoords) {
      if (err.message && err.message.includes('запретил')) {
        hudCoords.textContent = 'Геопозиция запрещена (Нажмите «Разрешить» в строке браузера)';
      } else {
        hudCoords.textContent = 'Поиск спутников GPS... Выезжайте из подземной парковки';
      }
    }
    console.warn('Telemetry error:', err.message);
  }

  // 8. P2P MODAL & PAIRING LOGIC
  function openP2PModal() {
    p2pModal.classList.add('open');
    if (!p2p.peer) {
      p2p.initHost();
    }
  }

  p2pModalBtn.addEventListener('click', openP2PModal);
  closeModalBtn.addEventListener('click', () => p2pModal.classList.remove('open'));

  connectPhoneBtn.addEventListener('click', () => {
    const code = phoneCodeInput.value.trim();
    if (code) {
      p2p.initClient(code);
      telemetry.start();
      p2pModal.classList.remove('open');
    }
  });

  function handleP2PStatus(info) {
    const statusEl = document.getElementById('p2pStatus');
    const codeBox = document.getElementById('p2pCodeDisplay');

    if (info.code && codeBox) {
      codeBox.textContent = info.code;
      // Generate QR code for smartphone
      const qrEl = document.getElementById('qrcode');
      if (qrEl && window.QRCode) {
        qrEl.innerHTML = '';
        const currentUrl = window.location.origin + window.location.pathname;
        const connectUrl = `${currentUrl}?role=phone&code=${info.code}`;
        new QRCode(qrEl, {
          text: connectUrl,
          width: 156,
          height: 156,
          colorDark: '#000000',
          colorLight: '#ffffff',
          correctLevel: QRCode.CorrectLevel.M
        });
      }
    }

    if (info.message && statusEl) {
      statusEl.textContent = info.message;
    }

    if (info.status === 'connected') {
      p2pModalBtn.textContent = `📲 Линк активен (${info.latency || 10}мс)`;
      p2pModalBtn.classList.add('btn-primary');
    }
  }

  // Auto-connect if URL params contains ?role=phone&code=XXXX
  const urlParams = new URLSearchParams(window.location.search);
  if (urlParams.get('role') === 'phone' && urlParams.get('code')) {
    const code = urlParams.get('code');
    phoneCodeInput.value = code;
    p2p.initClient(code);
    telemetry.start();
    if (tabBtns[1]) tabBtns[1].click(); // switch to GPS tab
  }

  // 9. SHIFT LIGHTS CONTROLLER
  function updateShiftLights(rpm) {
    const rL = audio.redlineRpm || 8400;
    const greenThresh = rL * 0.76;
    const yellowThresh = rL * 0.88;
    const redThresh = rL * 0.96;

    shiftLeds.forEach((led, idx) => {
      const isGreen = led.classList.contains('green');
      const isYellow = led.classList.contains('yellow');
      const isRed = led.classList.contains('red');

      if (isGreen) {
        led.classList.toggle('active', rpm >= greenThresh + idx * ((yellowThresh - greenThresh) / 4));
      } else if (isYellow) {
        led.classList.toggle('active', rpm >= yellowThresh + (idx - 4) * ((redThresh - yellowThresh) / 4));
      } else if (isRed) {
        led.classList.toggle('active', rpm >= redThresh);
      }
    });
  }

  // 10. CANVAS TACHOMETER GAUGE RENDERER (60 FPS)
  function drawGauge(rpm) {
    // Strictly square dimensions for perfect circular dial
    const s = _canvasCssSide > 80 ? _canvasCssSide : 320;
    const cx = s / 2;
    const cy = s / 2;
    const radius = Math.max(30, s / 2 - 16);

    const rawMaxRpm = audio.maxRpm || 10000;
    const maxRpm = Math.max(7000, Math.ceil(rawMaxRpm / 1000) * 1000);
    const redlineRpm = audio.redlineRpm || 8400;

    ctx.clearRect(0, 0, s, s);

    const startAngle = 0.75 * Math.PI;
    const endAngle = 2.25 * Math.PI;
    const totalAngle = endAngle - startAngle;

    // Outer Bezel Ring
    ctx.beginPath();
    ctx.arc(cx, cy, radius, 0, Math.PI * 2);
    ctx.strokeStyle = 'rgba(255, 255, 255, 0.08)';
    ctx.lineWidth = 6;
    ctx.stroke();

    // Redline Arc
    const redlineClamped = Math.min(redlineRpm, maxRpm);
    const redlineStart = startAngle + (redlineClamped / maxRpm) * totalAngle;
    ctx.beginPath();
    ctx.arc(cx, cy, radius - 8, redlineStart, endAngle);
    ctx.strokeStyle = 'rgba(255, 34, 34, 0.8)';
    ctx.lineWidth = 8;
    ctx.stroke();

    // Minor & Major Ticks and numbers
    const numTicks = Math.round(maxRpm / 100);
    for (let i = 0; i <= numTicks; i++) {
      const tickRpm = i * 100;
      const angle = startAngle + (tickRpm / maxRpm) * totalAngle;
      const isMajor = i % 10 === 0;
      const isMedium = i % 5 === 0;

      const inner = isMajor ? radius - 24 : isMedium ? radius - 16 : radius - 10;
      const outer = radius - 6;

      ctx.beginPath();
      ctx.moveTo(cx + Math.cos(angle) * inner, cy + Math.sin(angle) * inner);
      ctx.lineTo(cx + Math.cos(angle) * outer, cy + Math.sin(angle) * outer);
      ctx.lineWidth = isMajor ? 3 : isMedium ? 2 : 1;
      ctx.strokeStyle = tickRpm >= redlineRpm ? '#ff2222' : isMajor ? '#ff9900' : 'rgba(255, 255, 255, 0.4)';
      ctx.stroke();

      if (isMajor) {
        const textRadius = radius - 40;
        const tx = cx + Math.cos(angle) * textRadius;
        const ty = cy + Math.sin(angle) * textRadius + 5;
        ctx.font = 'bold 16px -apple-system, sans-serif';
        ctx.fillStyle = tickRpm >= redlineRpm ? '#ff4444' : '#ff9900';
        ctx.textAlign = 'center';
        ctx.fillText(Math.round(i / 10), tx, ty);
      }
    }

    // Needle
    const needleRpm = Math.max(0, Math.min(maxRpm, rpm));
    const needleAngle = startAngle + (needleRpm / maxRpm) * totalAngle;

    ctx.save();
    ctx.shadowColor = needleRpm >= redlineRpm ? '#ff2222' : '#ff9900';
    ctx.shadowBlur = 14;
    ctx.beginPath();
    ctx.moveTo(cx - Math.cos(needleAngle + Math.PI / 2) * 4, cy - Math.sin(needleAngle + Math.PI / 2) * 4);
    ctx.lineTo(cx + Math.cos(needleAngle) * (radius - 12), cy + Math.sin(needleAngle) * (radius - 12));
    ctx.lineTo(cx + Math.cos(needleAngle + Math.PI / 2) * 4, cy + Math.sin(needleAngle + Math.PI / 2) * 4);
    ctx.fillStyle = needleRpm >= redlineRpm ? '#ff2222' : '#ff9900';
    ctx.fill();
    ctx.restore();

    // Center Hub Ring
    ctx.beginPath();
    ctx.arc(cx, cy, 54, 0, Math.PI * 2);
    ctx.fillStyle = '#0a0d14';
    ctx.fill();
    ctx.strokeStyle = 'rgba(255, 153, 0, 0.3)';
    ctx.lineWidth = 2;
    ctx.stroke();
  }

  // 12. TESLA STEERING WHEEL PADDLE SHIFT CONTROLLER
  const mediaSessionKeeper = document.getElementById('mediaSessionKeeper');
  const wheelShiftBadge = document.getElementById('wheelShiftBadge');
  let shiftBadgeTimeout = null;

  function showShiftNotification(text) {
    if (!wheelShiftBadge) return;
    wheelShiftBadge.textContent = text;
    wheelShiftBadge.classList.add('show');
    if (shiftBadgeTimeout) clearTimeout(shiftBadgeTimeout);
    shiftBadgeTimeout = setTimeout(() => {
      wheelShiftBadge.classList.remove('show');
    }, 700);
  }

  function handleSteeringWheelShiftUp() {
    ensureAudioActive();
    if (audio.gear === 0) {
      audio.gear = 1;
      audio.gearMode = 'M';
    } else {
      audio.gearMode = 'M';
      gearBtns.forEach(b => b.classList.toggle('active', b.dataset.mode === 'M'));
      audio.shiftUp();
    }
    showShiftNotification(`▲ ПЕРЕДАЧА ${audio.gear} (+)`);
  }

  function handleSteeringWheelShiftDown() {
    ensureAudioActive();
    audio.gearMode = 'M';
    gearBtns.forEach(b => b.classList.toggle('active', b.dataset.mode === 'M'));
    audio.shiftDown();
    showShiftNotification(`▼ ПЕРЕДАЧА ${audio.gear} (-)`);
  }

  // Synchronize lock-screen / Bluetooth metadata with current car preset
  function updateMediaSessionInfo() {
    if ('mediaSession' in navigator) {
      try {
        let carName = 'Tesla V10 Sound Simulator';
        if (currentEngineMode === 'dsp' && audio.dspEngine && audio.dspEngine.car) {
          carName = audio.dspEngine.car.name;
        } else if (audio.currentPreset && audio.currentPreset.name) {
          carName = audio.currentPreset.name;
        } else if (presetSelect && presetSelect.options[presetSelect.selectedIndex]) {
          carName = presetSelect.options[presetSelect.selectedIndex].textContent;
        }

        navigator.mediaSession.metadata = new MediaMetadata({
          title: `${carName} 🏎️`,
          artist: 'Tesla Sound Simulator • GPS & Звук в фоне',
          album: 'Фоновый режим активен: звук и GPS работают при блокировке экрана'
        });
        navigator.mediaSession.playbackState = audio.isPlaying ? 'playing' : 'paused';
      } catch (err) {}
    }
  }

  // Register MediaSession hardware button handlers (Left scroll wheel on Tesla steering wheel)
  function initTeslaMediaSession() {
    updateMediaSessionInfo();

    if ('mediaSession' in navigator) {
      try {
        // 1. Tilt Left Wheel RIGHT -> Shift UP
        navigator.mediaSession.setActionHandler('nexttrack', () => {
          handleSteeringWheelShiftUp();
        });

        // 2. Tilt Left Wheel LEFT -> Shift DOWN
        navigator.mediaSession.setActionHandler('previoustrack', () => {
          handleSteeringWheelShiftDown();
        });

        // 3. Play / Pause handlers from Lock Screen or Tesla steering wheel
        navigator.mediaSession.setActionHandler('play', () => {
          ensureAudioActive();
          if (mediaSessionKeeper) mediaSessionKeeper.play().catch(() => {});
          updateMediaSessionInfo();
        });
        navigator.mediaSession.setActionHandler('pause', () => {
          if (audio.isPlaying) {
            audio.stop();
            startBtn.textContent = 'START ENGINE';
            startBtn.className = 'btn btn-primary';
          }
          if (mediaSessionKeeper) mediaSessionKeeper.pause();
          updateMediaSessionInfo();
        });

        // 4. Seek buttons if fired
        navigator.mediaSession.setActionHandler('seekforward', () => {
          handleSteeringWheelShiftUp();
        });
        navigator.mediaSession.setActionHandler('seekbackward', () => {
          handleSteeringWheelShiftDown();
        });
      } catch (err) {
        console.warn('MediaSession handler warning:', err);
      }
    }

    // Play background keeper audio to maintain iOS audio session in background
    if (mediaSessionKeeper) {
      mediaSessionKeeper.volume = 0.05;
      mediaSessionKeeper.play().catch(() => {});
    }
  }

  // 14. SCREEN WAKE LOCK API (Prevents phone from auto-sleeping while driving in car)
  let wakeLockObj = null;
  async function requestScreenWakeLock() {
    if ('wakeLock' in navigator && document.visibilityState === 'visible') {
      try {
        wakeLockObj = await navigator.wakeLock.request('screen');
        wakeLockObj.addEventListener('release', () => {
          wakeLockObj = null;
        });
        console.log('Screen Wake Lock acquired: phone will stay on while driving.');
      } catch (err) {
        console.warn('Wake Lock warning:', err);
      }
    }
  }

  function releaseScreenWakeLock() {
    if (wakeLockObj) {
      wakeLockObj.release().catch(() => {});
      wakeLockObj = null;
    }
  }

  // 15. BACKGROUND RUNNER FOR LOCKED DEVICE (Keeps AudioContext & GPS transmission alive)
  let backgroundInterval = null;
  function startBackgroundRunner() {
    if (backgroundInterval) return;
    if (mediaSessionKeeper && audio && audio.isPlaying) {
      mediaSessionKeeper.play().catch(() => {});
    }
    updateMediaSessionInfo();

    let lastBgTick = performance.now();
    backgroundInterval = setInterval(() => {
      const now = performance.now();
      const dt = Math.min(0.1, (now - lastBgTick) / 1000.0);
      lastBgTick = now;

      // Ensure Web Audio context remains running and un-suspended when phone is locked
      if (audio && audio.isPlaying) {
        if (audio.ctx && audio.ctx.state === 'suspended') {
          audio.ctx.resume().catch(() => {});
        }
        audio.updatePhysics(dt, activeTab);
      }
    }, 33); // 30 Hz background physics ticker while screen is off
  }

  function stopBackgroundRunner() {
    if (backgroundInterval) {
      clearInterval(backgroundInterval);
      backgroundInterval = null;
    }
    lastFrameTime = performance.now();
  }

  document.addEventListener('visibilitychange', () => {
    if (document.hidden) {
      // Screen locked or tab backgrounded: run background ticker to keep physics and GPS active
      startBackgroundRunner();
    } else {
      // Screen unlocked: resume smooth 60 FPS rAF loop and re-acquire screen wake lock
      stopBackgroundRunner();
      if (audio && audio.isPlaying) {
        requestScreenWakeLock();
      }
    }
  });

  if (mediaSessionKeeper) {
    mediaSessionKeeper.addEventListener('pause', () => {
      if (audio && audio.isPlaying) {
        mediaSessionKeeper.play().catch(() => {});
      }
    });
  }

  // Intercept physical hardware media keys from Tesla steering wheel
  // NOTE: Volume Up/Down (vertical roll) is NOT intercepted so you can always adjust Tesla volume normally!
  window.addEventListener('keydown', (e) => {
    // Left wheel TILT RIGHT (Next Track) -> Shift UP
    if (e.key === 'MediaTrackNext' || e.code === 'MediaTrackNext' || e.keyCode === 176) {
      e.preventDefault();
      handleSteeringWheelShiftUp();
    }
    // Left wheel TILT LEFT (Previous Track) -> Shift DOWN
    else if (e.key === 'MediaTrackPrevious' || e.code === 'MediaTrackPrevious' || e.keyCode === 177) {
      e.preventDefault();
      handleSteeringWheelShiftDown();
    }
  });

  // 13. MAIN ANIMATION LOOP (60 FPS)
  function loop(currentTime) {
    const dt = Math.min(0.1, (currentTime - lastFrameTime) / 1000.0);
    lastFrameTime = currentTime;

    // Run sound physics step
    audio.updatePhysics(dt, activeTab);

    // Update Digital Displays
    const currentRpm = Math.round(audio.rpm);
    rpmNumeric.textContent = `${currentRpm} RPM`;

    let gearText = 'N';
    if (audio.gearMode === 'N' || audio.gear === 0) {
      gearText = 'N';
    } else if (audio.gearMode === 'M') {
      gearText = `M${audio.gear || 1}`;
    } else {
      gearText = (audio.gear || 1).toString();
    }
    gearDisplay.textContent = gearText;
    speedDisplay.textContent = Math.round(audio.speed);

    // Highlight active gear pill
    const curG = audio.gear || 0;
    gearNumBtns.forEach(b => {
      const g = parseInt(b.dataset.gear, 10);
      b.classList.toggle('active', g === curG && audio.gearMode !== 'N');
    });

    // Render Canvas & Shift Lights
    try {
      drawGauge(currentRpm);
    } catch (err) {
      console.warn('drawGauge error:', err);
    }
    updateShiftLights(currentRpm);

    animationFrameId = requestAnimationFrame(loop);
  }

  animationFrameId = requestAnimationFrame(loop);
});
