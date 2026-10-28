/**
 * Tesla Sound Simulator - Unified Persistent Settings Manager (v8.1)
 * Automatically preserves and restores ALL user preferences across sessions.
 */
(function(window) {
  'use strict';

  const STORAGE_KEY = 'tesla_sound_settings_v81';

  const DEFAULT_SETTINGS = {
    mph: false,
    lang: 'ru',
    preset: 'carrera-gt',
    engineVol: 100,
    quickBass: 100,
    quickExhaust: 100,
    rpmProfile: 0,
    crackleMode: 'sport',
    deadzone: 4,
    throttleSens: 'sport',
    exhaustMode: 'open',
    soundstage: 'tesla_front',
    fader: 0,
    frontVol: 100,
    rearVol: 100,
    popsVol: 100,
    bassVol: 100,
    exhaustDelay: 18,
    stereoWidth: 130,
    turboWhine: true,
    turboVol: 100,
    turboBov: true,
    activeTab: 'pedal'
  };

  class SettingsManager {
    constructor() {
      this.data = { ...DEFAULT_SETTINGS };
      this.load();
    }

    load() {
      try {
        const raw = localStorage.getItem(STORAGE_KEY);
        if (raw) {
          const parsed = JSON.parse(raw);
          this.data = { ...DEFAULT_SETTINGS, ...parsed };
        }
      } catch (e) {
        console.warn('Failed to load settings from localStorage:', e);
      }
    }

    save() {
      try {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(this.data));
      } catch (e) {
        console.warn('Failed to save settings to localStorage:', e);
      }
    }

    get(key, fallback = undefined) {
      if (this.data[key] !== undefined) {
        return this.data[key];
      }
      return (fallback !== undefined) ? fallback : DEFAULT_SETTINGS[key];
    }

    set(key, value) {
      this.data[key] = value;
      this.save();
    }

    update(partialObj) {
      Object.assign(this.data, partialObj);
      this.save();
    }
  }

  window.TeslaSettings = new SettingsManager();

  // Ensure flush to disk before page unload
  window.addEventListener('beforeunload', () => {
    window.TeslaSettings.save();
  });
  document.addEventListener('visibilitychange', () => {
    if (document.visibilityState === 'hidden') {
      window.TeslaSettings.save();
    }
  });

})(window);
