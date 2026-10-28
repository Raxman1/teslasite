/**
 * Tesla Sound Simulator - Internationalization (i18n) Engine (v8.1)
 * Complete Localization: EN, RU, DE, ES, FR, ZH, JA, PT, AR
 */
(function(window) {
  'use strict';

  const TRANSLATIONS = {
    en: {
      site_title: 'Tesla Supercar Sound Simulator | V10, V8 & Turbo',

      site_desc: 'Turn your electric vehicle into a legendary V10, V8, or Turbo supercar. Real-time GPS & P2P telemetry for Tesla Model 3/Y/S/X.',

      brand_curtain: '▼ GARAGE',

      car_picker_title: 'Select Supercar (22 Engines)',

      btn_start: 'START ENGINE',

      btn_stop: 'STOP ENGINE',

      btn_cranking: 'CRANKING...',

      btn_p2p: 'Link Phone',

      btn_fullscreen: 'Fullscreen',

      btn_pro: '⭐ PRO ($5/mo)',

      btn_pro_active: '👑 PRO ACTIVE',

      vol_motor: 'Engine',

      vol_bass: 'Subwoofer',

      vol_exhaust: 'Exhaust',

      unit_mph_label: '🇺🇸 Miles (MPH)',

      speed_unit_kmh: 'KM/H',

      speed_unit_mph: 'MPH',

      unit_kmh_short: 'km/h',

      unit_mph_short: 'mph',

      rpm_profile_1x: '⚙️ Revs: 1x (Standard)',

      rpm_profile_2x: '⚙️ Revs: 2x (Sport)',

      rpm_profile_3x: '⚙️ Revs: 3x (Track)',

      crackle_quiet: '🔇 Crackles: Off',

      crackle_sport: '💥 Crackles: Sport',

      crackle_fire: '🔥 Crackles: Flame',

      tab_pedal_full: '🕹️ Test Pedal (Simulator)',

      tab_pedal_short: '🕹️ Pedal',

      tab_gps_full: '🛰️ GPS Sensor (High Accuracy)',

      tab_gps_short: '🛰️ GPS',

      tab_p2p_full: '📱 Phone P2P Wireless Link',

      tab_p2p_short: '📱 P2P',

      card_driving_title: '🏎️ Driving Dynamics & Exhaust',

      setting_stop_filter: '🛑 Traffic Light Filter (GPS Stop-Zone)',

      setting_stop_hint: 'Eliminates sound twitching at standstill',

      deadzone_0_kmh: '0 km/h',

      deadzone_2_kmh: '2 km/h',

      deadzone_4_kmh: '4 km/h ★',

      deadzone_0_mph: '0 mph',

      deadzone_2_mph: '1.2 mph',

      deadzone_4_mph: '2.5 mph ★',

      setting_throttle_sens: '⚡ Throttle Sensitivity (Response)',

      setting_throttle_hint: 'Engine rev response speed',

      pill_comfort: '🚗 Comfort',

      pill_sport: '🏎️ Sport',

      pill_insane: '⚡ Instant',

      setting_exhaust_flaps: '🎺 Exhaust Flaps (Character)',

      setting_exhaust_hint: 'Exhaust acoustic tone',

      pill_stock: '🤫 Factory Stock',

      pill_straight: '🏁 Straight Pipe',

      setting_crackle: '💥 Exhaust Pops & Bangs',

      setting_crackle_hint: 'Crackles and fire on deceleration',

      pill_quiet: '🔇 Quiet',

      pill_fire: '🔥 Flame',

      card_acoustic_title: '⚡ Tesla Cabin Acoustics',

      card_speakers_count: '14 Speakers',

      btn_pro_toggle_on: '⚡ PRO: ON',

      btn_pro_toggle_off: '⚡ PRO: OFF',

      btn_settings_expand: '⚙️ Settings ▼',

      open_sound_notice: '<b>100% Raw Uncompressed Sound:</b> direct uncompressed acoustic stream to speakers',

      cabin_distribution_label: 'Cabin sound distribution:',

      stage_rear_exhaust: '🏎️ Rear Exhaust',

      stage_intake_exhaust: '🏁 Intake / Exhaust',

      stage_3d_surround: '🎧 3D Surround',

      stage_hood_exhaust: '🏎️ Hood / Exhaust',

      stage_all_rear: '🏁 All Rear',

      stage_exhaust_only: '💨 Exhaust Only',

      trim_label: '🚘 Tesla Configuration:',

      trim_desc: 'Long Range / Performance: Full 3D surround, pillar tweeters and 8" trunk subwoofer.',

      fader_label: '⚖️ Cabin Balance: Hood ↔ Exhaust',

      fader_center_text: '50 / 50 (Center)',

      balance_front: '🏎️ Front (Engine)',

      balance_center: '⚖️ Center',

      balance_rear: '💨 Rear (Exhaust)',

      adv_acoustic_toggle: '⚙️ Detailed Acoustic Settings (7) ▼',

      btn_reset: '↺ Reset',

      front_vol_label: '🏎️ Front Engine & Intake Volume',

      rear_vol_label: '💨 Rear Exhaust Volume',

      pops_vol_label: '💥 Pops & Bangs Level',

      bass_vol_label: '🔊 Subwoofer Vibration (Bass-Shaker)',

      delay_vol_label: '⏱️ Exhaust Distance Delay (4.7m vehicle body)',

      stereo_width_label: '🎧 3D Spatial Stereo Width (Tesla 14 Speakers)',

      turbo_title: '🌀 Turbo Whine & Supercharger',

      turbo_vol_label: 'Turbo Whine Volume',

      turbo_bov_label: '💥 Blow-Off & Wastegate Flutter (Stututu)',

      badge_on: 'ON',

      badge_off: 'OFF',

      dsp_tuning_title: '⚡ Exhaust Tuning & DSP',

      dsp_flow_label: 'Flow / Character',

      dsp_crackle_label: 'Crackles / Pops & Bangs',

      dsp_options_btn: '⚙️ Options',

      hud_title: '🛰️ GNSS Sensors & Live Telemetry',

      hud_speed_label: 'GPS Speed',

      hud_accel_label: 'Acceleration',

      hud_gforce_label: 'G-Force',

      hud_accuracy_label: 'Accuracy',

      hud_coords_label: 'GPS Coordinates',

      hud_searching: 'Searching for satellites...',

      hud_ready: 'GPS Ready • 0 km/h',

      hud_bg_pill: '🚀 In-Car Background Audio Active',

      pedal_brake: 'BRAKE',

      pedal_gas: 'THROTTLE',

      pedal_instruction: 'Press & hold or use [Space] / [W] for Gas, [S] for Brake',

      blip_btn: 'Blip Throttle',

      cruise_btn: 'Hold Throttle (Cruise)',

      wheel_shift_up: '▲ GEAR ',

      wheel_shift_down: '▼ GEAR ',

      modal_close: 'Close',

      p2p_modal_title: '📲 Link Tesla ↔ Smartphone',

      p2p_modal_desc: 'Scan the QR code with your smartphone or enter the pairing code. Your phone will transmit 60Hz precision accelerometer & GPS wirelessly to your Tesla screen!',

      p2p_waiting: 'Waiting for device connection...',

      p2p_or_code: 'Or connect this display to another code:',

      p2p_connect_btn: 'Connect',

      sub_badge: 'PREMIUM SOUND ENGINE',

      sub_title: 'Upgrade to Tesla Sound PRO',

      sub_subtitle: 'Unlock 22+ legendary supercar engines, 96kHz DSP audio, and wireless telemetry.',

      sub_monthly: 'Monthly',

      sub_yearly: 'Annual',

      sub_save_badge: '🎁 2 MONTHS FREE',

      sub_price_month: '$5',

      sub_per_month: '/ month',

      sub_price_year: '$50',

      sub_per_year: '/ year ($4.17/mo)',

      sub_feat_1: '🏎️ 22+ Supercars: Carrera GT V10, Hellcat V8, 2JZ, LFA, AMG & Ferrari V12',

      sub_feat_2: '⚡ Studio-grade 96kHz procedural DSP physical synthesis engine',

      sub_feat_3: '📱 High-rate 60Hz wireless phone accelerometer & smart GPS sync',

      sub_feat_4: '💥 Real anti-lag pops, fire crackles, and authentic supercharger whine',

      sub_feat_5: '🎮 Tesla steering wheel scroll wheel shifting integration',

      sub_feat_6: '🛡️ 14-day 100% money-back guarantee on annual plans',

      sub_cta_monthly: 'Subscribe for $5 / Month',

      sub_cta_yearly: 'Get Annual PRO for $50 (Save $10)',

      sub_promo_placeholder: 'Enter promo / license code',

      sub_apply_promo: 'Apply Code',

      sub_trust_secure: '🔒 256-bit Encrypted Checkout • Cancel Anytime with 1 Click',

      sub_promo_applied: '🎉 Promo code accepted! PRO mode unlocked.',

      sub_promo_invalid: '❌ Invalid promo code. Try PRO2026',

      sub_checkout_notice: '💳 Stripe checkout integration ready. Enter PRO2026 for instant demo unlock!',

      legal_title: 'Legal Documents & Compliance',

      tab_terms: 'Terms of Service',

      tab_privacy: 'Privacy Policy',

      tab_refund: 'Refund Policy',

      cookie_text: 'We respect your privacy: driving telemetry and sensor data are processed strictly 100% locally on your device.',

      cookie_accept: 'Accept & Continue',

      cookie_privacy: 'Privacy Policy',

      footer_copy: 'Tesla Sound Simulator • Professional Automotive Procedural Audio Platform',

      footer_wheel_hint: '🎮 <b>Tesla Steering Wheel:</b> Scroll wheel tilt Right = Gear Up (+), Left = Down (-) • Scroll = Volume',

      footer_gas_key: 'Gas',

      footer_brake_key: 'Brake',

      footer_gears_key: 'Gears down / up'
    },
    ru: {
      site_title: 'Tesla Звуковой Симулятор Суперкаров | V10, V8 и Турбо',

      site_desc: 'Превратите ваш электромобиль в легендарный V10, V8 или турбо-суперкар. Синхронизация по GPS и P2P акселерометру для Tesla Model 3/Y/S/X.',

      brand_curtain: '▼ ШТОРКА',

      car_picker_title: 'Выбор автомобиля (22 суперкара)',

      btn_start: 'START ENGINE',

      btn_stop: '⏹ ЗАГЛУШИТЬ',

      btn_cranking: '⚡ СТАРТЕР...',

      btn_p2p: 'Связка',

      btn_fullscreen: 'Экран',

      btn_pro: '⭐ PRO ($5/мес)',

      btn_pro_active: '👑 PRO АКТИВЕН',

      vol_motor: 'Мотор',

      vol_bass: 'Бас',

      vol_exhaust: 'Выхлоп',

      unit_mph_label: '🇺🇸 Мили (MPH)',

      speed_unit_kmh: 'КМ/Ч',

      speed_unit_mph: 'МИЛИ/Ч',

      unit_kmh_short: 'км/ч',

      unit_mph_short: 'mph',

      rpm_profile_1x: '⚙️ Обороты: 1x (Обычные)',

      rpm_profile_2x: '⚙️ Обороты: 2x (Спорт)',

      rpm_profile_3x: '⚙️ Обороты: 3x (Трек)',

      crackle_quiet: '🔇 Отстрелы: Тихо',

      crackle_sport: '💥 Отстрелы: Спорт',

      crackle_fire: '🔥 Отстрелы: Огонь',

      tab_pedal_full: '🕹️ Тест-Педаль (Симулятор)',

      tab_pedal_short: '🕹️ Педаль',

      tab_gps_full: '🛰️ GPS Сенсор (Макс. точность)',

      tab_gps_short: '🛰️ GPS',

      tab_p2p_full: '📱 P2P Линк с телефоном',

      tab_p2p_short: '📱 P2P',

      card_driving_title: '🏎️ Настройки вождения и выхлопа',

      setting_stop_filter: '🛑 Фильтр светофора (Стоп-зона GPS)',

      setting_stop_hint: 'Исключает дёргание на месте',

      deadzone_0_kmh: '0 км/ч',

      deadzone_2_kmh: '2 км/ч',

      deadzone_4_kmh: '4 км/ч ★',

      deadzone_0_mph: '0 mph',

      deadzone_2_mph: '1.2 mph',

      deadzone_4_mph: '2.5 mph ★',

      setting_throttle_sens: '⚡ Чувствительность газа (Отклик)',

      setting_throttle_hint: 'Реакция мотора на ускорение',

      pill_comfort: '🚗 Комфорт',

      pill_sport: '🏎️ Спорт',

      pill_insane: '⚡ Мгновенно',

      setting_exhaust_flaps: '🎺 Заслонки выхлопа (Характер)',

      setting_exhaust_hint: 'Звучание выхлопного тракта',

      pill_stock: '🤫 Заводской',

      pill_straight: '🏁 Прямоток',

      setting_crackle: '💥 Отстрелы выхлопа (Pops & Bangs)',

      setting_crackle_hint: 'Прострелы при сбросе газа',

      pill_quiet: '🔇 Тихо',

      pill_fire: '🔥 Огонь',

      card_acoustic_title: '⚡ Акустика салона Tesla',

      card_speakers_count: '14 колонок',

      btn_pro_toggle_on: '⚡ PRO: ВКЛ',

      btn_pro_toggle_off: '⚡ PRO: ВЫКЛ',

      btn_settings_expand: '⚙️ Настройки ▼',

      open_sound_notice: '<b>100% Открытый звук (БЕЗ компрессии):</b> прямой несжатый поток с максимальной динамикой прямо на динамики',

      cabin_distribution_label: 'Распределение звука по салону:',

      stage_rear_exhaust: '🏎️ Задний выхлоп',

      stage_intake_exhaust: '🏁 Впуск/Выхлоп',

      stage_3d_surround: '🎧 3D Окружение',

      stage_hood_exhaust: '🏎️ Капот/Выхлоп',

      stage_all_rear: '🏁 Всё сзади',

      stage_exhaust_only: '💨 Только выхлоп',

      trim_label: '🚘 Комплектация Tesla:',

      trim_desc: 'Long Range / Performance: Полный 3D-охват, твитеры в стойках и 8" сабвуфер в крыле багажника.',

      fader_label: '⚖️ Баланс салона: Капот ↔ Выхлоп',

      fader_center_text: '50 / 50 (Центр)',

      balance_front: '🏎️ Спереди (Мотор)',

      balance_center: '⚖️ Центр',

      balance_rear: '💨 Сзади (Выхлоп)',

      adv_acoustic_toggle: '⚙️ Подробные параметры акустики (7) ▼',

      btn_reset: '↺ Сброс',

      front_vol_label: '🏎️ Громкость двигателя и впуска (Спереди)',

      rear_vol_label: '💨 Громкость основного выхлопа (Сзади)',

      pops_vol_label: '💥 Отстрелы / Прострелы Pops & Bangs',

      bass_vol_label: '🔊 Вибрация сабвуфера (Бас-шейкер)',

      delay_vol_label: '⏱️ Задержка выхлопа (Ощущение длины машины 4.7м)',

      stereo_width_label: '🎧 3D Ширина стереосцены (14 динамиков Tesla)',

      turbo_title: '🌀 Свист турбин / Turbo Whine',

      turbo_vol_label: 'Громкость свиста турбин',

      turbo_bov_label: '💥 Сброс давления Blow-Off (Stututu)',

      badge_on: 'ВКЛ',

      badge_off: 'ВЫКЛ',

      dsp_tuning_title: '⚡ Тюнинг выхлопа и DSP',

      dsp_flow_label: 'Прямоток / Характер',

      dsp_crackle_label: 'Отстрелы / Pops & Bangs',

      dsp_options_btn: '⚙️ Опции',

      hud_title: '🛰️ Сенсоры и Телеметрия GNSS',

      hud_speed_label: 'GPS Скорость',

      hud_accel_label: 'Ускорение',

      hud_gforce_label: 'G-Сила',

      hud_accuracy_label: 'Точность',

      hud_coords_label: 'Координаты GPS',

      hud_searching: 'Поиск спутников...',

      hud_ready: 'GPS Готов • 0 км/ч',

      hud_bg_pill: '🚀 Фоновый звук в Tesla включён',

      pedal_brake: 'ТОРМОЗ',

      pedal_gas: 'ГАЗ',

      pedal_instruction: 'Удерживайте или нажимайте [Пробел] / [W] — Газ, [S] — Тормоз',

      blip_btn: 'Перегазовка',

      cruise_btn: 'Круиз-контроль',

      wheel_shift_up: '▲ ПЕРЕДАЧА ',

      wheel_shift_down: '▼ ПЕРЕДАЧА ',

      modal_close: 'Закрыть',

      p2p_modal_title: '📲 Связка Tesla ↔ Телефон',

      p2p_modal_desc: 'Отсканируйте QR-код смартфоном или откройте этот сайт на телефоне и введите код ниже. Телефон будет передавать данные акселерометра (60 Гц) и GPS без проводов!',

      p2p_waiting: 'Ожидание подключения...',

      p2p_or_code: 'Или подключите этот экран к другому коду:',

      p2p_connect_btn: 'Подключить',

      sub_badge: 'ПРЕМИУМ ПОДПИСКА',

      sub_title: 'Подписка Tesla Sound PRO',

      sub_subtitle: 'Откройте все 22 суперкара, студийный 96kHz DSP и беспроводную телеметрию.',

      sub_monthly: 'На месяц',

      sub_yearly: 'На год',

      sub_save_badge: '🎁 2 МЕСЯЦА БЕСПЛАТНО',

      sub_price_month: '$5',

      sub_per_month: '/ месяц',

      sub_price_year: '$50',

      sub_per_year: '/ год ($4.17/мес)',

      sub_feat_1: '🏎️ Все 22 суперкара: Carrera GT V10, Hellcat V8, 2JZ, LFA, AMG и Ferrari V12',

      sub_feat_2: '⚡ Студийный procedural DSP движок с 96kHz физическим синтезом',

      sub_feat_3: '📱 Высокоточная передача 60 Гц с телефона и фильтр GPS светофоров',

      sub_feat_4: '💥 Реалистичные отстрелы anti-lag, огонь в выхлопе и свист компрессора',

      sub_feat_5: '🎮 Переключение передач колесиком на руле Tesla',

      sub_feat_6: '🛡️ 14-дневная гарантия 100% возврата средств на годовом тарифе',

      sub_cta_monthly: 'Оформить подписку за $5 / мес',

      sub_cta_yearly: 'Оформить PRO на год за $50 (Скидка 17%)',

      sub_promo_placeholder: 'Введите промокод или лицензию',

      sub_apply_promo: 'Активировать',

      sub_trust_secure: '🔒 Безопасная оплата 256-bit SSL • Отмена в любой момент в 1 клик',

      sub_promo_applied: '🎉 Промокод принят! Режим PRO активирован.',

      sub_promo_invalid: '❌ Неверный промокод. Попробуйте PRO2026',

      sub_checkout_notice: '💳 Модуль платежей готов к подключению Stripe. Для мгновенного теста введите промокод PRO2026!',

      legal_title: 'Юридические документы и соглашения',

      tab_terms: 'Условия использования',

      tab_privacy: 'Политика конфиденциальности',

      tab_refund: 'Политика возвратов',

      cookie_text: 'Мы уважаем вашу приватность: телеметрия и координаты GPS обрабатываются строго локально на вашем устройстве.',

      cookie_accept: 'Понятно, продолжить',

      cookie_privacy: 'Политика конфиденциальности',

      footer_copy: 'Tesla Sound Simulator • Профессиональная платформа процедурного звука для электромобилей',

      footer_wheel_hint: '🎮 <b>Руль Tesla:</b> Наклон колесика Вправо = Передача вверх (+), Влево = Вниз (-) • Прокрутка = Громкость',

      footer_gas_key: 'Газ',

      footer_brake_key: 'Тормоз',

      footer_gears_key: 'Передачи вниз / вверх'
    },
    de: {
      site_title: 'Tesla Supersportwagen Sound Simulator | V10, V8 & Turbo',

      site_desc: 'Verwandeln Sie Ihr Elektroauto in einen V10, V8 oder Turbo-Supersportwagen. Echtzeit-GPS und P2P-Telemetrie.',

      brand_curtain: '▼ GARAGE',

      car_picker_title: 'Fahrzeugauswahl (22 Motoren)',

      btn_start: 'MOTOR STARTEN',

      btn_stop: 'MOTOR STOPPEN',

      btn_cranking: 'ANLASSER...',

      btn_p2p: 'Smartphone Kopplung',

      btn_fullscreen: 'Vollbild',

      btn_pro: '⭐ PRO (5 $/Monat)',

      btn_pro_active: '👑 PRO AKTIV',

      vol_motor: 'Motor',

      vol_bass: 'Subwoofer',

      vol_exhaust: 'Auspuff',

      unit_mph_label: '🇺🇸 Meilen (MPH)',

      speed_unit_kmh: 'KM/H',

      speed_unit_mph: 'MPH',

      unit_kmh_short: 'km/h',

      unit_mph_short: 'mph',

      rpm_profile_1x: '⚙️ Drehzahl: 1x (Standard)',

      rpm_profile_2x: '⚙️ Drehzahl: 2x (Sport)',

      rpm_profile_3x: '⚙️ Drehzahl: 3x (Rennstrecke)',

      crackle_quiet: '🔇 Fehlzündungen: Aus',

      crackle_sport: '💥 Fehlzündungen: Sport',

      crackle_fire: '🔥 Fehlzündungen: Flammen',

      tab_pedal_full: '🕹️ Test-Pedal (Simulator)',

      tab_pedal_short: '🕹️ Pedal',

      tab_gps_full: '🛰️ GPS-Sensor (Live)',

      tab_gps_short: '🛰️ GPS',

      tab_p2p_full: '📱 Smartphone P2P Kopplung',

      tab_p2p_short: '📱 P2P',

      card_driving_title: '🏎️ Fahrdynamik & Auspuff',

      setting_stop_filter: '🛑 Ampelfilter (GPS-Totzone)',

      setting_stop_hint: 'Verhindert Zucken im Stand',

      deadzone_0_kmh: '0 km/h',

      deadzone_2_kmh: '2 km/h',

      deadzone_4_kmh: '4 km/h ★',

      deadzone_0_mph: '0 mph',

      deadzone_2_mph: '1.2 mph',

      deadzone_4_mph: '2.5 mph ★',

      setting_throttle_sens: '⚡ Gasannahme (Reaktion)',

      setting_throttle_hint: 'Reaktionszeit der Drehzahl',

      pill_comfort: '🚗 Komfort',

      pill_sport: '🏎️ Sport',

      pill_insane: '⚡ Direkt',

      setting_exhaust_flaps: '🎺 Auspuffklappen (Charakter)',

      setting_exhaust_hint: 'Klangbild des Auspuffs',

      pill_stock: '🤫 Serienauspuff',

      pill_straight: '🏁 Sportabgasanlage',

      setting_crackle: '💥 Fehlzündungen (Pops & Bangs)',

      setting_crackle_hint: 'Schubabschaltung beim Gaswegnehmen',

      pill_quiet: '🔇 Leise',

      pill_fire: '🔥 Flammen',

      card_acoustic_title: '⚡ Tesla Innenraum-Akustik',

      card_speakers_count: '14 Lautsprecher',

      btn_pro_toggle_on: '⚡ PRO: EIN',

      btn_pro_toggle_off: '⚡ PRO: AUS',

      btn_settings_expand: '⚙️ Einstellungen ▼',

      open_sound_notice: '<b>100% Unkomprimierter Sound:</b> Direkter nativer DSP-Audiostream',

      cabin_distribution_label: 'Klangverteilung im Innenraum:',

      stage_rear_exhaust: '🏎️ Heckauspuff',

      stage_intake_exhaust: '🏁 Ansaugung / Auspuff',

      stage_3d_surround: '🎧 3D Raumklang',

      stage_hood_exhaust: '🏎️ Motorhaube / Auspuff',

      stage_all_rear: '🏁 Alles hinten',

      stage_exhaust_only: '💨 Nur Auspuff',

      trim_label: '🚘 Tesla Ausstattung:',

      trim_desc: 'Long Range / Performance: Volles 3D Surround, A-Säulen-Hochtöner und Kofferraum-Subwoofer.',

      fader_label: '⚖️ Klangbalance: Motorhaube ↔ Auspuff',

      fader_center_text: '50 / 50 (Mitte)',

      balance_front: '🏎️ Vorne (Motor)',

      balance_center: '⚖️ Mitte',

      balance_rear: '💨 Hinten (Auspuff)',

      adv_acoustic_toggle: '⚙️ Detaillierte Akustikparameter (7) ▼',

      btn_reset: '↺ Zurücksetzen',

      front_vol_label: '🏎️ Lautstärke Motor & Ansaugung (Vorne)',

      rear_vol_label: '💨 Lautstärke Hauptauspuff (Hinten)',

      pops_vol_label: '💥 Fehlzündungen Pops & Bangs Pegel',

      bass_vol_label: '🔊 Subwoofer Vibration (Bass-Shaker)',

      delay_vol_label: '⏱️ Auspuff-Verzögerung (4,7 m Fahrzeuglänge)',

      stereo_width_label: '🎧 3D Stereobreite (14 Lautsprecher)',

      turbo_title: '🌀 Turbolader-Pfeifen & Kompressor',

      turbo_vol_label: 'Lautstärke Laderpfeifen',

      turbo_bov_label: '💥 Blow-Off & Wastegate-Zischen (Stututu)',

      badge_on: 'EIN',

      badge_off: 'AUS',

      dsp_tuning_title: '⚡ Auspuff-Tuning & DSP',

      dsp_flow_label: 'Durchfluss / Charakter',

      dsp_crackle_label: 'Fehlzündungen / Pops & Bangs',

      dsp_options_btn: '⚙️ Optionen',

      hud_title: '📊 Cockpit-Telemetrie & G-Kräfte',

      hud_speed_label: 'GPS Geschwindigkeit',

      hud_accel_label: 'Beschleunigung',

      hud_gforce_label: 'G-Kraft',

      hud_accuracy_label: 'Genauigkeit',

      hud_coords_label: 'GPS-Koordinaten',

      hud_searching: 'Suche Satelliten...',

      hud_ready: 'GPS Bereit • 0 km/h',

      hud_bg_pill: '🚀 Hintergrund-Audio aktiv',

      pedal_brake: 'BREMSE',

      pedal_gas: 'GAS',

      pedal_instruction: 'Halten oder [Leertaste] / [W] für Gas, [S] für Bremse drücken',

      blip_btn: 'Zwischengas',

      cruise_btn: 'Tempomat',

      wheel_shift_up: '▲ GANG ',

      wheel_shift_down: '▼ GANG ',

      modal_close: 'Schließen',

      p2p_modal_title: '📲 Tesla ↔ Smartphone Kopplung',

      p2p_modal_desc: 'QR-Code scannen oder Code eingeben für kabellose 60Hz Telemetrieübertragung.',

      p2p_waiting: 'Warte auf Verbindung...',

      p2p_or_code: 'Oder Code manuell eingeben:',

      p2p_connect_btn: 'Verbinden',

      sub_badge: 'PREMIUM SOUND-ABO',

      sub_title: 'Tesla Sound PRO Upgrade',

      sub_subtitle: 'Alle 22 Supersportwagen, 96kHz DSP und kabellose Telemetrie freischalten.',

      sub_monthly: 'Monatlich',

      sub_yearly: 'Jährlich',

      sub_save_badge: '🎁 2 MONATE KOSTENLOS',

      sub_price_month: '5 $',

      sub_per_month: '/ Monat',

      sub_price_year: '50 $',

      sub_per_year: '/ Jahr (4,17 $/Mo)',

      sub_feat_1: '🏎️ 22+ Sportwagen: Carrera GT V10, Hellcat V8, 2JZ, LFA & Ferrari V12',

      sub_feat_2: '⚡ 96kHz Studio DSP Physical Synthesis Audio Engine',

      sub_feat_3: '📱 60Hz Smartphone-Gyroskop & intelligenter GPS-Filter',

      sub_feat_4: '💥 Anti-Lag Auspuffschläge & Kompressorpfeifen',

      sub_feat_5: '🎮 Tesla Lenkrad-Schaltrad Integration',

      sub_feat_6: '🛡️ 14 Tage Geld-zurück-Garantie auf Jahresabos',

      sub_cta_monthly: 'Monatlich abonnieren (5 $/Mo)',

      sub_cta_yearly: 'Jahres-PRO sichern (50 $/Jahr)',

      sub_promo_placeholder: 'Gutscheincode eingeben',

      sub_apply_promo: 'Einlösen',

      sub_trust_secure: '🔒 256-Bit SSL-Verschlüsselung • Jederzeit mit 1 Klick kündbar',

      sub_promo_applied: '🎉 Gutschein akzeptiert! PRO-Modus aktiv.',

      sub_promo_invalid: '❌ Ungültiger Code. Probieren Sie PRO2026',

      sub_checkout_notice: '💳 Stripe-Checkout bereit. Nutzen Sie PRO2026 zum sofortigen Freischalten!',

      legal_title: 'Rechtliche Dokumente & Richtlinien',

      tab_terms: 'Nutzungsbedingungen',

      tab_privacy: 'Datenschutz',

      tab_refund: 'Rückerstattung',

      cookie_text: 'Ihre Telemetriedaten werden ausschließlich lokal auf Ihrem Gerät verarbeitet.',

      cookie_accept: 'Akzeptieren & Fortfahren',

      cookie_privacy: 'Datenschutz',

      footer_copy: 'Tesla Sound Simulator • Professionelle Soundplattform',

      footer_wheel_hint: '🎮 <b>Tesla Lenkrad:</b> Scrollrad rechts kippen = Gang hoch (+), links = runter (-) • Drehen = Lautstärke',

      footer_gas_key: 'Gas',

      footer_brake_key: 'Bremse',

      footer_gears_key: 'Schalten hoch / runter'
    },
    es: {
      site_title: 'Simulador de Sonido de Superdeportivos para Tesla | V10, V8 y Turbo',

      site_desc: 'Transforma tu vehículo eléctrico con el sonido de superdeportivos legendarios. Telemetría GPS y P2P en tiempo real.',

      brand_curtain: '▼ GARAJE',

      car_picker_title: 'Seleccionar Coche (22 Motores)',

      btn_start: 'INICIAR MOTOR',

      btn_stop: 'DETENER MOTOR',

      btn_cranking: 'ARRANCANDO...',

      btn_p2p: 'Vincular Móvil',

      btn_fullscreen: 'Pantalla',

      btn_pro: '⭐ PRO ($5/mes)',

      btn_pro_active: '👑 PRO ACTIVO',

      vol_motor: 'Motor',

      vol_bass: 'Subwoofer',

      vol_exhaust: 'Escape',

      unit_mph_label: '🇺🇸 Millas (MPH)',

      speed_unit_kmh: 'KM/H',

      speed_unit_mph: 'MPH',

      unit_kmh_short: 'km/h',

      unit_mph_short: 'mph',

      rpm_profile_1x: '⚙️ RPM: 1x (Estándar)',

      rpm_profile_2x: '⚙️ RPM: 2x (Sport)',

      rpm_profile_3x: '⚙️ RPM: 3x (Pista)',

      crackle_quiet: '🔇 Petardeos: Off',

      crackle_sport: '💥 Petardeos: Sport',

      crackle_fire: '🔥 Petardeos: Fuego',

      tab_pedal_full: '🕹️ Test Pedal (Simulador)',

      tab_pedal_short: '🕹️ Pedal',

      tab_gps_full: '🛰️ Sensor GPS (En vivo)',

      tab_gps_short: '🛰️ GPS',

      tab_p2p_full: '📱 Enlace P2P con Móvil',

      tab_p2p_short: '📱 P2P',

      card_driving_title: '🏎️ Dinámica y Sonido de Escape',

      setting_stop_filter: '🛑 Filtro de Semáforo (Zona muerta GPS)',

      setting_stop_hint: 'Evita oscilaciones en reposo',

      deadzone_0_kmh: '0 km/h',

      deadzone_2_kmh: '2 km/h',

      deadzone_4_kmh: '4 km/h ★',

      deadzone_0_mph: '0 mph',

      deadzone_2_mph: '1.2 mph',

      deadzone_4_mph: '2.5 mph ★',

      setting_throttle_sens: '⚡ Respuesta de Aceleración',

      setting_throttle_hint: 'Rapidez de subida de vueltas',

      pill_comfort: '🚗 Confort',

      pill_sport: '🏎️ Sport',

      pill_insane: '⚡ Instantáneo',

      setting_exhaust_flaps: '🎺 Válvulas de Escape (Carácter)',

      setting_exhaust_hint: 'Sonoridad del sistema de escape',

      pill_stock: '🤫 Original',

      pill_straight: '🏁 Escape Libre',

      setting_crackle: '💥 Petardeos (Pops & Bangs)',

      setting_crackle_hint: 'Explosiones al levantar el pie del acelerador',

      pill_quiet: '🔇 Silencio',

      pill_fire: '🔥 Llamas',

      card_acoustic_title: '⚡ Acústica de Cabina Tesla',

      card_speakers_count: '14 Altavoces',

      btn_pro_toggle_on: '⚡ PRO: ON',

      btn_pro_toggle_off: '⚡ PRO: OFF',

      btn_settings_expand: '⚙️ Ajustes ▼',

      open_sound_notice: '<b>100% Sonido Puro Sin Compresión:</b> flujo directo de audio de máxima fidelidad',

      cabin_distribution_label: 'Distribución espacial del sonido:',

      stage_rear_exhaust: '🏎️ Escape Trasero',

      stage_intake_exhaust: '🏁 Admisión / Escape',

      stage_3d_surround: '🎧 3D Envolvente',

      stage_hood_exhaust: '🏎️ Capó / Escape',

      stage_all_rear: '🏁 Todo Atrás',

      stage_exhaust_only: '💨 Solo Escape',

      trim_label: '🚘 Configuración Tesla:',

      trim_desc: 'Long Range / Performance: Envolvente 3D total, altavoces en pilares y subwoofer de 8".',

      fader_label: '⚖️ Balance de Cabina: Capó ↔ Escape',

      fader_center_text: '50 / 50 (Centro)',

      balance_front: '🏎️ Delante (Motor)',

      balance_center: '⚖️ Centro',

      balance_rear: '💨 Detrás (Escape)',

      adv_acoustic_toggle: '⚙️ Parámetros acústicos avanzados (7) ▼',

      btn_reset: '↺ Restablecer',

      front_vol_label: '🏎️ Volumen Motor y Admisión (Frontal)',

      rear_vol_label: '💨 Volumen Escape Principal (Trasero)',

      pops_vol_label: '💥 Nivel de Petardeos Pops & Bangs',

      bass_vol_label: '🔊 Vibración Subwoofer (Bass-Shaker)',

      delay_vol_label: '⏱️ Retardo acústico (Longitud de vehículo 4.7m)',

      stereo_width_label: '🎧 Ancho estéreo 3D (14 Altavoces Tesla)',

      turbo_title: '🌀 Silbido de Turbo y Compresor',

      turbo_vol_label: 'Volumen Silbido de Turbo',

      turbo_bov_label: '💥 Válvula de Descarga Blow-Off (Stututu)',

      badge_on: 'ON',

      badge_off: 'OFF',

      dsp_tuning_title: '⚡ Ajustes de Escape y DSP',

      dsp_flow_label: 'Flujo / Carácter',

      dsp_crackle_label: 'Petardeos / Pops & Bangs',

      dsp_options_btn: '⚙️ Opciones',

      hud_title: '📊 Telemetría y Sensores GNSS',

      hud_speed_label: 'Velocidad GPS',

      hud_accel_label: 'Aceleración',

      hud_gforce_label: 'Fuerza G',

      hud_accuracy_label: 'Precisión',

      hud_coords_label: 'Coordenadas GPS',

      hud_searching: 'Buscando satélites...',

      hud_ready: 'GPS Listo • 0 km/h',

      hud_bg_pill: '🚀 Audio en segundo plano activo',

      pedal_brake: 'FRENO',

      pedal_gas: 'ACELERADOR',

      pedal_instruction: 'Mantén pulsado o presiona [Espacio] / [W] para Gas, [S] para Freno',

      blip_btn: 'Golpe de Gas',

      cruise_btn: 'Control Crucero',

      wheel_shift_up: '▲ MARCHA ',

      wheel_shift_down: '▼ MARCHA ',

      modal_close: 'Cerrar',

      p2p_modal_title: '📲 Conectar Tesla ↔ Teléfono',

      p2p_modal_desc: 'Escanea el código QR o introduce el PIN para telemetría inalámbrica a 60 Hz.',

      p2p_waiting: 'Esperando conexión...',

      p2p_or_code: 'O ingresa otro PIN:',

      p2p_connect_btn: 'Conectar',

      sub_badge: 'SUSCRIPCIÓN PREMIUM',

      sub_title: 'Actualiza a Tesla Sound PRO',

      sub_subtitle: 'Desbloquea 22 superdeportivos, motor DSP a 96kHz y telemetría sin cables.',

      sub_monthly: 'Mensual',

      sub_yearly: 'Anual',

      sub_save_badge: '🎁 2 MESES GRATIS',

      sub_price_month: '$5',

      sub_per_month: '/ mes',

      sub_price_year: '$50',

      sub_per_year: '/ año ($4.17/mes)',

      sub_feat_1: '🏎️ 22+ Superdeportivos: Carrera GT V10, Hellcat V8, 2JZ, LFA y Ferrari V12',

      sub_feat_2: '⚡ Motor de síntesis DSP procedimental con audio a 96 kHz',

      sub_feat_3: '📱 Acelerómetro de teléfono a 60 Hz y filtro inteligente GPS',

      sub_feat_4: '💥 Petardeos anti-lag y aullido auténtico de compresor',

      sub_feat_5: '🎮 Cambio de marcha con la rueda del volante Tesla',

      sub_feat_6: '🛡️ Garantía de reembolso de 14 días en plan anual',

      sub_cta_monthly: 'Suscribirse por $5 / mes',

      sub_cta_yearly: 'Comprar Anual por $50 (Ahorra $10)',

      sub_promo_placeholder: 'Código de descuento o licencia',

      sub_apply_promo: 'Canjear',

      sub_trust_secure: '🔒 Pago seguro SSL 256-bit • Cancela con 1 clic',

      sub_promo_applied: '🎉 ¡Código aplicado! Modo PRO desbloqueado.',

      sub_promo_invalid: '❌ Código inválido. Prueba PRO2026',

      sub_checkout_notice: '💳 Integración de pago lista. ¡Ingresa PRO2026 para probar de inmediato!',

      legal_title: 'Documentos Legales y Cumplimiento',

      tab_terms: 'Términos de Servicio',

      tab_privacy: 'Privacidad',

      tab_refund: 'Reembolsos',

      cookie_text: 'Respetamos tu privacidad: los datos de telemetría y GPS se procesan 100% de forma local.',

      cookie_accept: 'Aceptar y continuar',

      cookie_privacy: 'Privacidad',

      footer_copy: 'Tesla Sound Simulator • Plataforma de Audio Procedimental',

      footer_wheel_hint: '🎮 <b>Volante Tesla:</b> Rueda hacia la derecha = Subir marcha (+), Izquierda = Bajar (-) • Girar = Volumen',

      footer_gas_key: 'Acelerador',

      footer_brake_key: 'Freno',

      footer_gears_key: 'Cambiar marchas'
    },
    fr: {
      site_title: 'Simulateur Sonore de Supercars pour Tesla | V10, V8 & Turbo',

      site_desc: 'Sublimez votre Tesla avec le vrombissement des supercars légendaires. Synchronisation GPS et accéléromètre sans fil.',

      brand_curtain: '▼ GARAGE',

      car_picker_title: 'Choisir un Véhicule (22 Moteurs)',

      btn_start: 'DÉMARRER',

      btn_stop: 'ARRÊTER',

      btn_cranking: 'DÉMARREUR...',

      btn_p2p: 'Liaison Mobile',

      btn_fullscreen: 'Plein Écran',

      btn_pro: '⭐ PRO (5 $/mois)',

      btn_pro_active: '👑 PRO ACTIF',

      vol_motor: 'Moteur',

      vol_bass: 'Caisson',

      vol_exhaust: 'Échappement',

      unit_mph_label: '🇺🇸 Miles (MPH)',

      speed_unit_kmh: 'KM/H',

      speed_unit_mph: 'MPH',

      unit_kmh_short: 'km/h',

      unit_mph_short: 'mph',

      rpm_profile_1x: '⚙️ Régime: 1x (Standard)',

      rpm_profile_2x: '⚙️ Régime: 2x (Sport)',

      rpm_profile_3x: '⚙️ Régime: 3x (Piste)',

      crackle_quiet: '🔇 Pétarades: Off',

      crackle_sport: '💥 Pétarades: Sport',

      crackle_fire: '🔥 Pétarades: Flammes',

      tab_pedal_full: '🕹️ Test Pédale (Simulateur)',

      tab_pedal_short: '🕹️ Pédale',

      tab_gps_full: '🛰️ Capteur GPS (Direct)',

      tab_gps_short: '🛰️ GPS',

      tab_p2p_full: '📱 Liaison Smartphone P2P',

      tab_p2p_short: '📱 P2P',

      card_driving_title: '🏎️ Dynamique de Conduite & Échappement',

      setting_stop_filter: '🛑 Filtre Feu Rouge (Zone Morte GPS)',

      setting_stop_hint: 'Évite les sursauts à l\'arrêt',

      deadzone_0_kmh: '0 km/h',

      deadzone_2_kmh: '2 km/h',

      deadzone_4_kmh: '4 km/h ★',

      deadzone_0_mph: '0 mph',

      deadzone_2_mph: '1.2 mph',

      deadzone_4_mph: '2.5 mph ★',

      setting_throttle_sens: '⚡ Réactivité de l\'accélérateur',

      setting_throttle_hint: 'Montée en régime instantanée',

      pill_comfort: '🚗 Confort',

      pill_sport: '🏎️ Sport',

      pill_insane: '⚡ Instantané',

      setting_exhaust_flaps: '🎺 Clapets d\'échappement',

      setting_exhaust_hint: 'Sonorité de la ligne d\'échappement',

      pill_stock: '🤫 D\'origine',

      pill_straight: '🏁 Ligne Directe',

      setting_crackle: '💥 Pétarades (Pops & Bangs)',

      setting_crackle_hint: 'Détonations au lâcher de pied',

      pill_quiet: '🔇 Silencieux',

      pill_fire: '🔥 Flammes',

      card_acoustic_title: '⚡ Acoustique de l\'habitacle Tesla',

      card_speakers_count: '14 Haut-parleurs',

      btn_pro_toggle_on: '⚡ PRO: ON',

      btn_pro_toggle_off: '⚡ PRO: OFF',

      btn_settings_expand: '⚙️ Réglages ▼',

      open_sound_notice: '<b>100% Son Pur Non Compressé:</b> flux acoustique direct à dynamique maximale',

      cabin_distribution_label: 'Distribution spatiale du son:',

      stage_rear_exhaust: '🏎️ Échappement Arrière',

      stage_intake_exhaust: '🏁 Admission / Échappement',

      stage_3d_surround: '🎧 3D Surround',

      stage_hood_exhaust: '🏎️ Capot / Échappement',

      stage_all_rear: '🏁 Tout à l\'arrière',

      stage_exhaust_only: '💨 Échappement Seul',

      trim_label: '🚘 Configuration Tesla:',

      trim_desc: 'Long Range / Performance: Surround 3D intégral, tweeters de montants et caisson 8".',

      fader_label: '⚖️ Balance Habitacle: Capot ↔ Échappement',

      fader_center_text: '50 / 50 (Centre)',

      balance_front: '🏎️ Avant (Moteur)',

      balance_center: '⚖️ Centre',

      balance_rear: '💨 Arrière (Échappement)',

      adv_acoustic_toggle: '⚙️ Paramètres acoustiques détaillés (7) ▼',

      btn_reset: '↺ Réinitialiser',

      front_vol_label: '🏎️ Volume Moteur & Admission (Avant)',

      rear_vol_label: '💨 Volume Échappement Principal (Arrière)',

      pops_vol_label: '💥 Niveau des Détonations Pops & Bangs',

      bass_vol_label: '🔊 Vibration du Caisson (Bass-Shaker)',

      delay_vol_label: '⏱️ Délai Acoustique (Longueur du véhicule 4,7 m)',

      stereo_width_label: '🎧 Largeur Stéréo 3D (14 Haut-parleurs Tesla)',

      turbo_title: '🌀 Sifflement Turbo & Compresseur',

      turbo_vol_label: 'Volume Sifflement Turbo',

      turbo_bov_label: '💥 Décharge Blow-Off & Flutter (Stututu)',

      badge_on: 'ON',

      badge_off: 'OFF',

      dsp_tuning_title: '⚡ Réglages Échappement & DSP',

      dsp_flow_label: 'Flux / Caractère',

      dsp_crackle_label: 'Pétarades / Pops & Bangs',

      dsp_options_btn: '⚙️ Options',

      hud_title: '📊 Télémétrie et Capteurs GNSS',

      hud_speed_label: 'Vitesse GPS',

      hud_accel_label: 'Accélération',

      hud_gforce_label: 'Force G',

      hud_accuracy_label: 'Précision',

      hud_coords_label: 'Coordonnées GPS',

      hud_searching: 'Recherche de satellites...',

      hud_ready: 'GPS Prêt • 0 km/h',

      hud_bg_pill: '🚀 Audio d\'arrière-plan actif',

      pedal_brake: 'FREIN',

      pedal_gas: 'ACCÉLÉRATEUR',

      pedal_instruction: 'Maintenez ou utilisez [Espace] / [W] pour l\'accélérateur, [S] pour le frein',

      blip_btn: 'Coup de Gaz',

      cruise_btn: 'Régulateur',

      wheel_shift_up: '▲ RAPPORT ',

      wheel_shift_down: '▼ RAPPORT ',

      modal_close: 'Fermer',

      p2p_modal_title: '📲 Connexion Tesla ↔ Téléphone',

      p2p_modal_desc: 'Scannez le code QR pour relier votre smartphone avec 60 Hz de précision.',

      p2p_waiting: 'En attente de connexion...',

      p2p_or_code: 'Ou saisir le code PIN:',

      p2p_connect_btn: 'Connecter',

      sub_badge: 'ABONNEMENT PREMIUM',

      sub_title: 'Passer à Tesla Sound PRO',

      sub_subtitle: 'Débloquez 22 supercars, DSP physique 96 kHz et télémétrie intégrale.',

      sub_monthly: 'Mensuel',

      sub_yearly: 'Annuel',

      sub_save_badge: '🎁 2 MOIS OFFERTS',

      sub_price_month: '5 $',

      sub_per_month: '/ mois',

      sub_price_year: '50 $',

      sub_per_year: '/ an (4,17 $/mois)',

      sub_feat_1: '🏎️ 22 Supercars: Carrera GT V10, Hellcat V8, 2JZ, LFA & Ferrari V12',

      sub_feat_2: '⚡ Synthèse physique DSP studio 96 kHz sans latence',

      sub_feat_3: '📱 Accéléromètre smartphone 60 Hz et filtre GPS intelligent',

      sub_feat_4: '💥 Détonations d\'échappement anti-lag et compresseur',

      sub_feat_5: '🎮 Passage des vitesses à la molette du volant Tesla',

      sub_feat_6: '🛡️ Garantie satisfait ou remboursé 14 jours sur l\'offre annuelle',

      sub_cta_monthly: 'S\'abonner pour 5 $ / mois',

      sub_cta_yearly: 'Offre Annuelle à 50 $ (Économisez 10 $)',

      sub_promo_placeholder: 'Code promo ou clé de licence',

      sub_apply_promo: 'Appliquer',

      sub_trust_secure: '🔒 Paiement sécurisé SSL 256-bit • Sans engagement',

      sub_promo_applied: '🎉 Code activé avec succès ! Mode PRO débloqué.',

      sub_promo_invalid: '❌ Code invalide. Essayez PRO2026',

      sub_checkout_notice: '💳 Passerelle de paiement prête. Utilisez PRO2026 pour débloquer immédiatement !',

      legal_title: 'Documents Légaux & Conformité',

      tab_terms: 'Conditions Générales',

      tab_privacy: 'Confidentialité',

      tab_refund: 'Remboursements',

      cookie_text: 'Vos données GPS et de conduite sont strictement traitées en local sur votre appareil.',

      cookie_accept: 'Accepter & Continuer',

      cookie_privacy: 'Confidentialité',

      footer_copy: 'Tesla Sound Simulator • Plateforme Sonore Haute Précision',

      footer_wheel_hint: '🎮 <b>Volant Tesla:</b> Molette inclinée à Droite = Vitesse supérieure (+), Gauche = Inférieure (-) • Défilement = Volume',

      footer_gas_key: 'Accélérateur',

      footer_brake_key: 'Frein',

      footer_gears_key: 'Passage des vitesses'
    },
    zh: {
      site_title: '特斯拉超跑声浪模拟器 | V10, V8 与涡轮增压',

      site_desc: '让您的电动汽车化身传奇 V10、V8 与涡轮超跑。实时 GPS 与手机无线遥控。',

      brand_curtain: '▼ 车库',

      car_picker_title: '选择超级跑车 (22 款引擎)',

      btn_start: '启动引擎',

      btn_stop: '熄火',

      btn_cranking: '起动机运转中...',

      btn_p2p: '手机互联',

      btn_fullscreen: '全屏',

      btn_pro: '⭐ PRO ($5/月)',

      btn_pro_active: '👑 PRO 已激活',

      vol_motor: '引擎音量',

      vol_bass: '低音炮',

      vol_exhaust: '排气声浪',

      unit_mph_label: '🇺🇸 英里 (MPH)',

      speed_unit_kmh: 'KM/H',

      speed_unit_mph: 'MPH',

      unit_kmh_short: 'km/h',

      unit_mph_short: 'mph',

      rpm_profile_1x: '⚙️ 转速: 1x (标准)',

      rpm_profile_2x: '⚙️ 转速: 2x (运动)',

      rpm_profile_3x: '⚙️ 转速: 3x (赛道)',

      crackle_quiet: '🔇 回火放炮: 静音',

      crackle_sport: '💥 回火放炮: 运动',

      crackle_fire: '🔥 回火放炮: 烈焰',

      tab_pedal_full: '🕹️ 油门踏板 (模拟测试)',

      tab_pedal_short: '🕹️ 踏板',

      tab_gps_full: '🛰️ GPS 测速 (高精度实时)',

      tab_gps_short: '🛰️ GPS',

      tab_p2p_full: '📱 手机无线 P2P 遥测',

      tab_p2p_short: '📱 P2P',

      card_driving_title: '🏎️ 驾驶动态与排气调校',

      setting_stop_filter: '🛑 红绿灯静止过滤 (GPS 盲区)',

      setting_stop_hint: '消除车辆停稳时的转速杂音与抖动',

      deadzone_0_kmh: '0 km/h',

      deadzone_2_kmh: '2 km/h',

      deadzone_4_kmh: '4 km/h ★',

      deadzone_0_mph: '0 mph',

      deadzone_2_mph: '1.2 mph',

      deadzone_4_mph: '2.5 mph ★',

      setting_throttle_sens: '⚡ 油门响应灵敏度 (爆发力)',

      setting_throttle_hint: '引擎转速攀升爆发速度',

      pill_comfort: '🚗 舒适',

      pill_sport: '🏎️ 运动',

      pill_insane: '⚡ 狂暴瞬间',

      setting_exhaust_flaps: '🎺 排气阀门开闭 (声浪性格)',

      setting_exhaust_hint: '排气管路共鸣特质',

      pill_stock: '🤫 原厂静音',

      pill_straight: '🏁 运动直通',

      setting_crackle: '💥 收油放炮与回火 (Pops & Bangs)',

      setting_crackle_hint: '换挡与松油时的爆燃火焰',

      pill_quiet: '🔇 静音',

      pill_fire: '🔥 烈焰',

      card_acoustic_title: '⚡ 特斯拉车厢沉浸声场',

      card_speakers_count: '14 扬声器',

      btn_pro_toggle_on: '⚡ PRO: 开启',

      btn_pro_toggle_off: '⚡ PRO: 关闭',

      btn_settings_expand: '⚙️ 设置 ▼',

      open_sound_notice: '<b>100% 原始未压缩声学流:</b> 极高动态范围直通扬声器',

      cabin_distribution_label: '车内声学分布配置:',

      stage_rear_exhaust: '🏎️ 纯后排气',

      stage_intake_exhaust: '🏁 前进气 / 后排气',

      stage_3d_surround: '🎧 3D 环绕声',

      stage_hood_exhaust: '🏎️ 机盖 / 排气',

      stage_all_rear: '🏁 引擎排气全后置',

      stage_exhaust_only: '💨 仅尾段排气',

      trim_label: '🚘 特斯拉车型音响版本:',

      trim_desc: 'Long Range / Performance: 全车 3D 环绕，立柱高音与后备厢 8 英寸低音炮。',

      fader_label: '⚖️ 车内声场平衡: 前机盖 ↔ 尾段排气',

      fader_center_text: '50 / 50 (居中)',

      balance_front: '🏎️ 前置 (引擎)',

      balance_center: '⚖️ 居中',

      balance_rear: '💨 后置 (排气)',

      adv_acoustic_toggle: '⚙️ 详细声学参数微调 (7项) ▼',

      btn_reset: '↺ 恢复默认',

      front_vol_label: '🏎️ 前部引擎与进气音量',

      rear_vol_label: '💨 后部主力排气音量',

      pops_vol_label: '💥 回火放炮爆鸣声量',

      bass_vol_label: '🔊 低音炮震感 (重低音)',

      delay_vol_label: '⏱️ 排气声学延迟 (模拟4.7米车长)',

      stereo_width_label: '🎧 3D 立体声声场宽度 (14扬声器)',

      turbo_title: '🌀 涡轮高频尖啸与机械增压',

      turbo_vol_label: '涡轮增压哨音音量',

      turbo_bov_label: '💥 泄压阀放气声 Blow-Off (Stututu)',

      badge_on: '开启',

      badge_off: '关闭',

      dsp_tuning_title: '⚡ 排气声调与 DSP 物理声学',

      dsp_flow_label: '通气性格 / 粗犷度',

      dsp_crackle_label: '回火点火爆炸烈度',

      dsp_options_btn: '⚙️ 选项',

      hud_title: '📊 实时仪表盘与重力感应',

      hud_speed_label: 'GPS 航速',

      hud_accel_label: '加速度',

      hud_gforce_label: '重力加速度 G',

      hud_accuracy_label: '定位精度',

      hud_coords_label: 'GPS 坐标',

      hud_searching: '卫星搜寻中...',

      hud_ready: 'GPS 就绪 • 0 km/h',

      hud_bg_pill: '🚀 车载后台音频保持运行',

      pedal_brake: '刹车',

      pedal_gas: '油门',

      pedal_instruction: '长按或按住 [空格键] / [W] 轰油门，[S] 刹车',

      blip_btn: '自动降档补油',

      cruise_btn: '油门定速巡航',

      wheel_shift_up: '▲ 升档 ',

      wheel_shift_down: '▼ 降档 ',

      modal_close: '关闭',

      p2p_modal_title: '📲 特斯拉 ↔ 手机无线互联',

      p2p_modal_desc: '使用手机扫描二维码或输入配对码，手机将以 60Hz 采样率向中控屏无线传输高精度加速度和 GPS 速度！',

      p2p_waiting: '等待设备接入中...',

      p2p_or_code: '或在此输入其他配对码:',

      p2p_connect_btn: '连接',

      sub_badge: 'PRO 高级会员',

      sub_title: '升级到特斯拉声浪 PRO',

      sub_subtitle: '解锁全部 22 款超跑引擎、96kHz 录音棚级物理声学 DSP 与无线遥测。',

      sub_monthly: '按月订阅',

      sub_yearly: '按年订阅',

      sub_save_badge: '🎁 免费赠送 2 个月',

      sub_price_month: '$5',

      sub_per_month: '/ 月',

      sub_price_year: '$50',

      sub_per_year: '/ 年 (每月仅需 $4.17)',

      sub_feat_1: '🏎️ 解锁全部 22 款超跑：Carrera GT V10, 地狱猫 V8, 2JZ, LFA, AMG, 法拉利 V12',

      sub_feat_2: '⚡ 96kHz 极速低延迟物理合成 DSP 音频核心',

      sub_feat_3: '📱 60Hz 手机加速度陀螺仪实时互联与红绿灯过滤',

      sub_feat_4: '💥 真实的偏时点火 (Anti-lag) 放炮声与机械增压声浪',

      sub_feat_5: '🎮 特斯拉方向盘滚轮直接换挡体验',

      sub_feat_6: '🛡️ 年度订阅享 14 天 100% 全额退款保障',

      sub_cta_monthly: '以 $5 / 月 立即订阅',

      sub_cta_yearly: '以 $50 开启年度 PRO (立省 $10)',

      sub_promo_placeholder: '输入优惠券或兑换激活码',

      sub_apply_promo: '兑换',

      sub_trust_secure: '🔒 256 位 SSL 安全交易 • 随时一键取消',

      sub_promo_applied: '🎉 激活码验证成功！PRO 权限已开启。',

      sub_promo_invalid: '❌ 无效的激活码。可尝试 PRO2026',

      sub_checkout_notice: '💳 支付网关准备就绪。演示体验可输入 PRO2026 立即免费解锁！',

      legal_title: '法律条款与合规声明',

      tab_terms: '用户协议',

      tab_privacy: '隐私政策',

      tab_refund: '退款政策',

      cookie_text: '我们尊重您的隐私：所有 GPS 与驾驶数据均 100% 在您的本地设备中运行计算。',

      cookie_accept: '同意并继续',

      cookie_privacy: '隐私政策',

      footer_copy: '特斯拉声浪模拟器 • 专业级电动汽车物理音频引擎',

      footer_wheel_hint: '🎮 <b>特斯拉方向盘:</b> 滚轮向右倾斜 = 升档 (+)，向左 = 降档 (-) • 滚动 = 音量调节',

      footer_gas_key: '油门',

      footer_brake_key: '刹车',

      footer_gears_key: '降档 / 升档'
    },
    ja: {
      site_title: 'テスラ スーパーカーサウンドシミュレーター | V10, V8 & Turbo',

      site_desc: '電気自動車を伝説のV10、V8、ターボスーパーカーへ。GPS＆スマホP2Pリアルタイム連携。',

      brand_curtain: '▼ ガレージ',

      car_picker_title: 'マシン選択 (22種)',

      btn_start: 'エンジン始動',

      btn_stop: 'エンジン停止',

      btn_cranking: 'セルモーター回転中...',

      btn_p2p: 'スマホ連携',

      btn_fullscreen: '全画面',

      btn_pro: '⭐ PRO ($5/月)',

      btn_pro_active: '👑 PRO 有効',

      vol_motor: 'エンジン音量',

      vol_bass: 'サブウーファー',

      vol_exhaust: '排気サウンド',

      unit_mph_label: '🇺🇸 マイル (MPH)',

      speed_unit_kmh: 'KM/H',

      speed_unit_mph: 'MPH',

      unit_kmh_short: 'km/h',

      unit_mph_short: 'mph',

      rpm_profile_1x: '⚙️ 回転数: 1x (通常)',

      rpm_profile_2x: '⚙️ 回転数: 2x (スポーツ)',

      rpm_profile_3x: '⚙️ 回転数: 3x (サーキット)',

      crackle_quiet: '🔇 アフターファイヤー: オフ',

      crackle_sport: '💥 アフターファイヤー: スポーツ',

      crackle_fire: '🔥 アフターファイヤー: 炎',

      tab_pedal_full: '🕹️ ペダル操作 (シミュレーター)',

      tab_pedal_short: '🕹️ ペダル',

      tab_gps_full: '🛰️ GPSセンサー (高精度)',

      tab_gps_short: '🛰️ GPS',

      tab_p2p_full: '📱 スマホ無線連携',

      tab_p2p_short: '📱 P2P',

      card_driving_title: '🏎️ 走行特性・エキゾースト設定',

      setting_stop_filter: '🛑 信号待ちフィルター (GPS不感帯)',

      setting_stop_hint: '停車中の不快なブレを防止',

      deadzone_0_kmh: '0 km/h',

      deadzone_2_kmh: '2 km/h',

      deadzone_4_kmh: '4 km/h ★',

      deadzone_0_mph: '0 mph',

      deadzone_2_mph: '1.2 mph',

      deadzone_4_mph: '2.5 mph ★',

      setting_throttle_sens: '⚡ スロットルレスポンス (応答性)',

      setting_throttle_hint: '回転数上昇の鋭さ',

      pill_comfort: '🚗 コンフォート',

      pill_sport: '🏎️ スポーツ',

      pill_insane: '⚡ 即座に反応',

      setting_exhaust_flaps: '🎺 可変排気バルブ (サウンド特性)',

      setting_exhaust_hint: 'エキゾーストの音質',

      pill_stock: '🤫 純正マフラー',

      pill_straight: '🏁 直管ストレート',

      setting_crackle: '💥 アフターファイヤー (Pops & Bangs)',

      setting_crackle_hint: 'アクセルオフ時の爆音と炎',

      pill_quiet: '🔇 静音',

      pill_fire: '🔥 炎爆',

      card_acoustic_title: '⚡ テスラ車内空間音響',

      card_speakers_count: '14 スピーカー',

      btn_pro_toggle_on: '⚡ PRO: ON',

      btn_pro_toggle_off: '⚡ PRO: OFF',

      btn_settings_expand: '⚙️ 設定 ▼',

      open_sound_notice: '<b>100% 無圧縮サウンド:</b> ダイナミクスを損なわないリアルタイムDSP音響',

      cabin_distribution_label: '車内サウンド配置:',

      stage_rear_exhaust: '🏎️ リアエキゾースト',

      stage_intake_exhaust: '🏁 吸気 / 排気',

      stage_3d_surround: '🎧 3D サラウンド',

      stage_hood_exhaust: '🏎️ ボンネット / 排気',

      stage_all_rear: '🏁 全て後方',

      stage_exhaust_only: '💨 排気のみ',

      trim_label: '🚘 テスラ車両仕様:',

      trim_desc: 'Long Range / Performance: 完全3Dサラウンド、ピラースピーカー、8インチサブウーファー。',

      fader_label: '⚖️ 車内バランス: ボンネット ↔ 排気',

      fader_center_text: '50 / 50 (中央)',

      balance_front: '🏎️ 前方 (エンジン)',

      balance_center: '⚖️ 中央',

      balance_rear: '💨 後方 (マフラー)',

      adv_acoustic_toggle: '⚙️ 詳細音響パラメーター (7項目) ▼',

      btn_reset: '↺ リセット',

      front_vol_label: '🏎️ フロントエンジン＆吸気音量',

      rear_vol_label: '💨 メインマフラー排気音量',

      pops_vol_label: '💥 バックファイア音量レベル',

      bass_vol_label: '🔊 サブウーファー重低音振動',

      delay_vol_label: '⏱️ 排気遅延 (4.7m全長シミュレーション)',

      stereo_width_label: '🎧 3D ステレオ幅 (14スピーカー)',

      turbo_title: '🌀 過給機音 (ターボ・スーパーチャージャー)',

      turbo_vol_label: 'タービン吸気音量',

      turbo_bov_label: '💥 ブローオフバルブ排出音 (Stututu)',

      badge_on: 'ON',

      badge_off: 'OFF',

      dsp_tuning_title: '⚡ エキゾースト調整＆DSP',

      dsp_flow_label: 'ストレート感 / 特性',

      dsp_crackle_label: '破裂音 / Pops & Bangs',

      dsp_options_btn: '⚙️ オプション',

      hud_title: '📊 計器・Gメーター (リアルタイム)',

      hud_speed_label: 'GPS 速度',

      hud_accel_label: '加速度',

      hud_gforce_label: 'Gフォース',

      hud_accuracy_label: '測位精度',

      hud_coords_label: 'GPS 座標',

      hud_searching: '衛星捕捉中...',

      hud_ready: 'GPS 準備完了 • 0 km/h',

      hud_bg_pill: '🚀 バックグラウンド音声稼働中',

      pedal_brake: 'ブレーキ',

      pedal_gas: 'アクセル',

      pedal_instruction: '長押しまたは [Space] / [W] でアクセル、[S] でブレーキ',

      blip_btn: 'ブリッピング',

      cruise_btn: 'クルーズ維持',

      wheel_shift_up: '▲ シフト ',

      wheel_shift_down: '▼ シフト ',

      modal_close: '閉じる',

      p2p_modal_title: '📲 テスラ ↔ スマホ無線接続',

      p2p_modal_desc: 'QRコードを読み取り、スマホの60Hz加速度・GPSをテスラ大画面に送信。',

      p2p_waiting: '接続待機中...',

      p2p_or_code: 'またはコードを入力:',

      p2p_connect_btn: '接続',

      sub_badge: 'プレミアム会員',

      sub_title: 'Tesla Sound PRO にアップグレード',

      sub_subtitle: '全22車種のサウンド、96kHz DSP、無線連携をすべてアンロック。',

      sub_monthly: '月額プラン',

      sub_yearly: '年額プラン',

      sub_save_badge: '🎁 2ヶ月分無料',

      sub_price_month: '$5',

      sub_per_month: '/ 月',

      sub_price_year: '$50',

      sub_per_year: '/ 年 (実質 $4.17/月)',

      sub_feat_1: '🏎️ 22種スーパーカー: Carrera GT V10, Hellcat V8, 2JZ, LFA, フェラーリ V12',

      sub_feat_2: '⚡ 96kHz スタジオ級プロシージャルDSP物理音響合成',

      sub_feat_3: '📱 60Hz 高速スマホ連携＆インテリジェントGPSフィルター',

      sub_feat_4: '💥 リアルなアンチラグ破裂音・スーパーチャージャー音',

      sub_feat_5: '🎮 テスラステアリングホイールのスクロール操作対応',

      sub_feat_6: '🛡️ 年間プランは14日間の100%全額返金保証付き',

      sub_cta_monthly: '月額 $5 で登録',

      sub_cta_yearly: '年間 $50 で登録 (2ヶ月無料)',

      sub_promo_placeholder: 'プロモコードを入力',

      sub_apply_promo: '適用',

      sub_trust_secure: '🔒 256ビット暗号化決済 • いつでもワンクリック解約可能',

      sub_promo_applied: '🎉 コード承認！PRO機能が解除されました。',

      sub_promo_invalid: '❌ コードが無効です。PRO2026 をお試しください',

      sub_checkout_notice: '💳 決済モジュール準備完了。テスト用コード PRO2026 で即時アンロック可能！',

      legal_title: '利用規約・各種ポリシー',

      tab_terms: '利用規約',

      tab_privacy: 'プライバシーポリシー',

      tab_refund: '返金ポリシー',

      cookie_text: 'お客様のプライバシーを守ります：走行データやGPSは端末内で100%完結します。',

      cookie_accept: '同意して利用開始',

      cookie_privacy: 'プライバシー',

      footer_copy: 'Tesla Sound Simulator • EV専用プロシージャルサウンドシステム',

      footer_wheel_hint: '🎮 <b>テスラハンドル操作:</b> スクロールホイール右倒し = シフトアップ (+)、左倒し = シフトダウン (-) • 回転 = 音量',

      footer_gas_key: 'アクセル',

      footer_brake_key: 'ブレーキ',

      footer_gears_key: 'シフトダウン / アップ'
    },
    pt: {
      site_title: 'Simulador de Som de Supercarros para Tesla | V10, V8 & Turbo',

      site_desc: 'Transforme o seu carro elétrico com o ronco de supercarros clássicos. GPS e telemetria P2P para Tesla Model 3/Y/S/X.',

      brand_curtain: '▼ GARAGEM',

      car_picker_title: 'Escolher Carro (22 Motores)',

      btn_start: 'LIGAR MOTOR',

      btn_stop: 'DESLIGAR MOTOR',

      btn_cranking: 'MOTOR DE ARRANQUE...',

      btn_p2p: 'Ligar Telemóvel',

      btn_fullscreen: 'Ecrã Inteiro',

      btn_pro: '⭐ PRO ($5/mês)',

      btn_pro_active: '👑 PRO ATIVO',

      vol_motor: 'Motor',

      vol_bass: 'Subwoofer',

      vol_exhaust: 'Escape',

      unit_mph_label: '🇺🇸 Milhas (MPH)',

      speed_unit_kmh: 'KM/H',

      speed_unit_mph: 'MPH',

      unit_kmh_short: 'km/h',

      unit_mph_short: 'mph',

      rpm_profile_1x: '⚙️ RPM: 1x (Padrão)',

      rpm_profile_2x: '⚙️ RPM: 2x (Desportivo)',

      rpm_profile_3x: '⚙️ RPM: 3x (Pista)',

      crackle_quiet: '🔇 Rateres: Off',

      crackle_sport: '💥 Rateres: Sport',

      crackle_fire: '🔥 Rateres: Fogo',

      tab_pedal_full: '🕹️ Pedal (Simulador)',

      tab_pedal_short: '🕹️ Pedal',

      tab_gps_full: '🛰️ Sensor GPS (Em direto)',

      tab_gps_short: '🛰️ GPS',

      tab_p2p_full: '📱 Ligação Telemóvel P2P',

      tab_p2p_short: '📱 P2P',

      card_driving_title: '🏎️ Dinâmica & Escape',

      setting_stop_filter: '🛑 Filtro de Semáforo (GPS)',

      setting_stop_hint: 'Evita instabilidade com o carro parado',

      deadzone_0_kmh: '0 km/h',

      deadzone_2_kmh: '2 km/h',

      deadzone_4_kmh: '4 km/h ★',

      deadzone_0_mph: '0 mph',

      deadzone_2_mph: '1.2 mph',

      deadzone_4_mph: '2.5 mph ★',

      setting_throttle_sens: '⚡ Resposta do Acelerador',

      setting_throttle_hint: 'Rapidez de subida de rotação',

      pill_comfort: '🚗 Conforto',

      pill_sport: '🏎️ Sport',

      pill_insane: '⚡ Instantâneo',

      setting_exhaust_flaps: '🎺 Válvulas de Escape (Caráter)',

      setting_exhaust_hint: 'Tom acústico do escape',

      pill_stock: '🤫 Original',

      pill_straight: '🏁 Escape Livre',

      setting_crackle: '💥 Rateres (Pops & Bangs)',

      setting_crackle_hint: 'Estalos e chamas nas passagens de caixa',

      pill_quiet: '🔇 Silencioso',

      pill_fire: '🔥 Fogo',

      card_acoustic_title: '⚡ Acústica Espacial Tesla',

      card_speakers_count: '14 Altifalantes',

      btn_pro_toggle_on: '⚡ PRO: ON',

      btn_pro_toggle_off: '⚡ PRO: OFF',

      btn_settings_expand: '⚙️ Definições ▼',

      open_sound_notice: '<b>100% Som Aberto Não Comprimido:</b> áudio nativo de máxima dinâmica',

      cabin_distribution_label: 'Distribuição acústica do habitáculo:',

      stage_rear_exhaust: '🏎️ Escape Traseiro',

      stage_intake_exhaust: '🏁 Admissão / Escape',

      stage_3d_surround: '🎧 3D Surround',

      stage_hood_exhaust: '🏎️ Capô / Escape',

      stage_all_rear: '🏁 Tudo Atrás',

      stage_exhaust_only: '💨 Apenas Escape',

      trim_label: '🚘 Configuração Tesla:',

      trim_desc: 'Long Range / Performance: Envolvente 3D total, tweeters nos pilares e subwoofer de 8".',

      fader_label: '⚖️ Balanço Habitáculo: Capô ↔ Escape',

      fader_center_text: '50 / 50 (Centro)',

      balance_front: '🏎️ Frente (Motor)',

      balance_center: '⚖️ Centro',

      balance_rear: '💨 Traseira (Escape)',

      adv_acoustic_toggle: '⚙️ Parâmetros acústicos detalhados (7) ▼',

      btn_reset: '↺ Repor',

      front_vol_label: '🏎️ Volume Motor & Admissão (Frente)',

      rear_vol_label: '💨 Volume Escape Principal (Traseira)',

      pops_vol_label: '💥 Nível de Rateres Pops & Bangs',

      bass_vol_label: '🔊 Vibração do Subwoofer (Bass-Shaker)',

      delay_vol_label: '⏱️ Atraso acústico (4.7m comprimento do carro)',

      stereo_width_label: '🎧 Largura estéreo 3D (14 Altifalantes)',

      turbo_title: '🌀 Som de Turbo e Compressor',

      turbo_vol_label: 'Volume Silvo do Turbo',

      turbo_bov_label: '💥 Válvula Blow-Off (Stututu)',

      badge_on: 'ON',

      badge_off: 'OFF',

      dsp_tuning_title: '⚡ Afinação de Escape & DSP',

      dsp_flow_label: 'Fluxo / Caráter',

      dsp_crackle_label: 'Rateres / Pops & Bangs',

      dsp_options_btn: '⚙️ Opções',

      hud_title: '📊 Telemetria & Força G',

      hud_speed_label: 'Velocidade GPS',

      hud_accel_label: 'Aceleração',

      hud_gforce_label: 'Força G',

      hud_accuracy_label: 'Precisão',

      hud_coords_label: 'Coordenadas GPS',

      hud_searching: 'A procurar satélites...',

      hud_ready: 'GPS Pronto • 0 km/h',

      hud_bg_pill: '🚀 Áudio de fundo ativo',

      pedal_brake: 'TRAVÃO',

      pedal_gas: 'ACELERADOR',

      pedal_instruction: 'Mantenha premido ou utilize [Espaço] / [W] para Gas, [S] para Travão',

      blip_btn: 'Ponta-Tacão',

      cruise_btn: 'Cruzeiro',

      wheel_shift_up: '▲ MUDANÇA ',

      wheel_shift_down: '▼ MUDANÇA ',

      modal_close: 'Fechar',

      p2p_modal_title: '📲 Ligação Tesla ↔ Telemóvel',

      p2p_modal_desc: 'Leia o código QR para transmitir telemetria a 60 Hz sem fios para o ecrã Tesla.',

      p2p_waiting: 'A aguardar ligação...',

      p2p_or_code: 'Ou insira o código manual:',

      p2p_connect_btn: 'Ligar',

      sub_badge: 'SUBSCIÇÃO PREMIUM',

      sub_title: 'Atualizar para Tesla Sound PRO',

      sub_subtitle: 'Desbloqueie 22 supercarros, motor DSP a 96 kHz e telemetria sem fios.',

      sub_monthly: 'Mensal',

      sub_yearly: 'Anual',

      sub_save_badge: '🎁 2 MESES GRÁTIS',

      sub_price_month: '$5',

      sub_per_month: '/ mês',

      sub_price_year: '$50',

      sub_per_year: '/ ano ($4.17/mês)',

      sub_feat_1: '🏎️ 22+ Supercarros: Carrera GT V10, Hellcat V8, 2JZ, LFA & Ferrari V12',

      sub_feat_2: '⚡ DSP físico procedimental de nível de estúdio a 96 kHz',

      sub_feat_3: '📱 Acelerómetro de telemóvel a 60 Hz e filtro GPS inteligente',

      sub_feat_4: '💥 Rateres anti-lag e uivo autêntico de compressor',

      sub_feat_5: '🎮 Troca de mudanças no volante Tesla',

      sub_feat_6: '🛡️ Garantia de devolução de 14 dias no plano anual',

      sub_cta_monthly: 'Subscrever por $5 / mês',

      sub_cta_yearly: 'Comprar Anual por $50 (Poupe $10)',

      sub_promo_placeholder: 'Código de promoção ou licença',

      sub_apply_promo: 'Ativar',

      sub_trust_secure: '🔒 Pagamento encriptado 256-bit • Cancele com 1 clique',

      sub_promo_applied: '🎉 Código aceite! Modo PRO desbloqueado.',

      sub_promo_invalid: '❌ Código inválido. Tente PRO2026',

      sub_checkout_notice: '💳 Checkout pronto para Stripe. Use PRO2026 para testar imediatamente!',

      legal_title: 'Documentação Legal & Termos',

      tab_terms: 'Termos de Serviço',

      tab_privacy: 'Privacidade',

      tab_refund: 'Reembolsos',

      cookie_text: 'Privacidade em primeiro lugar: os dados de GPS são processados estritamente no seu dispositivo.',

      cookie_accept: 'Aceitar e Continuar',

      cookie_privacy: 'Privacidade',

      footer_copy: 'Tesla Sound Simulator • Plataforma Profissional de Áudio Automóvel',

      footer_wheel_hint: '🎮 <b>Volante Tesla:</b> Inclinação da roda à Direita = Mudança acima (+), Esquerda = abaixo (-) • Rodar = Volume',

      footer_gas_key: 'Acelerador',

      footer_brake_key: 'Travão',

      footer_gears_key: 'Mudanças'
    },
    ar: {
      site_title: 'محاكي أصوات سيارات تيسلا الخارقة | V10 و V8 وتيربو',

      site_desc: 'حول سيارتك الكهربائية إلى سيارة خارقة بصوت محرك أسطوري. مزامنة GPS ومقاييس تسارع لاسلكية.',

      brand_curtain: '▼ الكراج',

      car_picker_title: 'اختيار السيارة (22 محرك)',

      btn_start: 'تشغيل المحرك',

      btn_stop: 'إيقاف المحرك',

      btn_cranking: 'تشغيل السلف...',

      btn_p2p: 'ربط الهاتف',

      btn_fullscreen: 'ملء الشاشة',

      btn_pro: '⭐ PRO ($5/شهر)',

      btn_pro_active: '👑 PRO مفعل',

      vol_motor: 'المحرك',

      vol_bass: 'مضخم الصوت',

      vol_exhaust: 'العادم',

      unit_mph_label: '🇺🇸 ميل (MPH)',

      speed_unit_kmh: 'كم/س',

      speed_unit_mph: 'MPH',

      unit_kmh_short: 'كم/س',

      unit_mph_short: 'mph',

      rpm_profile_1x: '⚙️ السرعات: 1x (عادي)',

      rpm_profile_2x: '⚙️ السرعات: 2x (رياضي)',

      rpm_profile_3x: '⚙️ السرعات: 3x (حلبة)',

      crackle_quiet: '🔇 الفرقعات: صامت',

      crackle_sport: '💥 الفرقعات: رياضي',

      crackle_fire: '🔥 الفرقعات: لهب',

      tab_pedal_full: '🕹️ دواسة المحاكاة (تجربة)',

      tab_pedal_short: '🕹️ دواسة',

      tab_gps_full: '🛰️ مستشعر GPS (دقة عالية)',

      tab_gps_short: '🛰️ GPS',

      tab_p2p_full: '📱 ربط الهاتف اللاسلكي',

      tab_p2p_short: '📱 P2P',

      card_driving_title: '🏎️ ديناميكا القيادة والصوت',

      setting_stop_filter: '🛑 مرشح إشارة المرور (منطقة السكون)',

      setting_stop_hint: 'يمنع التردد عند التوقف',

      deadzone_0_kmh: '0 كم/س',

      deadzone_2_kmh: '2 كم/س',

      deadzone_4_kmh: '4 كم/س ★',

      deadzone_0_mph: '0 mph',

      deadzone_2_mph: '1.2 mph',

      deadzone_4_mph: '2.5 mph ★',

      setting_throttle_sens: '⚡ استجابة الخانق',

      setting_throttle_hint: 'سرعة تصاعد دورات المحرك',

      pill_comfort: '🚗 مريح',

      pill_sport: '🏎️ رياضي',

      pill_insane: '⚡ فوري',

      setting_exhaust_flaps: '🎺 صمامات العادم',

      setting_exhaust_hint: 'نبرة صوت العادم',

      pill_stock: '🤫 وكالة',

      pill_straight: '🏁 دبة رياضية مباشرة',

      setting_crackle: '💥 فرقعات العادم (Pops & Bangs)',

      setting_crackle_hint: 'أصوات نارية عند التبديل ورفع القدم',

      pill_quiet: '🔇 هادئ',

      pill_fire: '🔥 لهب',

      card_acoustic_title: '⚡ الصوت المحيطي في مقصورة تيسلا',

      card_speakers_count: '14 سماعة',

      btn_pro_toggle_on: '⚡ PRO: تشغيل',

      btn_pro_toggle_off: '⚡ PRO: إيقاف',

      btn_settings_expand: '⚙️ الإعدادات ▼',

      open_sound_notice: '<b>صوت نقي بدون ضغط 100%:</b> تدفق مباشر عالي الدقة للسماعات',

      cabin_distribution_label: 'توزيع الصوت في المقصورة:',

      stage_rear_exhaust: '🏎️ عادم خلفي',

      stage_intake_exhaust: '🏁 مدخل / عادم',

      stage_3d_surround: '🎧 3D محيطي',

      stage_hood_exhaust: '🏎️ كبوت / عادم',

      stage_all_rear: '🏁 الصوت بالكامل خلفي',

      stage_exhaust_only: '💨 عادم فقط',

      trim_label: '🚘 فئة تيسلا:',

      trim_desc: 'Long Range / Performance: صوت محيطي 3D وتويترات ومضخم صوت 8 بوصة.',

      fader_label: '⚖️ ميزان الصوت: المحرك الأمامي ↔ العادم الخلفي',

      fader_center_text: '50 / 50 (الوسط)',

      balance_front: '🏎️ أمام (محرك)',

      balance_center: '⚖️ الوسط',

      balance_rear: '💨 خلف (عادم)',

      adv_acoustic_toggle: '⚙️ تفاصيل الصوت المتقدمة (7) ▼',

      btn_reset: '↺ إعادة ضبط',

      front_vol_label: '🏎️ صوت المحرك والمدخل (أمامي)',

      rear_vol_label: '💨 صوت العادم الأساسي (خلفي)',

      pops_vol_label: '💥 مستوى فرقعات العادم Pops & Bangs',

      bass_vol_label: '🔊 اهتزاز مضخم الصوت (Bass-Shaker)',

      delay_vol_label: '⏱️ تأخير صوت العادم (محاكاة طول السيارة 4.7م)',

      stereo_width_label: '🎧 اتساع مسرح الصوت 3D (14 سماعة)',

      turbo_title: '🌀 صوت الشاحن التوربيني والسوبر تشارج',

      turbo_vol_label: 'صوت صفير التيربو',

      turbo_bov_label: '💥 تفريغ الهواء Blow-Off (Stututu)',

      badge_on: 'تشغيل',

      badge_off: 'إيقاف',

      dsp_tuning_title: '⚡ ضبط العادم ونظام DSP',

      dsp_flow_label: 'انسياب / طابع الصوت',

      dsp_crackle_label: 'الفرقعات / Pops & Bangs',

      dsp_options_btn: '⚙️ خيارات',

      hud_title: '📊 القياسات وقوة G (مباشر)',

      hud_speed_label: 'سرعة GPS',

      hud_accel_label: 'التسارع',

      hud_gforce_label: 'قوة G',

      hud_accuracy_label: 'الدقة',

      hud_coords_label: 'إحداثيات GPS',

      hud_searching: 'جاري البحث عن الأقمار...',

      hud_ready: 'GPS جاهز • 0 كم/س',

      hud_bg_pill: '🚀 الصوت الخلفي يعمل',

      pedal_brake: 'فرامل',

      pedal_gas: 'وقود',

      pedal_instruction: 'اضغط مع الاستمرار أو اضغط [Space] / [W] للوقود، [S] للفرامل',

      blip_btn: 'دوسة بنزين سريعة',

      cruise_btn: 'تثبيت السرعة',

      wheel_shift_up: '▲ السرعة ',

      wheel_shift_down: '▼ السرعة ',

      modal_close: 'إغلاق',

      p2p_modal_title: '📲 ربط تيسلا بالهاتف',

      p2p_modal_desc: 'امسح الرمز أو أدخل الرمز لنقل بيانات التسارع لاسلكياً بدقة 60 هرتز.',

      p2p_waiting: 'بانتظار الاتصال...',

      p2p_or_code: 'أو أدخل الرمز يدوياً:',

      p2p_connect_btn: 'اتصال',

      sub_badge: 'اشتراك احترافي',

      sub_title: 'الترقية إلى تيسلا ساوند PRO',

      sub_subtitle: 'افتح جميع الـ 22 سيارة خارقة، ومحرك DSP بدقة 96 كيلوهرتز.',

      sub_monthly: 'شهري',

      sub_yearly: 'سنوي',

      sub_save_badge: '🎁 شهران مجاناً',

      sub_price_month: '$5',

      sub_per_month: '/ شهر',

      sub_price_year: '$50',

      sub_per_year: '/ سنة ($4.17/شهر)',

      sub_feat_1: '🏎️ 22 سيارة خارقة: Carrera GT V10, Hellcat V8, 2JZ, LFA وفيراري V12',

      sub_feat_2: '⚡ معالجة فيزيائية رقمية DSP بدقة 96 كيلوهرتز',

      sub_feat_3: '📱 قراءات تسارع 60 هرتز وفلترة ذكية لسرعة GPS',

      sub_feat_4: '💥 فرقعات لهب حقيقية وصوت سوبر تشارج أصلي',

      sub_feat_5: '🎮 التبديل عبر بكرة مقود تيسلا',

      sub_feat_6: '🛡️ ضمان استرداد الأموال لمدة 14 يوماً للاشتراك السنوي',

      sub_cta_monthly: 'اشتراك شهري مقابل $5 / شهر',

      sub_cta_yearly: 'اشتراك سنوي مقابل $50 (وفر $10)',

      sub_promo_placeholder: 'أدخل كود الخصم أو الترخيص',

      sub_apply_promo: 'تفعيل',

      sub_trust_secure: '🔒 دفع آمن ومشفر 256 بت • إلغاء بنقرة واحدة',

      sub_promo_applied: '🎉 تم تفعيل الكود بنجاح! وضع PRO متاح الآن.',

      sub_promo_invalid: '❌ كود غير صحيح. جرب PRO2026',

      sub_checkout_notice: '💳 بوابة الدفع جاهزة. استخدم كود PRO2026 للتجربة فوراً!',

      legal_title: 'الوثائق القانونية والامتثال',

      tab_terms: 'شروط الخدمة',

      tab_privacy: 'سياسة الخصوصية',

      tab_refund: 'سياسة الاسترداد',

      cookie_text: 'نحترم خصوصيتك: جميع بيانات القيادة وGPS تعالج محلياً 100% على جهازك.',

      cookie_accept: 'قبول ومتابعة',

      cookie_privacy: 'الخصوصية',

      footer_copy: 'Tesla Sound Simulator • منصة المحاكاة الصوتية الاحترافية للسيارات الكهربائية',

      footer_wheel_hint: '🎮 <b>مقود تيسلا:</b> ميلان البكرة لليمين = تعشيق للأعلى (+)، لليسار = للأسفل (-) • التمرير = الصوت',

      footer_gas_key: 'وقود',

      footer_brake_key: 'فرامل',

      footer_gears_key: 'تبديل السرعات'
    }
  };

  const LANG_NAMES = {
    en: { name: 'English', flag: '🇺🇸' },
    ru: { name: 'Русский', flag: '🇷🇺' },
    de: { name: 'Deutsch', flag: '🇩🇪' },
    es: { name: 'Español', flag: '🇪🇸' },
    fr: { name: 'Français', flag: '🇫🇷' },
    zh: { name: '中文', flag: '🇨🇳' },
    ja: { name: '日本語', flag: '🇯🇵' },
    pt: { name: 'Português', flag: '🇧🇷' },
    ar: { name: 'العربية', flag: '🇦🇪' }
  };

  class I18nManager {
    constructor() {
      const urlLang = new URLSearchParams(window.location.search).get('lang');
      const savedLang = localStorage.getItem('tesla_sound_lang');
      const browserLang = (navigator.language || 'en').slice(0, 2).toLowerCase();

      this.currentLang = TRANSLATIONS[urlLang] ? urlLang : (TRANSLATIONS[savedLang] ? savedLang : (TRANSLATIONS[browserLang] ? browserLang : 'ru'));
    }

    t(key, fallback = '') {
      const dict = TRANSLATIONS[this.currentLang] || TRANSLATIONS.en;
      if (dict && dict[key] !== undefined) {
        return dict[key];
      }
      if (TRANSLATIONS.en && TRANSLATIONS.en[key] !== undefined) {
        return TRANSLATIONS.en[key];
      }
      return fallback || key;
    }

    setLanguage(lang) {
      if (!TRANSLATIONS[lang]) return;
      this.currentLang = lang;
      try {
        localStorage.setItem('tesla_sound_lang', lang);
      } catch (e) {}

      document.documentElement.lang = lang;
      document.documentElement.dir = (lang === 'ar') ? 'rtl' : 'ltr';

      // Update page title & description for SEO
      document.title = this.t('site_title', document.title);
      const metaDesc = document.querySelector('meta[name="description"]');
      if (metaDesc) {
        metaDesc.setAttribute('content', this.t('site_desc'));
      }

      this.applyTranslations();

      // Trigger custom event for other modules
      window.dispatchEvent(new CustomEvent('languageChanged', { detail: { lang } }));
    }

    applyTranslations() {
      // Elements with data-i18n (textContent)
      document.querySelectorAll('[data-i18n]').forEach(el => {
        const key = el.getAttribute('data-i18n');
        const text = this.t(key);
        if (text) {
          el.textContent = text;
        }
      });

      // Elements with data-i18n-html (innerHTML)
      document.querySelectorAll('[data-i18n-html]').forEach(el => {
        const key = el.getAttribute('data-i18n-html');
        const html = this.t(key);
        if (html) {
          el.innerHTML = html;
        }
      });

      // Elements with data-i18n-title
      document.querySelectorAll('[data-i18n-title]').forEach(el => {
        const key = el.getAttribute('data-i18n-title');
        const text = this.t(key);
        if (text) {
          el.setAttribute('title', text);
        }
      });

      // Elements with data-i18n-placeholder
      document.querySelectorAll('[data-i18n-placeholder]').forEach(el => {
        const key = el.getAttribute('data-i18n-placeholder');
        const text = this.t(key);
        if (text) {
          el.setAttribute('placeholder', text);
        }
      });

      // Update lang select UI if present
      const langSelect = document.getElementById('langSelect');
      if (langSelect && langSelect.value !== this.currentLang) {
        langSelect.value = this.currentLang;
      }
    }

    init() {
      this.setLanguage(this.currentLang);
    }
  }

  window.i18n = new I18nManager();
  window.LANG_NAMES = LANG_NAMES;

})(window);
