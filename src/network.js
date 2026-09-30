window.Game = window.Game || {};
window.Game.Network = window.Game.Network || {};

(function() {
  const net = window.Game.Network;

  net.peer = null;
  net.myId = null;
  net.isHost = false;
  net.connections = {}; // Host stores all client connections: { peerId: conn }
  net.hostConn = null;  // Clients store connection to Host

  net.onActionReceive = null;
  net.onStateUpdate = null;
  net.onPlayerJoin = null;
  net.onPlayerLeave = null;

  // Generate a clean 5-character room code
  function generateRoomCode() {
    const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
    let code = '';
    for (let i = 0; i < 5; i++) {
      code += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    return code;
  }

  // ==========================================
  // HOST INITIALIZATION
  // ==========================================
  net.initHost = function(playerName, onReady) {
    net.isHost = true;
    const roomCode = generateRoomCode();

    // Prefix ensures uniqueness on public PeerJS cloud brokers
    net.peer = new Peer('resurgence-' + roomCode);

    net.peer.on('open', (id) => {
      net.myId = id;
      console.log('[Network] Host online with Room Code:', roomCode);
      if (onReady) onReady(roomCode);
    });

    net.peer.on('connection', (conn) => {
      conn.on('open', () => {
        net.connections[conn.peer] = conn;
        console.log('[Network] Client connected:', conn.peer);

        // Listen for data from this client
        conn.on('data', (data) => {
          handleIncomingData(conn.peer, data);
        });

        conn.on('close', () => {
          console.log('[Network] Client disconnected:', conn.peer);
          delete net.connections[conn.peer];
          if (net.onPlayerLeave) net.onPlayerLeave(conn.peer);

          // Notify remaining clients
          net.sendAction('player_left', { id: conn.peer });
        });
      });
    });

    net.peer.on('error', (err) => {
      console.error('[Network] Host Peer error:', err);
    });
  };

  // ==========================================
  // CLIENT INITIALIZATION
  // ==========================================
  net.initClient = function(playerName, roomCode, onConnected, onError) {
    net.isHost = false;
    net.peer = new Peer();

    net.peer.on('open', (id) => {
      net.myId = id;
      const targetHostId = 'resurgence-' + roomCode.toUpperCase().trim();
      const conn = net.peer.connect(targetHostId, { reliable: true });

      conn.on('open', () => {
        net.hostConn = conn;
        console.log('[Network] Connected to Host:', targetHostId);

        // Send handshake so host knows our name
        net.sendAction('player_handshake', { id: net.myId, name: playerName });

        if (onConnected) onConnected();
      });

      conn.on('data', (data) => {
        handleIncomingData('host', data);
      });

      conn.on('close', () => {
        console.log('[Network] Disconnected from Host');
        alert('Disconnected from host.');
      });

      conn.on('error', (err) => {
        if (onError) onError(err);
      });
    });

    net.peer.on('error', (err) => {
      console.error('[Network] Client Peer error:', err);
      if (onError) onError(err);
    });
  };

  // ==========================================
  // MESSAGE ROUTING & RELAY (THE CRITICAL FIX)
  // ==========================================
  function handleIncomingData(senderId, data) {
    if (!data) return;

    // 1. Snapshot updates (World sync)
    if (data.type === 'snapshot') {
      if (net.onStateUpdate) net.onStateUpdate(senderId, data.payload);
      return;
    }

    // 2. Client Input (sent from client to Host)
    if (data.type === 'client_input') {
      if (net.onStateUpdate) net.onStateUpdate(senderId, data.payload);
      return;
    }

    // 3. Discrete Actions ('shoot', 'player_damaged', 'spawn_dropped_loot', etc.)
    if (data.type === 'action') {
      const { action, payload } = data;

      // Handle Handshake
      if (action === 'player_handshake' && net.isHost) {
        if (net.onPlayerJoin) net.onPlayerJoin(payload.id, payload.name);
        // Relay handshake to all other connected clients
        net.sendAction('player_joined_lobby', payload, payload.id);
        return;
      }

      // If Host received an action from Client A, RELAY IT TO CLIENT B, C, etc.
      if (net.isHost) {
        for (const peerId in net.connections) {
          if (peerId !== senderId) {
            try {
              net.connections[peerId].send(data);
            } catch (e) {}
          }
        }
      }

      // Execute locally
      if (net.onActionReceive) {
        net.onActionReceive(senderId, action, payload);
      }
    }
  }

  // Send an action to everyone
  net.sendAction = function(action, payload, excludePeerId = null) {
    const packet = { type: 'action', action, payload };

    if (net.isHost) {
      // Host broadcasts to all clients
      for (const peerId in net.connections) {
        if (peerId !== excludePeerId) {
          try {
            net.connections[peerId].send(packet);
          } catch (e) {}
        }
      }
      // Also execute on Host if it was triggered locally
      if (excludePeerId === null && net.onActionReceive) {
        net.onActionReceive(net.myId, action, payload);
      }
    } else {
      // Client sends to Host (Host will relay to everyone else)
      if (net.hostConn && net.hostConn.open) {
        net.hostConn.send(packet);
      }
    }
  };

  // Host broadcasts authoritative world snapshots
  net.broadcastSnapshot = function(snapshotPayload) {
    if (!net.isHost) return;
    const packet = { type: 'snapshot', payload: snapshotPayload };
    for (const peerId in net.connections) {
      try {
        net.connections[peerId].send(packet);
      } catch (e) {}
    }
  };

  // Client sends their position/aim to Host
  net.sendClientInput = function(inputPayload) {
    if (net.isHost) return;
    if (net.hostConn && net.hostConn.open) {
      net.hostConn.send({ type: 'client_input', payload: inputPayload });
    }
  };
})();
