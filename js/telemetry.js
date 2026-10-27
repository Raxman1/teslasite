/**
 * High-Precision Telemetry & GPS Sensor Fusion Module
 * Combines high-accuracy Geolocation API with high-frequency DeviceMotionEvent accelerometer
 */
class TelemetryTracker {
  constructor(options = {}) {
    this.onUpdate = options.onUpdate || (() => {});
    this.onError = options.onError || console.error;

    // Tracking state
    this.isTracking = false;
    this.watchId = null;

    // Position history
    this.lastPosition = null;
    this.lastTimestamp = 0;

    // Speed states (km/h)
    this.rawSpeed = 0;
    this.filteredSpeed = 0;

    // Acceleration states (m/s^2 & G)
    this.acceleration = 0;
    this.gForce = 0;
    this.throttleEstimate = 0;

    // Device Motion (Accelerometer)
    this.hasMotion = false;
    this.motionAvailable = false;
    this.calibratedZeroG = { x: 0, y: 0, z: 0 };
    this.currentAccel = { x: 0, y: 0, z: 0 };

    // Update rate metrics
    this.updateCount = 0;
    this.lastRateCheck = performance.now();
    this.currentHz = 0;

    // Kalman Filter variables for speed
    this.kalman = {
      q: 0.8, // Process noise
      r: 1.5, // Measurement noise
      x: 0,   // Estimated speed
      p: 1,   // Estimation error covariance
      k: 0    // Kalman gain
    };

    // Haversine earth radius in meters
    this.EARTH_RADIUS = 6371000;
  }

  // Request permissions and start watching GPS & Motion
  async start() {
    if (this.isTracking) return true;

    // 1. DeviceMotionEvent permission (required for iOS 13+ and modern Safari)
    if (typeof DeviceMotionEvent !== 'undefined' && typeof DeviceMotionEvent.requestPermission === 'function') {
      try {
        const response = await DeviceMotionEvent.requestPermission();
        if (response === 'granted') {
          this.bindMotionEvents();
        }
      } catch (err) {
        console.warn('DeviceMotionEvent permission error:', err);
      }
    } else if (typeof window !== 'undefined' && 'ondevicemotion' in window) {
      this.bindMotionEvents();
    }

    // 2. High-Accuracy Geolocation Watcher
    if (!navigator.geolocation) {
      this.onError(new Error('Geolocation API не поддерживается данным браузером.'));
      return false;
    }

    const geoOptions = {
      enableHighAccuracy: true,  // Forces GPS hardware GNSS rather than WiFi/Cell tower triangulation
      maximumAge: 0,            // Do not use cached readings
      timeout: 6000             // High frequency timeout
    };

    this.watchId = navigator.geolocation.watchPosition(
      (pos) => this.handleGeoUpdate(pos),
      (err) => this.handleGeoError(err),
      geoOptions
    );

    this.isTracking = true;
    console.log('TelemetryTracker: High-Precision GPS tracking started.');
    return true;
  }

  stop() {
    if (this.watchId !== null) {
      navigator.geolocation.clearWatch(this.watchId);
      this.watchId = null;
    }
    if (this.hasMotion) {
      window.removeEventListener('devicemotion', this.handleMotionEventBound);
      this.hasMotion = false;
    }
    this.isTracking = false;
  }

  bindMotionEvents() {
    this.handleMotionEventBound = (e) => this.handleMotionEvent(e);
    window.addEventListener('devicemotion', this.handleMotionEventBound, { passive: true });
    this.hasMotion = true;
    this.motionAvailable = true;
  }

  // Calibrate current orientation as 0 G (idle vehicle state)
  calibrateZero() {
    this.calibratedZeroG = { ...this.currentAccel };
    console.log('Accelerometer zero calibrated:', this.calibratedZeroG);
  }

  // Process high-frequency accelerometer events (30 - 60 Hz)
  handleMotionEvent(event) {
    const acc = event.acceleration || event.accelerationIncludingGravity;
    if (!acc) return;

    // Use forward/backward axis (typically Z or Y depending on phone orientation)
    const rawX = acc.x || 0;
    const rawY = acc.y || 0;
    const rawZ = acc.z || 0;

    this.currentAccel = { x: rawX, y: rawY, z: rawZ };

    // Magnitude of linear acceleration in horizontal plane
    const forwardVector = Math.hypot(rawX - this.calibratedZeroG.x, rawY - this.calibratedZeroG.y);
    const instantG = forwardVector / 9.80665;

    // If phone detects significant forward surge, blend into throttle estimation instantly
    if (forwardVector > 0.4) {
      // Fast attack
      this.throttleEstimate = Math.min(1.0, forwardVector / 3.5);
    } else {
      // Decay
      this.throttleEstimate *= 0.88;
    }

    // Measure update rate
    this.updateCount++;
    const now = performance.now();
    if (now - this.lastRateCheck >= 1000) {
      this.currentHz = Math.round((this.updateCount * 1000) / (now - this.lastRateCheck));
      this.updateCount = 0;
      this.lastRateCheck = now;
    }
  }

  // High-precision Haversine distance in meters
  calculateHaversineDistance(lat1, lon1, lat2, lon2) {
    const toRad = Math.PI / 180.0;
    const dLat = (lat2 - lat1) * toRad;
    const dLon = (lon2 - lon1) * toRad;
    const phi1 = lat1 * toRad;
    const phi2 = lat2 * toRad;

    const a = Math.sin(dLat / 2) * Math.sin(dLat / 2) +
              Math.cos(phi1) * Math.cos(phi2) *
              Math.sin(dLon / 2) * Math.sin(dLon / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    return this.EARTH_RADIUS * c;
  }

  // Kalman 1D speed update
  updateKalmanSpeed(measurement) {
    // Prediction update
    this.kalman.p = this.kalman.p + this.kalman.q;
    // Measurement update
    this.kalman.k = this.kalman.p / (this.kalman.p + this.kalman.r);
    this.kalman.x = this.kalman.x + this.kalman.k * (measurement - this.kalman.x);
    this.kalman.p = (1 - this.kalman.k) * this.kalman.p;
    return this.kalman.x;
  }

  handleGeoUpdate(position) {
    const now = performance.now();
    const coords = position.coords;
    const currentTimestamp = position.timestamp || Date.now();

    let computedSpeedKmh = 0;

    // Check if hardware chipset provides direct GNSS Doppler speed
    if (coords.speed !== null && coords.speed !== undefined && !isNaN(coords.speed) && coords.speed >= 0) {
      computedSpeedKmh = coords.speed * 3.6; // convert m/s to km/h
    } else if (this.lastPosition) {
      // Fallback: high precision differential distance / time
      const dtSec = (currentTimestamp - this.lastTimestamp) / 1000.0;
      if (dtSec > 0.1 && dtSec < 10.0) {
        const distMeters = this.calculateHaversineDistance(
          this.lastPosition.coords.latitude,
          this.lastPosition.coords.longitude,
          coords.latitude,
          coords.longitude
        );
        // Only consider if greater than GPS noise floor
        const accuracy = coords.accuracy || 10;
        if (distMeters > Math.max(1.5, accuracy * 0.15)) {
          computedSpeedKmh = (distMeters / dtSec) * 3.6;
        }
      }
    }

    // Suppress stationary GPS drift (jitter when parked at traffic lights)
    if (computedSpeedKmh < 1.2) {
      computedSpeedKmh = 0;
    }

    // Apply 1D Kalman filter to remove satellite multipath noise
    this.rawSpeed = computedSpeedKmh;
    this.filteredSpeed = this.updateKalmanSpeed(computedSpeedKmh);
    if (this.filteredSpeed < 0.5) this.filteredSpeed = 0;

    // Calculate longitudinal acceleration (m/s^2)
    const dt = this.lastTimestamp > 0 ? (currentTimestamp - this.lastTimestamp) / 1000.0 : 1.0;
    if (dt > 0.1 && this.lastPosition) {
      const v1 = (this.lastFilteredSpeed || 0) / 3.6; // m/s
      const v2 = this.filteredSpeed / 3.6;           // m/s
      this.acceleration = (v2 - v1) / dt;
      this.gForce = this.acceleration / 9.80665;
    }
    this.lastFilteredSpeed = this.filteredSpeed;

    // Compute throttle based on forward G-force or speed delta
    if (this.acceleration > 0.4) {
      this.throttleEstimate = Math.min(1.0, Math.max(this.throttleEstimate, this.acceleration / 2.8));
    } else if (this.acceleration < -0.3) {
      this.throttleEstimate = 0.0;
    }

    this.lastPosition = position;
    this.lastTimestamp = currentTimestamp;

    // Dispatch update package
    const telemetryData = {
      speed: Math.round(this.filteredSpeed * 10) / 10,
      rawSpeed: Math.round(this.rawSpeed * 10) / 10,
      speedMph: Math.round((this.filteredSpeed * 0.621371) * 10) / 10,
      acceleration: Math.round(this.acceleration * 100) / 100,
      gForce: Math.round(this.gForce * 100) / 100,
      throttle: Math.max(0, Math.min(1, Math.round(this.throttleEstimate * 100) / 100)),
      latitude: coords.latitude,
      longitude: coords.longitude,
      altitude: coords.altitude ? Math.round(coords.altitude) : null,
      accuracy: coords.accuracy ? Math.round(coords.accuracy * 10) / 10 : null,
      heading: coords.heading || null,
      hz: this.currentHz,
      motionAvailable: this.motionAvailable,
      timestamp: currentTimestamp
    };

    this.onUpdate(telemetryData);
  }

  handleGeoError(error) {
    let msg = 'Ошибка GPS датчика';
    switch (error.code) {
      case error.PERMISSION_DENIED:
        msg = 'Пользователь запретил доступ к геопозиции GPS.';
        break;
      case error.POSITION_UNAVAILABLE:
        msg = 'Сигнал GPS спутников недоступен.';
        break;
      case error.TIMEOUT:
        msg = 'Таймаут запроса к GPS модулю.';
        break;
    }
    this.onError(new Error(msg));
  }
}

window.TelemetryTracker = TelemetryTracker;
