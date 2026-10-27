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
  let isLaunchControl = false;
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

  // Preset Selector Elements
  const presetSelect = document.getElementById('presetSelect');
  const brandBadge = document.getElementById('brandBadge');
  const brandTitle = document.getElementById('brandTitle');
  const pedalLogo = document.querySelector('.pedal-logo');

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

  // Pedal Elements
  const pedalFrame = document.getElementById('pedalFrame');
  const pedalPercent = document.getElementById('pedalPercent');
  const pedalFill = document.getElementById('pedalFill');
  const blipBtn = document.getElementById('blipBtn');
  const launchBtn = document.getElementById('launchBtn');
  const brakeBtn = document.getElementById('brakeBtn');

  // Mode Buttons
  const tabBtns = document.querySelectorAll('.tab-btn');
  const gearBtns = document.querySelectorAll('.gear-mode-btn');

  // Set Canvas resolution
  function resizeCanvas() {
    const rect = canvas.getBoundingClientRect();
    canvas.width = rect.width * window.devicePixelRatio;
    canvas.height = rect.height * window.devicePixelRatio;
    ctx.scale(window.devicePixelRatio, window.devicePixelRatio);
  }
  window.addEventListener('resize', resizeCanvas);
  resizeCanvas();

  // 0. PRESET SELECTOR
  if (presetSelect) {
    presetSelect.addEventListener('change', async (e) => {
      const selectedId = e.target.value;
      const presetInfo = window.CAR_PRESETS ? window.CAR_PRESETS[selectedId] : null;
      if (presetInfo) {
        brandBadge.textContent = presetInfo.badge;
        brandTitle.textContent = `${presetInfo.name} ⏳`;
        if (pedalLogo) pedalLogo.textContent = presetInfo.name.toUpperCase();
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

  // 1. ENGINE START / STOP BUTTON & AUTO-UNLOCK
  async function unlockAndStartEngine() {
    if (audio.isPlaying) return;
    startBtn.textContent = 'ЗАПУСК...';
    startBtn.disabled = true;
    try {
      await audio.start();
      initTeslaMediaSession();
      startBtn.textContent = '⏹ ЗАГЛУШИТЬ';
      startBtn.className = 'btn btn-danger';
      startBtn.disabled = false;
      console.log('Engine successfully started!');
    } catch (err) {
      console.error('Audio start failed:', err);
      alert('Ошибка аудио: ' + (err.message || err));
      startBtn.textContent = 'START ENGINE';
      startBtn.className = 'btn btn-primary';
      startBtn.disabled = false;
    }
  }

  startBtn.addEventListener('click', async () => {
    if (!audio.isPlaying) {
      await unlockAndStartEngine();
    } else {
      audio.stop();
      startBtn.textContent = 'START ENGINE';
      startBtn.className = 'btn btn-primary';
    }
  });

  // Auto-start audio on first user touch/click on the pedal or action buttons
  function ensureAudioActive() {
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
  gearBtns.forEach(btn => {
    btn.addEventListener('click', () => {
      gearBtns.forEach(b => b.classList.remove('active'));
      btn.classList.add('active');
      const mode = btn.dataset.mode;
      audio.gearMode = mode;
      if (mode === 'N') {
        audio.gear = 0;
      } else if (audio.gear === 0) {
        audio.gear = 1;
      }
    });
  });

  // 5. INTERACTIVE TEST GAS PEDAL (Touch, Pointer & Drag support)
  function setPedalPressure(val) {
    ensureAudioActive();
    pedalThrottle = Math.max(0, Math.min(1, val));
    audio.targetThrottle = pedalThrottle;

    const pct = Math.round(pedalThrottle * 100);
    pedalPercent.textContent = `${pct}%`;
    pedalFill.style.width = `${pct}%`;

    if (pedalThrottle > 0.05) {
      pedalFrame.classList.add('active');
    } else {
      pedalFrame.classList.remove('active');
    }
  }

  function handlePedalPointer(e) {
    const rect = pedalFrame.getBoundingClientRect();
    const clientY = e.clientY || (e.touches && e.touches[0].clientY);
    if (!clientY) return;

    // Bottom of pedal is 100% press, top is 0%
    const relativeY = clientY - rect.top;
    const progress = Math.max(0, Math.min(1, relativeY / rect.height));
    // Non-linear realistic pedal curve
    setPedalPressure(Math.pow(progress, 0.9));
  }

  pedalFrame.addEventListener('pointerdown', (e) => {
    isPedalPressed = true;
    pedalFrame.setPointerCapture(e.pointerId);
    handlePedalPointer(e);
  });

  pedalFrame.addEventListener('pointermove', (e) => {
    if (isPedalPressed) {
      handlePedalPointer(e);
    }
  });

  const releasePedal = () => {
    if (isPedalPressed) {
      isPedalPressed = false;
      setPedalPressure(0);
    }
  };

  pedalFrame.addEventListener('pointerup', releasePedal);
  pedalFrame.addEventListener('pointercancel', releasePedal);

  // Quick Action Buttons
  blipBtn.addEventListener('click', () => {
    if (!audio.isPlaying) audio.start();
    setPedalPressure(0.85);
    setTimeout(() => setPedalPressure(0), 280);
  });

  launchBtn.addEventListener('click', () => {
    if (!audio.isPlaying) audio.start();
    if (isLaunchControl) return;

    isLaunchControl = true;
    launchBtn.textContent = 'HOLDING 4800 RPM...';
    audio.gear = 1;
    audio.gearMode = 'A';
    gearBtns.forEach(b => b.classList.toggle('active', b.dataset.mode === 'A'));

    // Hold launch RPM for 1.8 seconds, then dump clutch
    audio.targetThrottle = 0.55;
    setTimeout(() => {
      launchBtn.textContent = 'DUMP CLUTCH! 🚀';
      setPedalPressure(1.0);
      audio.triggerRandomPop(1.0);
      setTimeout(() => {
        launchBtn.textContent = '🚀 Launch Control';
        isLaunchControl = false;
      }, 2000);
    }, 1800);
  });

  brakeBtn.addEventListener('pointerdown', () => {
    setPedalPressure(0);
    audio.speed = Math.max(0, audio.speed - 45);
    if (audio.speed < 20 && audio.gear > 1) {
      audio.shiftDown();
    }
  });

  // 6. KEYBOARD HOTKEYS
  window.addEventListener('keydown', (e) => {
    if (e.target.tagName === 'INPUT') return;
    if (e.code === 'Space' || e.code === 'KeyW' || e.code === 'ArrowUp') {
      e.preventDefault();
      setPedalPressure(1.0);
    } else if (e.code === 'KeyS' || e.code === 'ArrowDown') {
      e.preventDefault();
      setPedalPressure(0);
      audio.speed = Math.max(0, audio.speed - 30);
    } else if (e.code === 'KeyE') {
      audio.shiftUp();
    } else if (e.code === 'KeyQ') {
      audio.shiftDown();
    }
  });

  window.addEventListener('keyup', (e) => {
    if (e.code === 'Space' || e.code === 'KeyW' || e.code === 'ArrowUp') {
      setPedalPressure(0);
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
    hudAccuracy.textContent = 'Ошибка';
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
    const w = canvas.width / window.devicePixelRatio;
    const h = canvas.height / window.devicePixelRatio;
    const cx = w / 2;
    const cy = h / 2;
    const radius = Math.min(cx, cy) - 18;

    const maxRpm = audio.maxRpm || 10000;
    const redlineRpm = audio.redlineRpm || 8400;

    ctx.clearRect(0, 0, w, h);

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
    const redlineStart = startAngle + (redlineRpm / maxRpm) * totalAngle;
    ctx.beginPath();
    ctx.arc(cx, cy, radius - 8, redlineStart, endAngle);
    ctx.strokeStyle = 'rgba(255, 34, 34, 0.8)';
    ctx.lineWidth = 8;
    ctx.stroke();

    // Minor & Major Ticks and numbers
    const numTicks = maxRpm / 100;
    for (let i = 0; i <= numTicks; i++) {
      const tickRpm = i * 100;
      const angle = startAngle + (tickRpm / maxRpm) * totalAngle;
      const isMajor = i % 10 === 0;
      const isMedium = i % 5 === 0;

      const inner = isMajor ? radius - 24 : isMedium ? radius - 16 : radius - 10;
      const outer = radius - 6;

      const x1 = cx + Math.cos(angle) * inner;
      const y1 = cy + Math.sin(angle) * inner;
      const x2 = cx + Math.cos(angle) * outer;
      const y2 = cy + Math.sin(angle) * outer;

      ctx.beginPath();
      ctx.moveTo(x1, y1);
      ctx.lineTo(x2, y2);
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
        ctx.fillText(i / 10, tx, ty);
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

  // Register MediaSession hardware button handlers (Left scroll wheel on Tesla steering wheel)
  function initTeslaMediaSession() {
    if ('mediaSession' in navigator) {
      try {
        navigator.mediaSession.metadata = new MediaMetadata({
          title: 'Tesla V10 Paddle Shifter Active',
          artist: 'Tesla Steering Wheel Controller',
          album: 'Left Scroll Wheel: Left/Right = Shift'
        });

        // 1. Tilt Left Wheel RIGHT -> Shift UP
        navigator.mediaSession.setActionHandler('nexttrack', () => {
          handleSteeringWheelShiftUp();
        });

        // 2. Tilt Left Wheel LEFT -> Shift DOWN
        navigator.mediaSession.setActionHandler('previoustrack', () => {
          handleSteeringWheelShiftDown();
        });

        // 3. Click Left Wheel IN (Pause/Play) -> Shift UP
        navigator.mediaSession.setActionHandler('play', () => {
          handleSteeringWheelShiftUp();
        });
        navigator.mediaSession.setActionHandler('pause', () => {
          handleSteeringWheelShiftDown();
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

    // Play silent keeper audio on user gesture to bind Tesla hardware media keys
    if (mediaSessionKeeper) {
      mediaSessionKeeper.volume = 0.01;
      mediaSessionKeeper.play().catch(() => {});
    }
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

    const gearText = audio.gear === 0 ? 'N' : audio.gear.toString();
    gearDisplay.textContent = gearText;
    speedDisplay.textContent = Math.round(audio.speed);

    // Render Canvas & Shift Lights
    drawGauge(currentRpm);
    updateShiftLights(currentRpm);

    animationFrameId = requestAnimationFrame(loop);
  }

  animationFrameId = requestAnimationFrame(loop);
});
