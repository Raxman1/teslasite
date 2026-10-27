/**
 * WebRTC P2P Telemetry Bridge (using PeerJS)
 * Seamless zero-configuration connection between Tesla screen & Smartphone
 */
class P2PBridge {
  constructor(options = {}) {
    this.onTelemetryReceived = options.onTelemetryReceived || (() => {});
    this.onStatusChange = options.onStatusChange || (() => {});

    this.peer = null;
    this.connection = null;
    this.role = null; // 'host' (Tesla) or 'client' (Phone)
    this.roomCode = null;
    this.isConnected = false;

    // Ping / latency tracker
    this.lastPing = 0;
    this.latencyMs = 0;
  }

  // Generate a memorable 4-digit room code
  generateCode() {
    return Math.floor(1000 + Math.random() * 9000).toString();
  }

  // Initialize as Host (Tesla Car Screen)
  initHost(customCode = null) {
    this.role = 'host';
    this.roomCode = customCode || this.generateCode();
    const peerId = `cgt-tesla-${this.roomCode}`;

    this.onStatusChange({ status: 'connecting', message: 'Инициализация сервера P2P...' });

    if (this.peer) this.peer.destroy();

    this.peer = new Peer(peerId, {
      debug: 1
    });

    this.peer.on('open', (id) => {
      console.log('Host P2P ready with Peer ID:', id);
      this.onStatusChange({
        status: 'waiting',
        code: this.roomCode,
        message: `Ожидание подключения телефона (Код: ${this.roomCode})`
      });
    });

    this.peer.on('connection', (conn) => {
      console.log('Incoming connection from phone:', conn.peer);
      this.connection = conn;
      this.setupConnectionHandlers();
    });

    this.peer.on('error', (err) => {
      console.error('PeerJS Host Error:', err);
      this.onStatusChange({ status: 'error', message: `Ошибка P2P: ${err.type || err}` });
    });
  }

  // Initialize as Client (Smartphone Sensor)
  initClient(roomCode) {
    this.role = 'client';
    this.roomCode = roomCode.trim().toUpperCase();
    const hostPeerId = `cgt-tesla-${this.roomCode}`;

    this.onStatusChange({ status: 'connecting', message: `Подключение к экрану Теслы [${this.roomCode}]...` });

    if (this.peer) this.peer.destroy();

    this.peer = new Peer({ debug: 1 });

    this.peer.on('open', (id) => {
      console.log('Client Peer opened, connecting to host:', hostPeerId);
      this.connection = this.peer.connect(hostPeerId, {
        reliable: false // UDP-like low latency for real-time telemetry stream
      });
      this.setupConnectionHandlers();
    });

    this.peer.on('error', (err) => {
      console.error('PeerJS Client Error:', err);
      this.onStatusChange({ status: 'error', message: `Не удалось найти код ${this.roomCode}` });
    });
  }

  setupConnectionHandlers() {
    if (!this.connection) return;

    this.connection.on('open', () => {
      this.isConnected = true;
      console.log('P2P DataChannel connected!');
      this.onStatusChange({
        status: 'connected',
        role: this.role,
        code: this.roomCode,
        message: 'Связь установлена (P2P WebRTC)'
      });

      // Start ping loop
      if (this.role === 'client') {
        this.pingInterval = setInterval(() => {
          if (this.isConnected && this.connection) {
            this.connection.send({ type: 'ping', t: performance.now() });
          }
        }, 1000);
      }
    });

    this.connection.on('data', (data) => {
      if (!data) return;

      if (data.type === 'ping') {
        this.connection.send({ type: 'pong', t: data.t });
        return;
      }

      if (data.type === 'pong') {
        this.latencyMs = Math.round((performance.now() - data.t) / 2);
        this.onStatusChange({ status: 'connected', latency: this.latencyMs });
        return;
      }

      // Received telemetry packet from phone
      if (data.type === 'telemetry') {
        this.onTelemetryReceived(data.payload);
      }
    });

    this.connection.on('close', () => {
      this.isConnected = false;
      this.onStatusChange({ status: 'disconnected', message: 'Соединение разорвано' });
    });

    this.connection.on('error', (err) => {
      console.error('DataChannel error:', err);
    });
  }

  // Send telemetry from phone to Tesla screen
  sendTelemetry(payload) {
    if (this.isConnected && this.connection && this.connection.open) {
      this.connection.send({
        type: 'telemetry',
        payload: payload
      });
    }
  }

  disconnect() {
    if (this.pingInterval) clearInterval(this.pingInterval);
    if (this.connection) this.connection.close();
    if (this.peer) this.peer.destroy();
    this.isConnected = false;
    this.onStatusChange({ status: 'disconnected', message: 'Отключено' });
  }
}

window.P2PBridge = P2PBridge;
