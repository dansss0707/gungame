window.Game = window.Game || {};

window.Game.Network = {
  peer: null,
  myId: null,
  isHost: false,
  roomCode: null,
  connections: {}, // peerId -> DataConnection
  hostConn: null,  // guest only
  onPlayerJoin: null,
  onPlayerLeave: null,
  onStateUpdate: null,
  onActionReceive: null,
  onMatchStart: null,

  generateRoomCode() {
    const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
    let code = '';
    for (let i = 0; i < 5; i++) {
      code += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    return code;
  },

  initHost(playerName, onReady) {
    this.isHost = true;
    this.roomCode = this.generateRoomCode();
    const fullId = `arena-br-${this.roomCode}`;

    this.peer = new Peer(fullId);

    this.peer.on('open', (id) => {
      this.myId = id;
      if (onReady) onReady(this.roomCode);
    });

    this.peer.on('connection', (conn) => {
      conn.on('open', () => {
        this.connections[conn.peer] = conn;

        conn.on('data', (data) => {
          this.handleHostIncomingData(conn.peer, data);
        });

        conn.on('close', () => {
          delete this.connections[conn.peer];
          if (this.onPlayerLeave) this.onPlayerLeave(conn.peer);
        });
      });
    });

    this.peer.on('error', (err) => {
      console.error('PeerJS Host Error:', err);
      if (err.type === 'unavailable-id') {
        this.initHost(playerName, onReady);
      }
    });
  },

  initClient(playerName, roomCode, onConnected, onError) {
    this.isHost = false;
    this.roomCode = roomCode.trim().toUpperCase();
    const targetHostId = `arena-br-${this.roomCode}`;

    this.peer = new Peer();

    this.peer.on('open', (id) => {
      this.myId = id;
      const conn = this.peer.connect(targetHostId, {
        reliable: false // UDP transmission
      });

      this.hostConn = conn;

      conn.on('open', () => {
        conn.send({
          type: 'handshake',
          name: playerName
        });
        if (onConnected) onConnected();
      });

      conn.on('data', (data) => {
        this.handleClientIncomingData(data);
      });

      conn.on('close', () => {
        if (this.onPlayerLeave) this.onPlayerLeave('host');
      });

      conn.on('error', (err) => {
        if (onError) onError(err);
      });
    });

    this.peer.on('error', (err) => {
      console.error('PeerJS Client Error:', err);
      if (onError) onError(err);
    });
  },

  handleHostIncomingData(peerId, data) {
    if (data.type === 'handshake') {
      if (this.onPlayerJoin) this.onPlayerJoin(peerId, data.name);
    } else if (data.type === 'input_sync') {
      if (this.onStateUpdate) this.onStateUpdate(peerId, data);
    } else if (data.type === 'player_action') {
      if (this.onActionReceive) this.onActionReceive(peerId, data.action, data.payload);
    }
  },

  handleClientIncomingData(data) {
    if (data.type === 'world_snapshot') {
      if (this.onStateUpdate) this.onStateUpdate('host', data);
    } else if (data.type === 'match_start' || (data.type === 'event_broadcast' && data.event === 'match_start')) {
      if (this.onMatchStart) this.onMatchStart(data.payload || data);
    } else if (data.type === 'event_broadcast') {
      if (this.onActionReceive) this.onActionReceive('host', data.event, data.payload);
    }
  },

  broadcastSnapshot(snapshot) {
    if (!this.isHost) return;
    const packet = {
      type: 'world_snapshot',
      ...snapshot
    };
    for (const id in this.connections) {
      if (this.connections[id].open) {
        this.connections[id].send(packet);
      }
    }
  },

  sendClientInput(inputState) {
    if (this.isHost || !this.hostConn || !this.hostConn.open) return;
    this.hostConn.send({
      type: 'input_sync',
      ...inputState
    });
  },

  sendAction(action, payload) {
    const packet = {
      type: this.isHost ? 'event_broadcast' : 'player_action',
      action: action,
      event: action,
      payload: payload
    };

    if (this.isHost) {
      for (const id in this.connections) {
        if (this.connections[id].open) this.connections[id].send(packet);
      }
    } else if (this.hostConn && this.hostConn.open) {
      this.hostConn.send(packet);
    }
  }
};