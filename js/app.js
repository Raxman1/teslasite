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

  // Quick Sound Controls Bar (Always Visible in Header)
  const quickBassSlider = document.getElementById('quickBassSlider');
  const quickBassText = document.getElementById('quickBassText');
  const quickExhaustSlider = document.getElementById('quickExhaustSlider');
  const quickExhaustText = document.getElementById('quickExhaustText');

  function updateAllBassSliders(val) {
    if (quickBassSlider) quickBassSlider.value = val;
    if (quickBassText) quickBassText.textContent = `${val}%`;
    const classicBassSlider = document.getElementById('classicBassSlider');
    const classicBassLevelText = document.getElementById('classicBassLevelText');
    const bassSlider = document.getElementById('bassSlider');
    const bassLevelText = document.getElementById('bassLevelText');
    if (classicBassSlider) classicBassSlider.value = val;
    if (classicBassLevelText) classicBassLevelText.textContent = `${val}%`;
    if (bassSlider) bassSlider.value = val;
    if (bassLevelText) bassLevelText.textContent = `${val}%`;
    audio.setSubwooferBoost(val / 100.0);
  }

  function updateAllExhaustSliders(val) {
    if (quickExhaustSlider) quickExhaustSlider.value = val;
    if (quickExhaustText) quickExhaustText.textContent = `${val}%`;
    const exhaustSlider = document.getElementById('exhaustSlider');
    const exhaustLevelText = document.getElementById('exhaustLevelText');
    if (exhaustSlider) exhaustSlider.value = val;
    if (exhaustLevelText) exhaustLevelText.textContent = `${val}%`;
    audio.setExhaustVolume(val / 100.0);
  }

  if (quickBassSlider) {
    quickBassSlider.addEventListener('input', (e) => {
      updateAllBassSliders(parseInt(e.target.value, 10));
    });
  }

  if (quickExhaustSlider) {
    quickExhaustSlider.addEventListener('input', (e) => {
      updateAllExhaustSliders(parseInt(e.target.value, 10));
    });
  }

  // Unified Dynamic RPM & Shift Profile Modes
  // Mode 1: ⚙️ Обороты: Обычные (1x) — 20 км/ч = ~2,000 RPM, ранние плавные переключения (Comfort)
  // Mode 2: 🔥 Обороты: СПОРТ (2x)   — 20 км/ч = ~4,000 RPM, держит высокие передачи, сочный бас (Sport)
  // Mode 3: ⚡ Обороты: ТРЕК (3x)    — 20 км/ч = ~6,000 RPM, максимальная спортивная динамика (Race)
  const shiftProfileBtn = document.getElementById('shiftProfileBtn');
  const headerRpmMultBtn = document.getElementById('headerRpmMultBtn');
  const rpmMultiplierBtn = document.getElementById('rpmMultiplierBtn');

  const RPM_MODES = [
    { mult: 1.0, profile: 'comfort', i18nKey: 'rpm_profile_1x', label: '⚙️ Обороты: Обычные (1x)', notifyKey: 'rpm_notify_1x', notify: '⚙️ Обычные обороты (1x: D — 20 км/ч = 2k RPM)', cls: 'comfort' },
    { mult: 2.0, profile: 'sport',   i18nKey: 'rpm_profile_2x', label: '🔥 Обороты: СПОРТ (2x)',   notifyKey: 'rpm_notify_2x', notify: '🔥 СПОРТ: Повышенные (2x: S — 20 км/ч = 4,000 RPM)', cls: 'sport' },
    { mult: 3.0, profile: 'sport',   i18nKey: 'rpm_profile_3x', label: '⚡ Обороты: ТРЕК (3x)',    notifyKey: 'rpm_notify_3x', notify: '⚡ ТРЕК: Экстрим (3x: Race — 20 км/ч = 6,000 RPM)', cls: 'extreme' }
  ];

  let currentRpmModeIdx = 0;
  try {
    const savedMult = parseFloat(localStorage.getItem('tesla_rpm_multiplier')) || 1.0;
    const foundIdx = RPM_MODES.findIndex(m => Math.abs(m.mult - savedMult) < 0.2);
    if (foundIdx >= 0) currentRpmModeIdx = foundIdx;
  } catch (e) {}

  function applyRpmMode(idx, broadcast = true, showToast = true) {
    currentRpmModeIdx = ((idx % RPM_MODES.length) + RPM_MODES.length) % RPM_MODES.length;
    const mode = RPM_MODES[currentRpmModeIdx];

    try {
      localStorage.setItem('tesla_rpm_multiplier', mode.mult);
      localStorage.setItem('tesla_shift_profile', mode.profile);
      if (window.TeslaSettings) window.TeslaSettings.set('rpmProfile', currentRpmModeIdx);
    } catch (e) {}

    if (audio) {
      audio.setRpmMultiplier(mode.mult);
      audio.setShiftProfile(mode.profile);
    }

    if (shiftProfileBtn) {
      const t = (k, fb) => (window.i18n && window.i18n.t) ? window.i18n.t(k, fb) : fb;
      shiftProfileBtn.textContent = t(mode.i18nKey, mode.label);
      shiftProfileBtn.className = `btn-shift-profile ${mode.cls}`;
    }
    if (rpmMultiplierBtn) {
      const t = (k, fb) => (window.i18n && window.i18n.t) ? window.i18n.t(k, fb) : fb;
      rpmMultiplierBtn.textContent = `⚡ ${t('hud_dynamics_btn', 'Динамика')}: x${mode.mult}`;
      rpmMultiplierBtn.classList.toggle('boosted', mode.mult > 1.0);
    }
    if (headerRpmMultBtn) {
      headerRpmMultBtn.textContent = `⚡ x${mode.mult}`;
      headerRpmMultBtn.classList.toggle('boosted', mode.mult > 1.0);
    }

    if (showToast) {
      showShiftNotification(mode.notify);
    }

    if (broadcast && typeof p2p !== 'undefined' && p2p.isConnected) {
      p2p.sendRpmMultiplier(mode.mult);
      p2p.sendShiftProfile(mode.profile);
    }
  }

  function cycleRpmMode() {
    ensureAudioActive();
    applyRpmMode(currentRpmModeIdx + 1, true, true);
  }

  if (shiftProfileBtn) {
    shiftProfileBtn.addEventListener('click', cycleRpmMode);
  }

  window.syncShiftProfileFromP2p = (prof) => {
    const idx = (prof === 'sport') ? (currentRpmModeIdx === 0 ? 1 : currentRpmModeIdx) : 0;
    applyRpmMode(idx, false, false);
  };

  // ==============================================================
  // 1. CRACKLE / POPS & BANGS (Отстрелы выхлопа: 🔇 Тихо / 💥 Спорт / 🔥 Огонь)
  // ==============================================================
  const crackleQuickBtn = document.getElementById('crackleQuickBtn');
  const crackleQuietBtn = document.getElementById('crackleQuietBtn');
  const crackleSportBtn = document.getElementById('crackleSportBtn');
  const crackleFireBtn = document.getElementById('crackleFireBtn');

  const CRACKLE_MODES = [
    { id: 'quiet', i18nKey: 'crackle_quiet', label: '🔇 Тихо',  val: 0.0, btnText: '💥 Отстрелы: 🔇 Тихо',  notifyKey: 'crackle_quiet_notify', notify: '🔇 Выхлоп: Без отстрелов (Тихо)' },
    { id: 'sport', i18nKey: 'crackle_sport', label: '💥 Спорт', val: 0.75, btnText: '💥 Отстрелы: 💥 Спорт', notifyKey: 'crackle_sport_notify', notify: '💥 Выхлоп: Спортивные отстрелы' },
    { id: 'fire',  i18nKey: 'crackle_fire',  label: '🔥 Огонь', val: 1.5,  btnText: '💥 Отстрелы: 🔥 Огонь', notifyKey: 'crackle_fire_notify', notify: '🔥 Выхлоп: Антилаг и огонь' }
  ];

  let currentCrackleIdx = 1; // Default to Sport (0.75)
  try {
    const savedCrackle = localStorage.getItem('tesla_crackle_mode');
    if (savedCrackle) {
      const idx = CRACKLE_MODES.findIndex(m => m.id === savedCrackle);
      if (idx >= 0) currentCrackleIdx = idx;
    }
  } catch (e) {}

  function applyCrackleMode(idx, broadcast = true, showToast = false) {
    currentCrackleIdx = ((idx % CRACKLE_MODES.length) + CRACKLE_MODES.length) % CRACKLE_MODES.length;
    const mode = CRACKLE_MODES[currentCrackleIdx];

    try {
      localStorage.setItem('tesla_crackle_mode', mode.id);
      if (window.TeslaSettings) window.TeslaSettings.set('crackleMode', mode.id);
    } catch (e) {}

    if (audio) {
      if (audio.setPopsVolume) audio.setPopsVolume(mode.val);
      if (audio.dspEngine) audio.dspEngine.crackle = mode.val;
    }

    if (crackleQuickBtn) {
      const t = (k, fb) => (window.i18n && window.i18n.t) ? window.i18n.t(k, fb) : fb;
      crackleQuickBtn.textContent = t(mode.i18nKey, mode.btnText);
      crackleQuickBtn.classList.toggle('active', mode.id !== 'quiet');
    }

    if (crackleQuietBtn) crackleQuietBtn.classList.toggle('active', mode.id === 'quiet');
    if (crackleSportBtn) crackleSportBtn.classList.toggle('active', mode.id === 'sport');
    if (crackleFireBtn) crackleFireBtn.classList.toggle('active', mode.id === 'fire');

    const crackleSlider = document.getElementById('crackleSlider');
    const crackleValText = document.getElementById('crackleValText');
    if (crackleSlider) crackleSlider.value = Math.round(mode.val * 100);
    if (crackleValText) crackleValText.textContent = `${Math.round(mode.val * 100)}%`;

    if (showToast) {
      showShiftNotification(mode.notify);
    }

    if (broadcast && typeof p2p !== 'undefined' && p2p.isConnected && p2p.sendCustom) {
      p2p.sendCustom({ type: 'crackle_mode', mode: mode.id });
    }
  }

  if (crackleQuickBtn) {
    addTouchInstantListener(crackleQuickBtn, () => {
      ensureAudioActive();
      applyCrackleMode(currentCrackleIdx + 1, true, true);
    });
  }
  if (crackleQuietBtn) {
    addTouchInstantListener(crackleQuietBtn, () => { ensureAudioActive(); applyCrackleMode(0, true, true); });
  }
  if (crackleSportBtn) {
    addTouchInstantListener(crackleSportBtn, () => { ensureAudioActive(); applyCrackleMode(1, true, true); });
  }
  if (crackleFireBtn) {
    addTouchInstantListener(crackleFireBtn, () => { ensureAudioActive(); applyCrackleMode(2, true, true); });
  }

  // ==============================================================
  // 2. GPS THROTTLE SENSITIVITY (Чувствительность газа: Комфорт / Спорт / Мгновенно)
  // ==============================================================
  const sensComfortBtn = document.getElementById('sensComfortBtn');
  const sensSportBtn = document.getElementById('sensSportBtn');
  const sensInsaneBtn = document.getElementById('sensInsaneBtn');

  const SENS_MODES = [
    { id: 'comfort', intensity: 0.35, notify: '🚗 Газ: Комфорт (Городской плавный отклик)' },
    { id: 'sport',   intensity: 0.70, notify: '🏎️ Газ: Спорт (Динамичный отклик)' },
    { id: 'insane',  intensity: 1.00, notify: '⚡ Газ: Мгновенно (Максимальная тяга и рев)' }
  ];

  let currentSensId = 'sport';
  try {
    const savedSens = localStorage.getItem('tesla_gps_sensitivity');
    if (savedSens && SENS_MODES.some(m => m.id === savedSens)) {
      currentSensId = savedSens;
    }
  } catch (e) {}

  function applyGpsSensitivity(sensId, showToast = false) {
    currentSensId = sensId;
    try {
      localStorage.setItem('tesla_gps_sensitivity', sensId);
      if (window.TeslaSettings) window.TeslaSettings.set('throttleSens', sensId);
    } catch (e) {}

    const found = SENS_MODES.find(m => m.id === sensId) || SENS_MODES[1];
    if (audio) {
      if (audio.setGpsSensitivity) audio.setGpsSensitivity(found.intensity);
      if (audio.dspEngine) {
        audio.dspEngine.intensity = found.intensity;
        if (audio.dspEngine.vehicle) {
          audio.dspEngine.vehicle.intensity = found.intensity;
        }
      }
    }

    if (sensComfortBtn) sensComfortBtn.classList.toggle('active', sensId === 'comfort');
    if (sensSportBtn) sensSportBtn.classList.toggle('active', sensId === 'sport');
    if (sensInsaneBtn) sensInsaneBtn.classList.toggle('active', sensId === 'insane');

    if (showToast) {
      showShiftNotification(found.notify);
    }
  }

  if (sensComfortBtn) addTouchInstantListener(sensComfortBtn, () => applyGpsSensitivity('comfort', true));
  if (sensSportBtn) addTouchInstantListener(sensSportBtn, () => applyGpsSensitivity('sport', true));
  if (sensInsaneBtn) addTouchInstantListener(sensInsaneBtn, () => applyGpsSensitivity('insane', true));

  // ==============================================================
  // 3. GPS DEADZONE / TRAFFIC LIGHT FILTER (Стоп-фильтр на светофоре: 0 / 2 / 4 км/ч)
  // ==============================================================
  const deadzone0Btn = document.getElementById('deadzone0Btn');
  const deadzone2Btn = document.getElementById('deadzone2Btn');
  const deadzone4Btn = document.getElementById('deadzone4Btn');

  let gpsDeadzone = 4.0; // Default 4 km/h (устраняет дрейф на светофорах)
  try {
    const savedDz = parseFloat(localStorage.getItem('tesla_gps_deadzone'));
    if (!isNaN(savedDz)) gpsDeadzone = savedDz;
  } catch (e) {}

  function applyGpsDeadzone(val, showToast = false) {
    gpsDeadzone = Number(val);
    try {
      localStorage.setItem('tesla_gps_deadzone', gpsDeadzone);
    } catch (e) {}

    if (deadzone0Btn) deadzone0Btn.classList.toggle('active', gpsDeadzone === 0);
    if (deadzone2Btn) deadzone2Btn.classList.toggle('active', gpsDeadzone === 2);
    if (deadzone4Btn) deadzone4Btn.classList.toggle('active', gpsDeadzone === 4);

    if (showToast) {
      const msg = (gpsDeadzone === 0)
        ? '🛑 Стоп-фильтр: Выключен (0 км/ч)'
        : `🛑 Стоп-фильтр: ${gpsDeadzone} км/ч (чистый холостой на светофорах)`;
      showShiftNotification(msg);
    }
  }

  if (deadzone0Btn) addTouchInstantListener(deadzone0Btn, () => applyGpsDeadzone(0, true));
  if (deadzone2Btn) addTouchInstantListener(deadzone2Btn, () => applyGpsDeadzone(2, true));
  if (deadzone4Btn) addTouchInstantListener(deadzone4Btn, () => applyGpsDeadzone(4, true));

  // ==============================================================
  // 4. EXHAUST FLAPS / CHARACTER (Заслонки выхлопа: Заводской / Прямоток)
  // ==============================================================
  const exhaustQuietBtn = document.getElementById('exhaustQuietBtn');
  const exhaustOpenBtn = document.getElementById('exhaustOpenBtn');

  let currentExhaustMode = 'open'; // Default to open straight pipe
  try {
    const savedExhaust = localStorage.getItem('tesla_exhaust_character');
    if (savedExhaust === 'quiet' || savedExhaust === 'open') {
      currentExhaustMode = savedExhaust;
    }
  } catch (e) {}

  function applyExhaustMode(mode, showToast = false) {
    currentExhaustMode = mode;
    try {
      localStorage.setItem('tesla_exhaust_character', mode);
    } catch (e) {}

    const charVal = (mode === 'quiet') ? 0.45 : 0.85;
    if (audio) {
      if (audio.setCharacter) audio.setCharacter(charVal);
      if (audio.dspEngine) audio.dspEngine.character = charVal;
    }

    const characterSlider = document.getElementById('characterSlider');
    const characterValText = document.getElementById('characterValText');
    if (characterSlider) characterSlider.value = Math.round(charVal * 100);
    if (characterValText) characterValText.textContent = `${Math.round(charVal * 100)}%`;

    if (exhaustQuietBtn) exhaustQuietBtn.classList.toggle('active', mode === 'quiet');
    if (exhaustOpenBtn) exhaustOpenBtn.classList.toggle('active', mode === 'open');

    if (showToast) {
      const msg = (mode === 'quiet')
        ? '🤫 Заслонки: Заводской тихий глушитель'
        : '🏁 Заслонки: Спортивный басистый прямоток';
      showShiftNotification(msg);
    }
  }

  if (exhaustQuietBtn) addTouchInstantListener(exhaustQuietBtn, () => applyExhaustMode('quiet', true));
  if (exhaustOpenBtn) addTouchInstantListener(exhaustOpenBtn, () => applyExhaustMode('open', true));

  // ==============================================================
  // 5. COLLAPSIBLE TESLA CABIN ACOUSTICS PANEL
  // ==============================================================
  const teslaAcousticExpandBtn = document.getElementById('teslaAcousticExpandBtn');
  const teslaAcousticHeader = document.getElementById('teslaAcousticHeader');
  const teslaAcousticBody = document.getElementById('teslaAcousticBody');

  let isAcousticExpanded = false;
  function toggleAcousticDetails(e) {
    if (e && e.target && e.target.closest('#v6ToggleBtn')) return;
    isAcousticExpanded = !isAcousticExpanded;
    if (teslaAcousticBody) {
      teslaAcousticBody.style.display = isAcousticExpanded ? 'block' : 'none';
    }
    if (teslaAcousticExpandBtn) {
      const t = (k, fb) => (window.i18n && window.i18n.t) ? window.i18n.t(k, fb) : fb;
      teslaAcousticExpandBtn.textContent = isAcousticExpanded ? t('btn_settings_collapse', '⚙️ Свернуть ▲') : t('btn_settings_expand', '⚙️ Настройки ▼');
    }
  }

  if (teslaAcousticExpandBtn) {
    addTouchInstantListener(teslaAcousticExpandBtn, toggleAcousticDetails);
  }
  if (teslaAcousticHeader) {
    teslaAcousticHeader.addEventListener('click', (e) => {
      if (e.target !== teslaAcousticExpandBtn && !e.target.closest('#v6ToggleBtn')) {
        toggleAcousticDetails(e);
      }
    });
  }

  // Initialize all 4 driving settings states immediately on page load
  applyCrackleMode(currentCrackleIdx, false, false);
  applyGpsSensitivity(currentSensId, false);
  applyGpsDeadzone(gpsDeadzone, false);
  applyExhaustMode(currentExhaustMode, false);

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
    { id: 'dsp:cls63-amg', name: 'Mercedes CLS 63 AMG', badge: '5.5L BiTurbo V8 · 585 HP' },
    { id: 'dsp:g63-amg', name: 'Mercedes-AMG G 63', badge: '4.0L V8 · Side Pipes' },
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
    const dashBrandTitle = document.getElementById('dashBrandTitle');
    const dashBrandBadge = document.getElementById('dashBrandBadge');
    if (dashBrandTitle) dashBrandTitle.textContent = name;
    if (dashBrandBadge) dashBrandBadge.textContent = badge;
  }

  function populatePresetDropdown() {
    if (!presetSelect) return;
    presetSelect.innerHTML = '';
    DSP_PRESETS.forEach(item => {
      const opt = document.createElement('option');
      opt.value = item.id;
      opt.textContent = `${item.name} (${item.badge})`;
      presetSelect.appendChild(opt);
    });
    const first = DSP_PRESETS[0];
    presetSelect.value = first.id;
    updateBrandDisplay(first.name, first.badge);
    if (dspTuningBox) {
      dspTuningBox.style.display = 'block';
    }
    if (audio) {
      audio.setPreset(first.id).catch(() => {});
    }
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
      const t = (k, fb) => (window.i18n && window.i18n.t) ? window.i18n.t(k, fb) : fb;
      toggleAdvDspBtn.textContent = isOpen ? t('btn_options', '⚙️ Опции') : t('btn_hide', '✕ Скрыть');
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

  // -------------------------------------------------------------
  // Tesla Model 3 / Y Cabin Acoustic Controls & Spatial Fader
  // -------------------------------------------------------------
  const v6ToggleBtn = document.getElementById('v6ToggleBtn');
  const v6ToggleText = document.getElementById('v6ToggleText');
  const classicAcousticView = document.getElementById('classicAcousticView');
  const proAcousticView = document.getElementById('proAcousticView');
  const classicStageBtns = document.querySelectorAll('.classic-stage-btn');
  const stageBtns = document.querySelectorAll('#proAcousticView .stage-btn');
  const classicBassSlider = document.getElementById('classicBassSlider');
  const classicBassLevelText = document.getElementById('classicBassLevelText');

  let isV6ProEnabled = true;
  // Restore saved preference if any
  try {
    const savedV6 = localStorage.getItem('tesla_v6_pro_enabled');
    if (savedV6 === '0') {
      isV6ProEnabled = false;
    }
  } catch (e) {}

  function syncSoundstageButtons(stage) {
    if (classicStageBtns) {
      classicStageBtns.forEach(btn => {
        btn.classList.toggle('active', btn.dataset.stage === stage);
      });
    }
    if (stageBtns) {
      stageBtns.forEach(btn => {
        btn.classList.toggle('active', btn.dataset.stage === stage);
      });
    }
  }

  function setV6ProState(enabled, applyAudio = true) {
    isV6ProEnabled = enabled;
    try {
      localStorage.setItem('tesla_v6_pro_enabled', enabled ? '1' : '0');
    } catch (e) {}

    if (v6ToggleBtn) {
      v6ToggleBtn.classList.toggle('off', !enabled);
    }
    if (v6ToggleText) {
      const t = (k, fb) => (window.i18n && window.i18n.t) ? window.i18n.t(k, fb) : fb;
      const state = enabled ? t('state_on', 'ВКЛ') : t('state_off', 'ВЫКЛ');
      v6ToggleText.textContent = `⚡ v6.0 ${t('pro_label', 'PRO')}: ${state}`;
    }
    if (classicAcousticView) {
      classicAcousticView.style.display = enabled ? 'none' : 'block';
    }
    if (proAcousticView) {
      proAcousticView.style.display = enabled ? 'block' : 'none';
    }

    // Switch AudioEngine processing mode (disables EQ and delay when false)
    if (applyAudio && audio) {
      audio.setV6ProEnabled(enabled);
    }

    if (enabled) {
      syncAcousticUIToAudio();
    } else {
      syncSoundstageButtons(audio.soundstageMode || 'tesla_mid');
    }
  }

  if (v6ToggleBtn) {
    v6ToggleBtn.addEventListener('click', () => {
      setV6ProState(!isV6ProEnabled);
      showShiftNotification(isV6ProEnabled ? '⚡ v6.0 PRO: 3D Сцена активна' : '🔓 100% Открытый звук (БЕЗ компрессии)');
    });
  }

  // Bind Classic View (3 buttons & 1 bass slider)
  if (classicStageBtns) {
    classicStageBtns.forEach(btn => {
      btn.addEventListener('click', () => {
        const stage = btn.dataset.stage;
        audio.setTeslaSoundstage(stage);
        syncSoundstageButtons(stage);
      });
    });
  }

  if (classicBassSlider) {
    classicBassSlider.addEventListener('input', (e) => {
      updateAllBassSliders(parseInt(e.target.value, 10));
    });
  }

  const teslaTrimSelect = document.getElementById('teslaTrimSelect');
  const teslaTrimBadge = document.getElementById('teslaTrimBadge');
  const teslaTrimDesc = document.getElementById('teslaTrimDesc');
  const subNodeText = document.getElementById('subNodeText');
  const bassSliderLabel = document.getElementById('bassSliderLabel');

  const TRIM_INFO = {
    m3_premium: {
      badge: '14 динамиков + Саб',
      desc: 'Long Range / Performance: Полный 3D-охват, твитеры в стойках и 8" сабвуфер в правом крыле багажника.',
      subLabel: '🔊 САБВУФЕР',
      bassSliderText: '🔊 Вибрация сабвуфера (Бас-шейкер)'
    },
    m3_standard: {
      badge: '7-9 колонок (Без саба)',
      desc: 'Standard Range / RWD: Твитеры отключены, сабвуфера нет. Активирован виртуальный сабвуфер — мощный панч 75 Гц через передние дверные мидбасы!',
      subLabel: '🚪 МИДБАС ДВЕРЕЙ',
      bassSliderText: '🔊 Виртуальный саб (Панч дверей)'
    },
    ms_plaid: {
      badge: '22 динамика · 960 Вт',
      desc: 'Tesla Model S / X Plaid: Флагманская 3D-сцена 170%, динамики в подголовниках и ультра-глубокий суб-бас 36 Гц.',
      subLabel: '👑 DUAL SUB 960W',
      bassSliderText: '🔊 Мощность сабвуфера Plaid (960 Вт)'
    },
    cybertruck: {
      badge: '15 динамиков · Cyber Audio',
      desc: 'Cybertruck: Брутальный звук, двойные сабвуферы под задними сиденьями и жесткий плотный бас 45 Гц.',
      subLabel: '📐 ПОД СИДЕНЬЯМИ',
      bassSliderText: '🔊 Сабвуферы Cybertruck (Под сиденьями)'
    },
    custom_stereo: {
      badge: 'Стерео Bluetooth',
      desc: 'Смартфон / Наушники / Другое авто: Балансировка под портативные динамики и стандартное стерео.',
      subLabel: '📱 СТЕРЕО',
      bassSliderText: '🔊 Басовый буст смартфона'
    }
  };

  if (teslaTrimSelect) {
    teslaTrimSelect.addEventListener('change', (e) => {
      const trimId = e.target.value;
      audio.setTeslaTrim(trimId);
      const info = TRIM_INFO[trimId] || TRIM_INFO.m3_premium;
      if (teslaTrimBadge) teslaTrimBadge.textContent = info.badge;
      if (teslaTrimDesc) teslaTrimDesc.textContent = info.desc;
      if (subNodeText) subNodeText.textContent = info.subLabel;
      if (bassSliderLabel) bassSliderLabel.textContent = info.bassSliderText;
      syncAcousticUIToAudio();
    });
  }
  const faderSlider = document.getElementById('faderSlider');
  const faderValText = document.getElementById('faderValText');
  const frontVolSlider = document.getElementById('frontVolSlider');
  const frontVolValText = document.getElementById('frontVolValText');
  const rearVolSlider = document.getElementById('rearVolSlider');
  const rearVolValText = document.getElementById('rearVolValText');
  const popsVolSlider = document.getElementById('popsVolSlider');
  const popsVolValText = document.getElementById('popsVolValText');
  const bassSlider = document.getElementById('bassSlider');
  const bassLevelText = document.getElementById('bassLevelText');
  const exhaustDelaySlider = document.getElementById('exhaustDelaySlider');
  const exhaustDelayValText = document.getElementById('exhaustDelayValText');
  const stereoWidthSlider = document.getElementById('stereoWidthSlider');
  const stereoWidthValText = document.getElementById('stereoWidthValText');
  const toggleSpatialAdvBtn = document.getElementById('toggleSpatialAdvBtn');
  const spatialAdvancedBox = document.getElementById('spatialAdvancedBox');
  const resetAcousticsBtn = document.getElementById('resetAcousticsBtn');

  // SVG Cabin Map Nodes
  const mapCenterOrb = document.getElementById('mapCenterOrb');
  const mapFrontAura = document.getElementById('mapFrontAura');
  const mapRearAura = document.getElementById('mapRearAura');
  const mapSubAura = document.getElementById('mapSubAura');

  function syncAcousticUIToAudio() {
    if (faderSlider) {
      const faderValInt = Math.round(audio.frontRearFader * 100);
      faderSlider.value = faderValInt;
      if (faderValText) {
        if (faderValInt === 0) faderValText.textContent = '50 / 50 (Центр)';
        else if (faderValInt < 0) faderValText.textContent = `Капот ${Math.abs(faderValInt)}%`;
        else faderValText.textContent = `Выхлоп ${faderValInt}%`;
      }
      if (mapCenterOrb) {
        const orbX = 170 + (audio.frontRearFader * 90);
        mapCenterOrb.setAttribute('cx', orbX);
      }
    }
    if (frontVolSlider && frontVolValText) {
      const frontPct = Math.round(audio.frontVolumeLevel * 100);
      frontVolSlider.value = frontPct;
      frontVolValText.textContent = `${frontPct}%`;
    }
    if (rearVolSlider && rearVolValText) {
      const rearPct = Math.round(audio.rearVolumeLevel * 100);
      rearVolSlider.value = rearPct;
      rearVolValText.textContent = `${rearPct}%`;
    }
    if (popsVolSlider && popsVolValText) {
      const popsPct = Math.round(audio.popsAggressiveness * 100);
      popsVolSlider.value = popsPct;
      popsVolValText.textContent = `${popsPct}%`;
    }
    if (bassSlider && bassLevelText) {
      const bassPct = Math.round(audio.bassShakeLevel * 100);
      bassSlider.value = bassPct;
      bassLevelText.textContent = `${bassPct}%`;
    }
    if (exhaustDelaySlider && exhaustDelayValText) {
      exhaustDelaySlider.value = audio.exhaustDelayMs;
      exhaustDelayValText.textContent = `${audio.exhaustDelayMs} мс`;
    }
    if (stereoWidthSlider && stereoWidthValText) {
      const widthPct = Math.round(audio.stereoWidthLevel * 100);
      stereoWidthSlider.value = widthPct;
      stereoWidthValText.textContent = `${widthPct}%`;
    }
  }

  // 1. Stage Presets (Buttons)
  if (stageBtns) {
    stageBtns.forEach(btn => {
      btn.addEventListener('click', () => {
        const mode = btn.dataset.stage;
        audio.setTeslaSoundstage(mode);
        syncSoundstageButtons(mode);
        syncAcousticUIToAudio();
      });
    });
  }

  // 2. Front ↔ Rear Crossfader Slider
  if (faderSlider) {
    faderSlider.addEventListener('input', (e) => {
      const val = parseInt(e.target.value, 10);
      const normalized = val / 100.0;
      audio.setFrontRearFader(normalized);
      if (faderValText) {
        if (val === 0) faderValText.textContent = '50 / 50 (Центр)';
        else if (val < 0) faderValText.textContent = `Капот ${Math.abs(val)}%`;
        else faderValText.textContent = `Выхлоп ${val}%`;
      }
      if (mapCenterOrb) {
        const orbX = 170 + (normalized * 90);
        mapCenterOrb.setAttribute('cx', orbX);
      }
    });
  }

  // 3. Front Engine Volume Slider
  if (frontVolSlider) {
    frontVolSlider.addEventListener('input', (e) => {
      const val = parseInt(e.target.value, 10);
      frontVolValText.textContent = `${val}%`;
      audio.setFrontVolume(val / 100.0);
    });
  }

  // 4. Rear Exhaust Volume Slider
  if (rearVolSlider) {
    rearVolSlider.addEventListener('input', (e) => {
      const val = parseInt(e.target.value, 10);
      rearVolValText.textContent = `${val}%`;
      audio.setRearVolume(val / 100.0);
    });
  }

  // 5. Pops & Bangs Slider
  if (popsVolSlider) {
    popsVolSlider.addEventListener('input', (e) => {
      const val = parseInt(e.target.value, 10);
      popsVolValText.textContent = `${val}%`;
      audio.setPopsVolume(val / 100.0);
      if (typeof crackleSlider !== 'undefined' && crackleSlider && crackleValText) {
        crackleSlider.value = val;
        crackleValText.textContent = `${val}%`;
      }
    });
  }

  // 6. Subwoofer Bass Slider
  if (bassSlider) {
    bassSlider.addEventListener('input', (e) => {
      updateAllBassSliders(parseInt(e.target.value, 10));
    });
  }

  // 7. Exhaust Distance Delay Slider
  if (exhaustDelaySlider) {
    exhaustDelaySlider.addEventListener('input', (e) => {
      const val = parseInt(e.target.value, 10);
      exhaustDelayValText.textContent = `${val} мс`;
      audio.setExhaustDelay(val);
    });
  }

  // 8. 3D Stereo Width Slider
  if (stereoWidthSlider) {
    stereoWidthSlider.addEventListener('input', (e) => {
      const val = parseInt(e.target.value, 10);
      stereoWidthValText.textContent = `${val}%`;
      audio.setStereoWidth(val / 100.0);
    });
  }

  // 9. Reset Button
  if (resetAcousticsBtn) {
    resetAcousticsBtn.addEventListener('click', () => {
      audio.resetAcousticsToDefault();
      if (stageBtns) {
        stageBtns.forEach(b => b.classList.toggle('active', b.dataset.stage === 'tesla_front'));
      }
      syncAcousticUIToAudio();
    });
  }

  // 10. Toggle Detailed Acoustic Controls
  if (toggleSpatialAdvBtn && spatialAdvancedBox) {
    toggleSpatialAdvBtn.addEventListener('click', () => {
      const isCollapsed = spatialAdvancedBox.classList.toggle('collapsed');
      toggleSpatialAdvBtn.textContent = isCollapsed 
        ? '⚙️ Подробные параметры акустики (7) ▼' 
        : '⚙️ Свернуть параметры акустики ▲';
    });
  }

  // Initialize UI values & apply saved v6.0 PRO state
  syncAcousticUIToAudio();
  setV6ProState(isV6ProEnabled, true);

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
    const currentAsp = (audio && audio.currentAspiration) ? audio.currentAspiration : 'turbo';
    
    // 1. Dedicated Turbo Box UI
    if (turboStateBadge) {
      if (currentAsp === 'supercharged') {
        turboStateBadge.textContent = enabled ? 'КОМПРЕССОР' : 'ВЫКЛ';
      } else if (currentAsp === 'turbo') {
        turboStateBadge.textContent = enabled ? 'ТУРБО' : 'ВЫКЛ';
      } else {
        turboStateBadge.textContent = enabled ? 'АТМО' : 'ВЫКЛ';
      }
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
    if (audio) {
      audio.setTurboWhine(enabled);
      audio.setTurboVolume(vol);
    }
  }

  function updateAspirationUI(carId) {
    if (!audio) return;
    const asp = audio.getAspirationType ? audio.getAspirationType(carId) : 'turbo';
    const turboTitleEl = document.querySelector('#turboControlBox .turbo-title');
    const bovLabelEl = document.querySelector('.turbo-suboption-label span');
    const bovRow = document.querySelector('.turbo-suboptions');

    if (asp === 'supercharged') {
      // Supercharged (Hellcat): Screaming mechanical blower, NO turbo whistle, NO "вутуту" BOV
      if (turboTitleEl) turboTitleEl.innerHTML = '⚙️ Механический компрессор / Supercharger';
      if (turboStateBadge) {
        turboStateBadge.textContent = 'КОМПРЕССОР';
        turboStateBadge.classList.add('active');
        turboStateBadge.style.background = 'rgba(230, 81, 0, 0.25)';
        turboStateBadge.style.color = '#ff9800';
      }
      if (turboToggleBtn) {
        turboToggleBtn.classList.add('active');
        if (turboToggleText) turboToggleText.textContent = 'ВКЛ';
      }
      if (bovLabelEl) {
        bovLabelEl.innerHTML = '💥 Блоу-офф (Stututu) &mdash; <span style="opacity: 0.5;">нет на компрессоре</span>';
      }
      if (turboBovCheck) {
        turboBovCheck.checked = false;
        turboBovCheck.disabled = true;
      }
      if (bovRow) {
        bovRow.style.opacity = '0.4';
      }
      isTurboWhineActive = true;
      const vol = turboVolumeSlider ? parseInt(turboVolumeSlider.value, 10) : 100;
      audio.setTurboWhine(true);
      audio.setTurboVolume(vol);
      audio.setTurboBlowOff(false);
    } else if (asp === 'turbo') {
      // Turbocharged: Spooling turbine whistle + authentic "вутуту" Blow-Off Valve flutter
      if (turboTitleEl) turboTitleEl.innerHTML = '🌀 Свист турбин / Turbo Whine';
      if (turboStateBadge) {
        turboStateBadge.textContent = 'ТУРБО';
        turboStateBadge.classList.add('active');
        turboStateBadge.style.background = 'rgba(0, 168, 255, 0.2)';
        turboStateBadge.style.color = '#00a8ff';
      }
      if (turboToggleBtn) {
        turboToggleBtn.classList.add('active');
        if (turboToggleText) turboToggleText.textContent = 'ВКЛ';
      }
      if (bovLabelEl) {
        bovLabelEl.innerHTML = '💥 Сброс давления Blow-Off (Stututu)';
      }
      if (turboBovCheck) {
        turboBovCheck.checked = true;
        turboBovCheck.disabled = false;
      }
      if (bovRow) {
        bovRow.style.opacity = '1.0';
      }
      isTurboWhineActive = true;
      const vol = turboVolumeSlider ? parseInt(turboVolumeSlider.value, 10) : 100;
      audio.setTurboWhine(true);
      audio.setTurboVolume(vol);
      audio.setTurboBlowOff(true);
    } else {
      // Naturally Aspirated (Атмосферный): Pure atmospheric roar
      if (turboTitleEl) turboTitleEl.innerHTML = '🏁 Атмосферный / Natural Intake';
      if (turboStateBadge) {
        turboStateBadge.textContent = 'АТМО';
        turboStateBadge.classList.remove('active');
        turboStateBadge.style.background = 'rgba(255, 255, 255, 0.1)';
        turboStateBadge.style.color = '#888';
      }
      if (turboToggleBtn) {
        turboToggleBtn.classList.remove('active');
        if (turboToggleText) turboToggleText.textContent = 'ВЫКЛ';
      }
      if (bovLabelEl) {
        bovLabelEl.innerHTML = '💥 Сброс давления Blow-Off (N/A)';
      }
      if (turboBovCheck) {
        turboBovCheck.checked = false;
        turboBovCheck.disabled = true;
      }
      if (bovRow) {
        bovRow.style.opacity = '0.4';
      }
      isTurboWhineActive = false;
      audio.setTurboWhine(false);
      audio.setTurboVolume(0);
      audio.setTurboBlowOff(false);
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

  // Initialize aspiration mode based on current car
  updateAspirationUI(audio ? audio.currentPresetId : 'cls63-amg');

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
  const hudCoordsBox = document.getElementById('hudCoordsBox');
  const gnssStatusBadge = document.getElementById('gnssStatusBadge');
  const gDot = document.getElementById('gDot');

  if (hudCoordsBox) {
    hudCoordsBox.addEventListener('click', () => {
      ensureAudioActive();
      const gpsTab = Array.from(tabBtns).find(b => b.dataset.tab === 'gps');
      if (gpsTab) {
        gpsTab.click();
      } else {
        telemetry.start();
      }
    });
  }

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

  // ==============================================================
  // SaaS Commercial Platform: i18n, Subscription & Legal Modules
  // ==============================================================
  function initSaaSCommercialModules() {
    // 1. Initialize Localization
    if (window.i18n) {
      window.i18n.init();
      const langSelect = document.getElementById('langSelect');
      if (langSelect) {
        langSelect.value = window.i18n.currentLang;
        langSelect.addEventListener('change', (e) => {
          window.i18n.setLanguage(e.target.value);
        });
      }
    }

    // 2. Initialize Subscription & Paywall
    if (window.subscription) {
      window.subscription.init();
    }

    // 3. Initialize In-App Legal Modal & Tabs
    const legalModal = document.getElementById('legalModal');
    const closeLegalModalBtn = document.getElementById('closeLegalModalBtn');
    const closeLegalModalBtnBottom = document.getElementById('closeLegalModalBtnBottom');
    const legalTabBtns = document.querySelectorAll('.legal-tab-btn');
    const legalPanes = document.querySelectorAll('.legal-tab-pane');

    function openLegalModal(tabId = 'legal-terms') {
      if (legalModal) {
        legalModal.classList.add('show');
        legalTabBtns.forEach(b => b.classList.toggle('active', b.dataset.tab === tabId));
        legalPanes.forEach(p => p.style.display = (p.id === tabId) ? 'block' : 'none');
      }
    }

    function closeLegalModal() {
      if (legalModal) legalModal.classList.remove('show');
    }

    if (closeLegalModalBtn) closeLegalModalBtn.addEventListener('click', closeLegalModal);
    if (closeLegalModalBtnBottom) closeLegalModalBtnBottom.addEventListener('click', closeLegalModal);
    if (legalModal) {
      legalModal.addEventListener('click', (e) => {
        if (e.target === legalModal) closeLegalModal();
      });
    }

    legalTabBtns.forEach(btn => {
      btn.addEventListener('click', () => {
        const tabId = btn.dataset.tab;
        legalTabBtns.forEach(b => b.classList.toggle('active', b === btn));
        legalPanes.forEach(p => p.style.display = (p.id === tabId) ? 'block' : 'none');
      });
    });

    ['linkTermsModal', 'linkPrivacyModal', 'linkRefundModal'].forEach(id => {
      const link = document.getElementById(id);
      if (link) {
        link.addEventListener('click', (e) => {
          e.preventDefault();
          const tab = (id === 'linkTermsModal') ? 'legal-terms' : (id === 'linkPrivacyModal') ? 'legal-privacy' : 'legal-refund';
          openLegalModal(tab);
        });
      }
    });

    // 4. Cookie / Privacy Notice Banner
    const cookieBanner = document.getElementById('cookieBanner');
    const acceptCookieBtn = document.getElementById('acceptCookieBtn');
    if (cookieBanner && acceptCookieBtn) {
      try {
        if (localStorage.getItem('tesla_cookie_consent') === 'true') {
          cookieBanner.classList.add('hidden');
        }
      } catch (e) {}
      acceptCookieBtn.addEventListener('click', () => {
        try {
          localStorage.setItem('tesla_cookie_consent', 'true');
        } catch (e) {}
        cookieBanner.classList.add('hidden');
      });
    }

    // 5. Update dynamic buttons on language change
    window.addEventListener('languageChanged', () => {
      if (startBtn) {
        if (audio && audio.isPlaying) {
          startBtn.textContent = window.i18n ? window.i18n.t('btn_stop', '⏹ ЗАГЛУШИТЬ') : '⏹ ЗАГЛУШИТЬ';
        } else {
          startBtn.textContent = window.i18n ? window.i18n.t('btn_start', 'START ENGINE') : 'START ENGINE';
        }
      }
    });
  }

  initSaaSCommercialModules();

  // ==============================================================
  // Unified Persistent Settings & Speed Units (MPH / KM/H)
  // ==============================================================
  let isMphMode = window.TeslaSettings ? window.TeslaSettings.get('mph', false) : false;
  const unitMphCheckbox = document.getElementById('unitMphCheckbox');
  const unitMphToggleLabel = document.getElementById('unitMphToggleLabel');
  const speedUnitDisplay = document.getElementById('speedUnitDisplay');

  function updateDeadzoneButtonsUnit() {
    const d0 = document.getElementById('deadzone0Btn');
    const d2 = document.getElementById('deadzone2Btn');
    const d4 = document.getElementById('deadzone4Btn');
    const t = (k, f) => (window.i18n ? window.i18n.t(k, f) : f);
    if (isMphMode) {
      if (d0) d0.textContent = t('deadzone_0_mph', '0 mph');
      if (d2) d2.textContent = t('deadzone_2_mph', '1.2 mph');
      if (d4) d4.textContent = t('deadzone_4_mph', '2.5 mph ★');
    } else {
      if (d0) d0.textContent = t('deadzone_0_kmh', '0 км/ч');
      if (d2) d2.textContent = t('deadzone_2_kmh', '2 км/ч');
      if (d4) d4.textContent = t('deadzone_4_kmh', '4 км/ч ★');
    }
  }

  function setSpeedUnit(isMph, save = true) {
    isMphMode = !!isMph;
    if (unitMphCheckbox) unitMphCheckbox.checked = isMphMode;
    if (unitMphToggleLabel) unitMphToggleLabel.classList.toggle('active', isMphMode);
    if (speedUnitDisplay) {
      speedUnitDisplay.textContent = isMphMode ? 'MPH' : (window.i18n ? window.i18n.t('speed_unit_kmh', 'KM/H') : 'KM/H');
    }
    updateDeadzoneButtonsUnit();
    if (save && window.TeslaSettings) {
      window.TeslaSettings.set('mph', isMphMode);
    }
  }

  if (unitMphCheckbox) {
    unitMphCheckbox.addEventListener('change', (e) => setSpeedUnit(e.target.checked));
  }
  if (unitMphToggleLabel) {
    unitMphToggleLabel.addEventListener('click', (e) => {
      if (e.target !== unitMphCheckbox) {
        setSpeedUnit(!isMphMode);
      }
    });
  }
  if (speedUnitDisplay) {
    speedUnitDisplay.addEventListener('click', () => setSpeedUnit(!isMphMode));
  }

  function restoreAllUserSettings() {
    if (!window.TeslaSettings) return;
    const s = window.TeslaSettings;

    // 1. Units
    setSpeedUnit(s.get('mph', false), false);

    // 2. Sliders
    const engVol = s.get('engineVol', 100);
    if (engineVolumeSlider) {
      engineVolumeSlider.value = engVol;
      if (engineVolumeText) engineVolumeText.textContent = `${engVol}%`;
      if (audio && audio.setMasterVolume) audio.setMasterVolume(engVol / 100);
    }

    const bassVol = s.get('quickBass', 100);
    if (quickBassSlider) {
      quickBassSlider.value = bassVol;
      if (quickBassText) quickBassText.textContent = `${bassVol}%`;
      if (audio && audio.setSubwooferGain) audio.setSubwooferGain(bassVol / 100);
    }

    const exhVol = s.get('quickExhaust', 100);
    if (quickExhaustSlider) {
      quickExhaustSlider.value = exhVol;
      if (quickExhaustText) quickExhaustText.textContent = `${exhVol}%`;
      if (audio && audio.setExhaustVolume) audio.setExhaustVolume(exhVol / 100);
    }

    // 3. Profiles
    const rpmProf = s.get('rpmProfile', 0);
    applyRpmMode(rpmProf, false, false);

    const crackleId = s.get('crackleMode', 'sport');
    const crackleIdx = CRACKLE_MODES.findIndex(m => m.id === crackleId);
    if (crackleIdx >= 0) applyCrackleMode(crackleIdx, false, false);

    const dz = s.get('deadzone', 4);
    applyGpsDeadzone(dz, false);

    const sens = s.get('throttleSens', 'sport');
    applyGpsSensitivity(sens, false);

    const exhMode = s.get('exhaustMode', 'open');
    applyExhaustMode(exhMode, false);

    // 4. Car preset
    const presetId = s.get('preset', null);
    if (presetId && presetSelect) {
      presetSelect.value = presetId;
      const list = currentEngineMode === 'dsp' ? DSP_PRESETS : SAMPLE_PRESETS;
      const pInfo = list.find(item => item.id === presetId);
      if (pInfo) updateBrandDisplay(pInfo.name, pInfo.badge);
      if (audio && audio.setPreset) {
        audio.setPreset(presetId).catch(() => {});
      }
    }

    // 5. Active tab
    const tabName = s.get('activeTab', 'pedal');
    const targetTab = Array.from(tabBtns).find(b => b.dataset.tab === tabName);
    if (targetTab && tabName !== 'p2p') {
      targetTab.click();
    }
  }

  // Hook all volume slider inputs to auto-save in TeslaSettings
  if (engineVolumeSlider) {
    engineVolumeSlider.addEventListener('input', (e) => {
      if (window.TeslaSettings) window.TeslaSettings.set('engineVol', parseInt(e.target.value, 10));
    });
  }
  if (quickBassSlider) {
    quickBassSlider.addEventListener('input', (e) => {
      if (window.TeslaSettings) window.TeslaSettings.set('quickBass', parseInt(e.target.value, 10));
    });
  }
  if (quickExhaustSlider) {
    quickExhaustSlider.addEventListener('input', (e) => {
      if (window.TeslaSettings) window.TeslaSettings.set('quickExhaust', parseInt(e.target.value, 10));
    });
  }

  // Also update dynamic buttons on languageChanged event
  window.addEventListener('languageChanged', () => {
    updateDeadzoneButtonsUnit();
    if (unitMphCheckbox) unitMphCheckbox.checked = isMphMode;
    if (unitMphToggleLabel) unitMphToggleLabel.classList.toggle('active', isMphMode);
    if (speedUnitDisplay) {
      speedUnitDisplay.textContent = isMphMode ? 'MPH' : (window.i18n ? window.i18n.t('speed_unit_kmh', 'KM/H') : 'KM/H');
    }
    if (hudSpeed && !telemetry.lastPosition) {
      const uStr = isMphMode ? (window.i18n ? window.i18n.t('unit_mph_short', 'mph') : 'mph') : (window.i18n ? window.i18n.t('unit_kmh_short', 'km/h') : 'km/h');
      hudSpeed.textContent = `0.0 ${uStr}`;
    }
    if (hudAccel && !telemetry.lastPosition) {
      hudAccel.textContent = `0.00 ${window.i18n ? window.i18n.t('unit_ms2', 'm/s²') : 'm/s²'}`;
    }
    applyRpmMode(currentRpmModeIdx, false, false);
    applyCrackleMode(currentCrackleIdx, false, false);
  });

  // Restore everything immediately
  setTimeout(() => {
    restoreAllUserSettings();
    applyRpmMode(currentRpmModeIdx, false, false);
    applyCrackleMode(currentCrackleIdx, false, false);
  }, 120);



  // 0. PRESET SELECTOR
  if (presetSelect) {
    presetSelect.addEventListener('change', async (e) => {
      const selectedId = e.target.value;
      if (window.TeslaSettings) window.TeslaSettings.set('preset', selectedId);
      const list = currentEngineMode === 'dsp' ? DSP_PRESETS : SAMPLE_PRESETS;
      const presetInfo = list.find(item => item.id === selectedId);
      if (presetInfo) {
        updateBrandDisplay(presetInfo.name, presetInfo.badge);
        brandTitle.textContent = `${presetInfo.name} ⏳`;
      }
      try {
        await audio.setPreset(selectedId);
        syncSoundstageButtons(audio.soundstageMode);
        if (isV6ProEnabled) {
          syncAcousticUIToAudio();
        }
        updateAspirationUI(selectedId);
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

  // ==============================================================
  // Touch-Friendly Car Selection Modal / Шторка выбора звука
  // ==============================================================
  const carSelectModalBtn = document.getElementById('carSelectModalBtn');
  const dashboardCarPickerBtn = document.getElementById('dashboardCarPickerBtn');
  const carSelectModal = document.getElementById('carSelectModal');
  const closeCarModalBtn = document.getElementById('closeCarModalBtn');
  const closeCarModalBtnBottom = document.getElementById('closeCarModalBtnBottom');
  const modalTabDsp = document.getElementById('modalTabDsp');
  const modalTabSamples = document.getElementById('modalTabSamples');
  const carCardsGrid = document.getElementById('carCardsGrid');

  function renderCarCards() {
    if (!carCardsGrid) return;
    carCardsGrid.innerHTML = '';
    DSP_PRESETS.forEach(item => {
      const card = document.createElement('div');
      card.className = 'car-card-item';
      if (item.id === audio.currentPresetId || (presetSelect && presetSelect.value === item.id)) {
        card.classList.add('active');
      }
      card.innerHTML = `
        <div class="car-card-top">
          <span class="car-card-name">${item.name}</span>
          <span class="car-card-badge">${item.badge}</span>
        </div>
      `;
      addTouchInstantListener(card, async () => {
        carCardsGrid.querySelectorAll('.car-card-item').forEach(c => c.classList.remove('active'));
        card.classList.add('active');
        if (presetSelect) presetSelect.value = item.id;
        updateBrandDisplay(item.name, item.badge);
        try {
          await audio.setPreset(item.id);
          syncSoundstageButtons(audio.soundstageMode);
          if (isV6ProEnabled) {
            syncAcousticUIToAudio();
          }
          updateAspirationUI(item.id);
          // Re-apply user driving preferences to new car
          applyCrackleMode(currentCrackleIdx, false, false);
          applyGpsSensitivity(currentSensId, false);
          applyExhaustMode(currentExhaustMode, false);
        } catch (err) {
          console.error('Error switching car:', err);
        }
        if (!audio.isPlaying) {
          await unlockAndStartEngine();
        }
        closeCarModal();
      });
      carCardsGrid.appendChild(card);
    });
  }

  // Robust Tesla Touchscreen Car Modal Logic:
  // Opens on tap and STAYS open until explicitly closed or backdrop is tapped
  let _backdropStartedOutside = false;
  let _carModalOpenedAt = 0;

  function openCarModal() {
    if (!carSelectModal) return;
    renderCarCards();
    _carModalOpenedAt = Date.now();
    _backdropStartedOutside = false;
    carSelectModal.classList.add('open');
    carSelectModal.classList.add('active');
    carSelectModal.style.display = 'flex';
  }

  function closeCarModal() {
    if (carSelectModal) {
      carSelectModal.classList.remove('open');
      carSelectModal.classList.remove('active');
      carSelectModal.style.display = 'none';
    }
  }

  if (carSelectModalBtn) {
    addTouchInstantListener(carSelectModalBtn, (e) => {
      e.stopPropagation();
      openCarModal();
    });
  }
  if (dashboardCarPickerBtn) {
    addTouchInstantListener(dashboardCarPickerBtn, (e) => {
      e.stopPropagation();
      openCarModal();
    });
  }
  if (closeCarModalBtn) addTouchInstantListener(closeCarModalBtn, closeCarModal);
  if (closeCarModalBtnBottom) addTouchInstantListener(closeCarModalBtnBottom, closeCarModal);

  if (carSelectModal) {
    carSelectModal.addEventListener('pointerdown', (e) => {
      _backdropStartedOutside = (e.target === carSelectModal);
    });
    carSelectModal.addEventListener('click', (e) => {
      if (e.target === carSelectModal && _backdropStartedOutside && (Date.now() - _carModalOpenedAt > 450)) {
        closeCarModal();
      }
      _backdropStartedOutside = false;
    });
  }

  // iOS Safari & Tesla  // iOS Safari & Tesla Audio Session Unlocker
  // Plays valid silent audio to force iOS out of "Ambient" into "Playback" (bypasses silent switch)
  function unlockSafariAndTeslaAudio() {
    if ('audioSession' in navigator) {
      try {
        navigator.audioSession.type = 'playback';
      } catch (e) {}
    }
    try {
      const ctx = audio.ensureContext();
      if (ctx) {
        if (ctx.state === 'suspended' || ctx.state === 'interrupted') {
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
        const playPromise = mediaSessionKeeper.play();
        if (playPromise !== undefined) {
          playPromise.catch(err => console.warn('Keeper play warning:', err));
        }
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
  // Tesla-specific: also try on scroll and any interaction
  window.addEventListener('scroll', handleGlobalUnlock, { once: true, passive: true });
  // Try auto-start after page fully loaded (Tesla browser may allow this)
  setTimeout(() => {
    if (!audio.isPlaying && !isStartingAudio) {
      unlockSafariAndTeslaAudio();
      // Re-register media session even without playing (so steering wheel works before START press)
      initTeslaMediaSession();
    }
  }, 1500);

  // 1. ENGINE START / STOP BUTTON & AUTO-UNLOCK
  let isStartingAudio = false;
  async function unlockAndStartEngine(withStarter = false) {
    if (audio.isPlaying || isStartingAudio) return;
    isStartingAudio = true;
    const t = (k, fb) => (window.i18n && window.i18n.t) ? window.i18n.t(k, fb) : fb;
    if (withStarter) {
      startBtn.textContent = t('btn_starter_crank', '⚡ СТАРТЕР...');
      startBtn.classList.add('cranking');
    } else {
      startBtn.textContent = t('btn_starting', 'ЗАПУСК...');
    }
    startBtn.disabled = true;

    // Synchronously unlock audio before any async awaits
    unlockSafariAndTeslaAudio();

    try {
      if (presetSelect && presetSelect.value && audio.currentPresetId !== presetSelect.value) {
        await audio.setPreset(presetSelect.value);
      }
      await audio.start(withStarter);
      initTeslaMediaSession();

      const delayMs = withStarter ? 350 : 0;
      setTimeout(() => {
        startBtn.textContent = (window.i18n ? window.i18n.t('btn_stop', '⏹ ЗАГЛУШИТЬ') : '⏹ ЗАГЛУШИТЬ');
        startBtn.className = 'btn btn-danger';
        startBtn.classList.remove('cranking');
        startBtn.disabled = false;
        requestScreenWakeLock();
        updateMediaSessionInfo();
      }, delayMs);
      console.log('Engine successfully started!');
    } catch (err) {
      console.error('Audio start failed:', err);
      startBtn.textContent = (window.i18n ? window.i18n.t('btn_start', 'START ENGINE') : 'START ENGINE');
      startBtn.className = 'btn btn-primary';
      startBtn.classList.remove('cranking');
      startBtn.disabled = false;
    } finally {
      isStartingAudio = false;
    }
  }

  addTouchInstantListener(startBtn, async () => {
    unlockSafariAndTeslaAudio();
    if (!audio.isPlaying) {
      await unlockAndStartEngine(true); // explicit button tap triggers full starter sound!
    } else {
      audio.stop();
      releaseScreenWakeLock();
      updateMediaSessionInfo();
      startBtn.textContent = (window.i18n ? window.i18n.t('btn_start', 'START ENGINE') : 'START ENGINE');
      startBtn.className = 'btn btn-primary';
      startBtn.classList.remove('cranking');
    }
  });

  // Auto-start audio on first user touch/click on the pedal or action buttons
  function ensureAudioActive() {
    unlockSafariAndTeslaAudio();
    initTeslaMediaSession();
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
      if (window.TeslaSettings && activeTab !== 'p2p') window.TeslaSettings.set('activeTab', activeTab);

      if (activeTab === 'gps') {
        if (gnssStatusBadge && (!telemetry.lastPosition || !telemetry.lastPosition.coords)) {
          gnssStatusBadge.textContent = 'Поиск спутников...';
          gnssStatusBadge.style.color = 'var(--accent-amber)';
        }
        if (hudCoords && (!telemetry.lastPosition || !telemetry.lastPosition.coords)) {
          hudCoords.textContent = '🛰️ Запрос GPS... Выйдите под открытое небо';
        }
        if (hudAccuracy && (!telemetry.lastPosition || !telemetry.lastPosition.coords)) {
          hudAccuracy.textContent = 'Поиск...';
        }
        telemetry.start();
      } else if (activeTab === 'p2p') {
        openP2PModal();
      }
    });
  });

  // Helper for 0-latency touch and click response on Tesla MCU touchscreen
  function addTouchInstantListener(el, callback) {
    if (!el) return;
    let lastTrigger = 0;
    const trigger = (e) => {
      const now = performance.now();
      if (now - lastTrigger < 160) return; // Debounce to prevent duplicate click/pointer fire
      lastTrigger = now;
      if (e.cancelable && e.type !== 'click') e.preventDefault();
      callback(e);
    };
    el.addEventListener('pointerdown', trigger, { passive: false });
    el.addEventListener('touchstart', trigger, { passive: false });
    el.addEventListener('click', trigger);
  }

  // 4. GEAR SELECTOR (N / D / M) & PADDLE SHIFTERS
  const shiftUpBtn = document.getElementById('shiftUpBtn');
  const shiftDownBtn = document.getElementById('shiftDownBtn');
  const gearNumBtns = document.querySelectorAll('.gear-num-btn');

  function switchToManualAndShift(action, broadcast = true) {
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
    const curG = (audio.dspEngine && audio.dspEngine.vehicle) ? audio.dspEngine.vehicle.gear : (audio.gear || 1);
    audio.gear = curG;
    showShiftNotification(`▲ M${curG}`);
    updateMediaSessionInfo();

    // Update big shift display
    const _bigGD = document.getElementById('bigGearDisplay');
    if (_bigGD) {
      const _curGG = (audio.dspEngine && audio.dspEngine.vehicle) ? audio.dspEngine.vehicle.gear : (audio.gear || 1);
      _bigGD.textContent = `M${_curGG}`;
    }

    // Broadcast gear shift to paired Tesla or Phone via P2P
    if (broadcast && typeof p2p !== 'undefined' && p2p.isConnected) {
      p2p.sendGearShift(action);
    }
  }

  if (shiftUpBtn) addTouchInstantListener(shiftUpBtn, () => switchToManualAndShift('up'));
  if (shiftDownBtn) addTouchInstantListener(shiftDownBtn, () => switchToManualAndShift('down'));

  gearNumBtns.forEach(btn => {
    addTouchInstantListener(btn, () => {
      const g = parseInt(btn.dataset.gear, 10);
      switchToManualAndShift(g);
    });
  });

  // Big floating shift buttons (Tesla + Mobile Touch Optimized)
  const bigShiftUpBtn = document.getElementById('bigShiftUpBtn');
  const bigShiftDownBtn = document.getElementById('bigShiftDownBtn');
  const bigGearDisplay = document.getElementById('bigGearDisplay');

  function updateBigGearDisplay() {
    if (!bigGearDisplay) return;
    const curG = (audio.dspEngine && audio.dspEngine.vehicle) ? audio.dspEngine.vehicle.gear : (audio.gear || 1);
    const mode = audio.gearMode || 'N';
    bigGearDisplay.textContent = mode === 'N' ? 'N' : (mode === 'M' ? `M${curG}` : `D${curG}`);
  }

  if (bigShiftUpBtn) {
    addTouchInstantListener(bigShiftUpBtn, () => {
      bigShiftUpBtn.classList.add('pressed');
      setTimeout(() => bigShiftUpBtn.classList.remove('pressed'), 140);
      switchToManualAndShift('up');
      updateBigGearDisplay();
    });
  }
  if (bigShiftDownBtn) {
    addTouchInstantListener(bigShiftDownBtn, () => {
      bigShiftDownBtn.classList.add('pressed');
      setTimeout(() => bigShiftDownBtn.classList.remove('pressed'), 140);
      switchToManualAndShift('down');
      updateBigGearDisplay();
    });
  }
  if (bigShiftDownBtn) {
    addTouchInstantListener(bigShiftDownBtn, () => {
      switchToManualAndShift('down');
      updateBigGearDisplay();
    });
  }

  // Keep big display synced with gear selector
  const _origSwitchToManual = switchToManualAndShift;

  gearBtns.forEach(btn => {
    addTouchInstantListener(btn, () => {
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
        if (audio.dspEngine && audio.dspEngine.vehicle) {
          audio.dspEngine.vehicle.neutral = false;
          if (audio.dspEngine.vehicle.gear < 1) audio.dspEngine.vehicle.gear = 1;
          audio.gear = audio.dspEngine.vehicle.gear;
        } else if (audio.gear === 0) {
          audio.gear = 1;
        }
      } else {
        // D (Auto)
        if (audio.dspEngine && audio.dspEngine.vehicle) {
          audio.dspEngine.vehicle.neutral = false;
          if (audio.dspEngine.vehicle.gear < 1) audio.dspEngine.vehicle.gear = 1;
          audio.gear = audio.dspEngine.vehicle.gear;
        } else if (audio.gear === 0) {
          audio.gear = 1;
        }
      }
      showShiftNotification(`⚙ ${mode === 'N' ? 'N (Нейтраль)' : (mode === 'M' ? `M${audio.gear || 1}` : 'D (Автомат)')}`);
      updateMediaSessionInfo();
    });
  });

  // Unified RPM Multiplier & Shift Profile hooks
  if (rpmMultiplierBtn) addTouchInstantListener(rpmMultiplierBtn, cycleRpmMode);
  if (headerRpmMultBtn) addTouchInstantListener(headerRpmMultBtn, cycleRpmMode);
  applyRpmMode(currentRpmModeIdx, false, false);

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
    } else if (e.code === 'KeyE' || e.code === 'ArrowRight' || e.code === 'MediaTrackNext' || e.code === 'PageUp') {
      e.preventDefault();
      switchToManualAndShift('up');
    } else if (e.code === 'KeyQ' || e.code === 'ArrowLeft' || e.code === 'MediaTrackPrevious' || e.code === 'PageDown') {
      e.preventDefault();
      switchToManualAndShift('down');
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

  // 7. TELEMETRY & GPS UPDATES (With Traffic Light Stop Filter / Deadzone)
  function handleTelemetryUpdate(data) {
    const rawSpeed = (typeof data.speed === 'number' && !isNaN(data.speed)) ? data.speed : 0;
    const isStationary = rawSpeed < (gpsDeadzone || 0);
    const effectiveSpeed = isStationary ? 0 : rawSpeed;
    const effectiveAccel = isStationary ? 0 : (data.acceleration || 0);
    const filteredData = {
      ...data,
      speed: effectiveSpeed,
      acceleration: effectiveAccel
    };

    const dispSpeed = isMphMode ? (effectiveSpeed * 0.621371) : effectiveSpeed;
    const unitStr = isMphMode ? (window.i18n ? window.i18n.t('unit_mph_short', 'mph') : 'mph') : (window.i18n ? window.i18n.t('unit_kmh_short', 'км/ч') : 'км/ч');
    hudSpeed.textContent = `${dispSpeed.toFixed(1)} ${unitStr}`;
    if (isStationary && rawSpeed > 0.2 && gpsDeadzone > 0) {
      hudSpeed.title = `Фильтр светофора активен: GPS дрейф ${rawSpeed.toFixed(1)} км/ч подавлен`;
    } else {
      hudSpeed.title = '';
    }
    const t = (k, fb) => (window.i18n && window.i18n.t) ? window.i18n.t(k, fb) : fb;
    hudAccel.textContent = `${effectiveAccel > 0 ? '+' : ''}${effectiveAccel.toFixed(2)} ${t('unit_ms2', 'м/с²')}`;
    hudGForce.textContent = `${(data.gForce || 0).toFixed(2)} G`;
    hudAccuracy.textContent = data.accuracy ? `±${Math.round(data.accuracy)} ${t('unit_meter', 'м')}` : '–';
    hudRate.textContent = data.hz > 0 ? `${data.hz} ${t('unit_hz', 'Гц')}` : `GPS 1 ${t('unit_hz', 'Гц')}`;
    if (data.latitude && data.longitude) {
      hudCoords.textContent = `${data.latitude.toFixed(5)}°, ${data.longitude.toFixed(5)}°`;
      if (gnssStatusBadge) {
        gnssStatusBadge.textContent = t('gnss_satellites_locked', '✅ Спутники захвачены');
        gnssStatusBadge.style.color = 'var(--accent-green)';
      }
    } else if (telemetry.isTracking) {
      if (gnssStatusBadge) {
        gnssStatusBadge.textContent = t('gnss_searching_satellites', '🛰️ Поиск спутников...');
        gnssStatusBadge.style.color = 'var(--accent-amber)';
      }
    }

    // Move G-ball
    const maxG = 1.2;
    const clampedG = Math.max(-maxG, Math.min(maxG, data.gForce));
    const ballY = 50 - (clampedG / maxG) * 45; // Forward is up
    gDot.style.top = `${ballY}%`;

    // Feed into sound engine if GPS mode active
    if (activeTab === 'gps') {
      audio.applyTelemetry(filteredData);
    }

    // If phone client, stream to Tesla host via P2P WebRTC
    if (p2p.role === 'client' && p2p.isConnected) {
      p2p.sendTelemetry(filteredData);
    }
  }

  function handleRemoteTelemetry(data) {
    // Received telemetry from connected smartphone
    handleTelemetryUpdate(data);
  }

  // Synchronize gear shifts across P2P (e.g. Steering wheel tilt on phone -> shifts on Tesla screen)
  p2p.onGearShiftReceived = (action) => {
    switchToManualAndShift(action, false);
  };
  p2p.onRpmMultiplierReceived = (mult) => {
    const foundIdx = RPM_MODES.findIndex(m => Math.abs(m.mult - mult) < 0.2);
    if (foundIdx >= 0) {
      applyRpmMode(foundIdx, false, true);
    }
  };
  p2p.onShiftProfileReceived = (profile) => {
    const targetIdx = (profile === 'sport') ? (currentRpmModeIdx === 0 ? 1 : currentRpmModeIdx) : 0;
    applyRpmMode(targetIdx, false, false);
  };

  function handleTelemetryError(err) {
    if (hudAccuracy) hudAccuracy.textContent = '–';
    if (gnssStatusBadge) {
      gnssStatusBadge.textContent = '❌ Сигнал потерян';
      gnssStatusBadge.style.color = '#ef4444';
    }
    if (hudCoords) {
      if (err.message && err.message.includes('запретил')) {
        hudCoords.textContent = 'Геопозиция запрещена (Нажмите «Разрешить» в настройках Safari)';
      } else {
        hudCoords.textContent = '🛰️ Нет сигнала GNSS (в здании / паркинге). Выйдите на улицу!';
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
    let needleRpm = Math.max(0, Math.min(maxRpm, rpm));
    const isCutting = audio.isRevLimiting || (rpm >= redlineRpm * 0.985 && (audio.throttle > 0.85 || audio.targetThrottle > 0.85));

    // Violent tachometer needle jerk & bounce on the redline rev limiter ("отсечка в красное дергает стрелку")
    if (isCutting) {
      // High-frequency mechanical jerk bouncing between the limiter stop pin and -480 RPM
      const t = performance.now() * 0.055; // ~55 Hz violent vibration
      const bounce = Math.sin(t * 1.75) * Math.cos(t * 3.2);
      const jerk = (bounce > 0 ? bounce * 140 : bounce * 480);
      needleRpm = Math.max(redlineRpm - 550, Math.min(maxRpm, redlineRpm + jerk));
    }

    const needleAngle = startAngle + (needleRpm / maxRpm) * totalAngle;

    ctx.save();
    if (isCutting) {
      // Blinding red flashing glow on the needle during rev limiter cut!
      const flash = (performance.now() % 100 < 50);
      ctx.shadowColor = flash ? '#ff0000' : '#ff4400';
      ctx.shadowBlur = 28 + Math.random() * 12;
    } else {
      ctx.shadowColor = needleRpm >= redlineRpm ? '#ff2222' : '#ff9900';
      ctx.shadowBlur = 14;
    }
    ctx.beginPath();
    ctx.moveTo(cx - Math.cos(needleAngle + Math.PI / 2) * 4, cy - Math.sin(needleAngle + Math.PI / 2) * 4);
    ctx.lineTo(cx + Math.cos(needleAngle) * (radius - 12), cy + Math.sin(needleAngle) * (radius - 12));
    ctx.lineTo(cx + Math.cos(needleAngle + Math.PI / 2) * 4, cy + Math.sin(needleAngle + Math.PI / 2) * 4);
    ctx.fillStyle = isCutting ? '#ff1111' : (needleRpm >= redlineRpm ? '#ff2222' : '#ff9900');
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
    switchToManualAndShift('up');
  }

  function handleSteeringWheelShiftDown() {
    switchToManualAndShift('down');
  }

  // Live continuous audio stream to keep Tesla Media Player card attached and active
  function attachMediaSessionStream() {
    if (!audio || !audio.ctx || !mediaSessionKeeper) return;
    try {
      const ctx = audio.ctx;
      if (ctx.state === 'suspended' || ctx.state === 'interrupted') {
        ctx.resume().catch(() => {});
      }

      if (!mediaSessionKeeper._hasStreamAttached && ctx.createMediaStreamDestination) {
        try {
          const streamDest = ctx.createMediaStreamDestination();
          // Connect actual master engine sound through clipper to media stream destination!
          if (audio.clip) {
            audio.clip.connect(streamDest);
          } else if (audio.masterGain) {
            audio.masterGain.connect(streamDest);
          }
          mediaSessionKeeper.srcObject = streamDest.stream;
          mediaSessionKeeper._hasStreamAttached = true;
        } catch (streamErr) {
          console.warn('createMediaStreamDestination fallback:', streamErr);
        }
      }
      mediaSessionKeeper.volume = 1.0;
      const playPromise = mediaSessionKeeper.play();
      if (playPromise !== undefined) {
        playPromise.catch(e => {
          console.warn('Keeper stream play:', e);
          // If srcObject play fails, try base64 silent loop
          if (mediaSessionKeeper.srcObject) {
            mediaSessionKeeper.srcObject = null;
            mediaSessionKeeper.play().catch(() => {});
          }
        });
      }
    } catch (err) {
      console.warn('attachMediaSessionStream warning:', err);
    }
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

        const curG = (audio.dspEngine && audio.dspEngine.vehicle) ? audio.dspEngine.vehicle.gear : (audio.gear || 1);
        const gearLabel = audio.gearMode === 'N' ? 'N' : (audio.gearMode === 'M' ? `M${curG}` : `D${curG}`);
        const speedKmh = Math.round(audio.speed || 0);

        navigator.mediaSession.metadata = new MediaMetadata({
          title: `${carName} [${gearLabel}]`,
          artist: `Передача: ${gearLabel} • ${speedKmh} км/ч • Стик руля = КПП`,
          album: 'Tesla Virtual Exhaust',
          artwork: [
            { src: 'https://images.unsplash.com/photo-1617788138017-80ad40651399?w=512', sizes: '512x512', type: 'image/jpeg' },
            { src: 'https://images.unsplash.com/photo-1617788138017-80ad40651399?w=192', sizes: '192x192', type: 'image/jpeg' }
          ]
        });

        navigator.mediaSession.playbackState = audio.isPlaying ? 'playing' : 'paused';

        // Keep 1-hour virtual timeline so Tesla OS and Bluetooth keep both Prev and Next track active
        if (navigator.mediaSession.setPositionState) {
          try {
            navigator.mediaSession.setPositionState({
              duration: 3600,
              playbackRate: 1.0,
              position: 120
            });
          } catch (e) {}
        }
      } catch (err) {}
    }
  }

  // Register MediaSession hardware button handlers (Left scroll wheel / stick on Tesla steering wheel)
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
          attachMediaSessionStream();
          updateMediaSessionInfo();
        });
        navigator.mediaSession.setActionHandler('pause', () => {
          if (audio.isPlaying) {
            audio.stop();
            startBtn.textContent = (window.i18n ? window.i18n.t('btn_start', 'START ENGINE') : 'START ENGINE');
            startBtn.className = 'btn btn-primary';
          }
          if (mediaSessionKeeper) mediaSessionKeeper.pause();
          updateMediaSessionInfo();
        });

        // 4. Seek buttons if fired by steering wheel tilt or timeline scrub
        navigator.mediaSession.setActionHandler('seekforward', () => {
          handleSteeringWheelShiftUp();
        });
        navigator.mediaSession.setActionHandler('seekbackward', () => {
          handleSteeringWheelShiftDown();
        });
        navigator.mediaSession.setActionHandler('seekto', (details) => {
          if (details && typeof details.seekTime === 'number') {
            if (details.seekTime > 120) handleSteeringWheelShiftUp();
            else if (details.seekTime < 120) handleSteeringWheelShiftDown();
          }
          updateMediaSessionInfo();
        });
        try {
          navigator.mediaSession.setActionHandler('skipad', () => {
            handleSteeringWheelShiftUp();
          });
        } catch (e) {}
        try {
          navigator.mediaSession.setActionHandler('stop', () => {
            if (audio.isPlaying) audio.stop();
          });
        } catch (e) {}
      } catch (err) {
        console.warn('MediaSession handler warning:', err);
      }
    }

    attachMediaSessionStream();
  }

  // Auto-initialize MediaSession immediately so steering wheel buttons bind on launch
  initTeslaMediaSession();

  // Re-register MediaSession handlers on focus (Tesla OS sometimes drops the session)
  document.addEventListener('visibilitychange', () => {
    if (document.visibilityState === 'visible') {
      setTimeout(() => {
        initTeslaMediaSession();
        if (audio.isPlaying) attachMediaSessionStream();
      }, 300);
    }
  });
  window.addEventListener('focus', () => {
    setTimeout(() => initTeslaMediaSession(), 200);
  });

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
    if ('audioSession' in navigator) {
      try {
        navigator.audioSession.type = 'playback';
      } catch (e) {}
    }
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
        if (audio.ctx && (audio.ctx.state === 'suspended' || audio.ctx.state === 'interrupted')) {
          audio.ctx.resume().catch(() => {});
        }
        audio.updatePhysics(dt, activeTab);
    pollTeslaGamepad();
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
        if (audio.ctx && (audio.ctx.state === 'suspended' || audio.ctx.state === 'interrupted')) {
          audio.ctx.resume().catch(() => {});
        }
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
  // Steering wheel scroll is completely free for normal Tesla volume and web scroll!
  // Tilt wheel Left/Right or Media keys shift gears:
  window.addEventListener('keydown', (e) => {
    // Left wheel TILT RIGHT (Next Track) -> Shift UP
    if (e.key === 'MediaTrackNext' || e.code === 'MediaTrackNext' || e.keyCode === 176 || e.key === 'TrackNext') {
      e.preventDefault();
      handleSteeringWheelShiftUp();
    }
    // Left wheel TILT LEFT (Previous Track) -> Shift DOWN
    else if (e.key === 'MediaTrackPrevious' || e.code === 'MediaTrackPrevious' || e.keyCode === 177 || e.key === 'TrackPrevious') {
      e.preventDefault();
      handleSteeringWheelShiftDown();
    }
  });

  
  // 16. TESLA STEERING WHEEL GAMEPAD POLLING (Hardware Left/Right Scroll Wheel Tilt)
  let lastGamepadShift = 0;
  function pollTeslaGamepad() {
    if (!navigator.getGamepads) return;
    try {
      const gamepads = navigator.getGamepads();
      if (!gamepads) return;
      for (let i = 0; i < gamepads.length; i++) {
        const gp = gamepads[i];
        if (!gp || !gp.connected) continue;
        const now = performance.now();
        if (now - lastGamepadShift < 260) continue; // 260ms debounce

        // Check D-pad buttons: 14 = left, 15 = right
        if (gp.buttons) {
          if (gp.buttons[14] && gp.buttons[14].pressed) {
            lastGamepadShift = now;
            switchToManualAndShift('down');
            break;
          }
          if (gp.buttons[15] && gp.buttons[15].pressed) {
            lastGamepadShift = now;
            switchToManualAndShift('up');
            break;
          }
          // Shoulder bumpers: 4 = L1, 5 = R1
          if (gp.buttons[4] && gp.buttons[4].pressed) {
            lastGamepadShift = now;
            switchToManualAndShift('down');
            break;
          }
          if (gp.buttons[5] && gp.buttons[5].pressed) {
            lastGamepadShift = now;
            switchToManualAndShift('up');
            break;
          }
        }

        // Check horizontal axes
        if (gp.axes && gp.axes.length > 0) {
          const ax0 = gp.axes[0];
          if (ax0 < -0.7) {
            lastGamepadShift = now;
            switchToManualAndShift('down');
            break;
          } else if (ax0 > 0.7) {
            lastGamepadShift = now;
            switchToManualAndShift('up');
            break;
          }
        }
      }
    } catch (e) {}
  }

  // 13. MAIN ANIMATION LOOP (60 FPS)
  function loop(currentTime) {
    const dt = Math.min(0.1, (currentTime - lastFrameTime) / 1000.0);
    lastFrameTime = currentTime;

    // Run sound physics step
    audio.updatePhysics(dt, activeTab);
    pollTeslaGamepad();

    // Update Digital Displays
    const currentRpm = Math.round(audio.rpm);
    rpmNumeric.textContent = `${currentRpm} RPM`;

    const isLimiterActive = audio.isRevLimiting || (currentRpm >= (audio.redlineRpm || 8000) * 0.985 && (audio.throttle > 0.85 || audio.targetThrottle > 0.85));
    if (isLimiterActive) {
      rpmNumeric.style.color = '#ff2222';
      rpmNumeric.style.textShadow = '0 0 16px rgba(255, 34, 34, 0.9)';
      rpmNumeric.style.transform = `scale(1.08) rotate(${(Math.random() * 3 - 1.5).toFixed(1)}deg)`;
    } else {
      rpmNumeric.style.color = '';
      rpmNumeric.style.textShadow = '';
      rpmNumeric.style.transform = '';
    }

    let gearText = 'N';
    if (audio.gearMode === 'N' || audio.gear === 0) {
      gearText = 'N';
    } else if (audio.gearMode === 'M') {
      gearText = `M${audio.gear || 1}`;
    } else {
      gearText = (audio.gear || 1).toString();
    }
    gearDisplay.textContent = gearText;
    const currentDisplaySpeed = isMphMode ? Math.round(audio.speed * 0.621371) : Math.round(audio.speed);
    speedDisplay.textContent = currentDisplaySpeed;
    if (speedUnitDisplay) {
      speedUnitDisplay.textContent = isMphMode ? 'MPH' : (window.i18n ? window.i18n.t('speed_unit_kmh', 'KM/H') : 'KM/H');
    }

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

    // Pulse Tesla Cabin Map sound nodes in real-time
    if (mapFrontAura && mapRearAura && audio.isPlaying) {
      const rpmRatio = Math.max(0, Math.min(1, (currentRpm - 700) / (audio.maxRpm - 700)));
      const frontR = 20 + rpmRatio * 14 + (audio.throttle * 8);
      const rearR = 22 + rpmRatio * 16 + (audio.throttle * 12);
      mapFrontAura.setAttribute('r', frontR.toFixed(1));
      mapRearAura.setAttribute('r', rearR.toFixed(1));
      if (mapSubAura) {
        const subR = 13 + (audio.throttle * 12) + (rpmRatio * 6);
        mapSubAura.setAttribute('r', subR.toFixed(1));
      }
    }

    animationFrameId = requestAnimationFrame(loop);
  }

  animationFrameId = requestAnimationFrame(loop);
});
