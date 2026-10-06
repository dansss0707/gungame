/**
 * Resurgence FFA - WebRTC PeerJS Networking Layer
 */
window.Game = window.Game || {};

(function () {
  class NetworkManager {
    constructor() {
      this.peer = null;
      this.myId = null;
      this.isHost = false;
      this.hostConn = null;
      this.clients = {}; // peerId -> DataConnection

      this.onPlayerJoin = null;
      this.onPlayerLeave = null;
      this.onStateUpdate = null;
      this.onActionReceive = null;
      this.onMatchStart = null;
    }

    _generateRoomCode() {
      const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
      let code = '';
      for (let i = 0; i < 5; i++) {
        code += chars.charAt(Math.floor(Math.random() * chars.length));
      }
      return code;
    }

    _formatPeerId(roomCode) {
      return `resurgence-ffa-${roomCode.toUpperCase().trim()}`;
    }

    initHost(hostName, onReady) {
      this.isHost = true;
      const roomCode = this._generateRoomCode();
      const peerId = this._formatPeerId(roomCode);

      this.peer = new Peer(peerId, { debug: 1 });

      this.peer.on('open', (id) => {
        this.myId = id;
        if (onReady) onReady(roomCode);
      });

      this.peer.on('connection', (conn) => {
        conn.on('open', () => {
          this.clients[conn.peer] = conn;

          conn.on('data', (packet) => {
            if (!packet || !packet.type) return;

            if (packet.type === 'handshake') {
              conn.metadata = { name: packet.name || 'Operator' };
              if (this.onPlayerJoin) this.onPlayerJoin(conn.peer, conn.metadata.name);
              conn.send({ type: 'handshake_ack', assignedId: conn.peer });
            } else if (packet.type === 'client_input') {
              if (this.onStateUpdate) this.onStateUpdate(conn.peer, packet.data);
            } else if (packet.type === 'action') {
              if (this.onActionReceive) this.onActionReceive(conn.peer, packet.action, packet.payload);
              this._relayAction(conn.peer, packet.action, packet.payload);
            }
          });
        });

        const disconnect = () => {
          delete this.clients[conn.peer];
          if (this.onPlayerLeave) this.onPlayerLeave(conn.peer);
        };
        conn.on('close', disconnect);
        conn.on('error', disconnect);
      });

      this.peer.on('error', (err) => {
        console.error('[Host Peer Error]:', err);
        if (err.type === 'unavailable-id') this.initHost(hostName, onReady);
      });
    }

    initClient(playerName, roomCode, onSuccess, onError) {
      this.isHost = false;
      this.peer = new Peer({ debug: 1 });

      this.peer.on('open', (id) => {
        this.myId = id;
        const targetHostPeerId = this._formatPeerId(roomCode);
        const conn = this.peer.connect(targetHostPeerId, { reliable: true });
        this.hostConn = conn;

        let opened = false;
        const timeout = setTimeout(() => {
          if (!opened && onError) onError(new Error('Connection timed out. Check room code.'));
        }, 8000);

        conn.on('open', () => {
          opened = true;
          clearTimeout(timeout);
          conn.send({ type: 'handshake', name: playerName });
          if (onSuccess) onSuccess();
        });

        conn.on('data', (packet) => {
          if (!packet || !packet.type) return;

          if (packet.type === 'handshake_ack') {
            this.myId = packet.assignedId;
          } else if (packet.type === 'snapshot') {
            if (this.onStateUpdate) this.onStateUpdate('host', packet.data);
          } else if (packet.type === 'action') {
            if (packet.action === 'match_start' && this.onMatchStart) {
              this.onMatchStart(packet.payload);
            } else if (this.onActionReceive) {
              this.onActionReceive(packet.sender, packet.action, packet.payload);
            }
          }
        });

        conn.on('close', () => {
          if (this.onPlayerLeave) this.onPlayerLeave('host');
        });
        conn.on('error', (err) => {
          if (onError) onError(err);
        });
      });

      this.peer.on('error', (err) => {
        console.error('[Client Peer Error]:', err);
        if (onError) onError(err);
      });
    }

    broadcastSnapshot(stateData) {
      if (!this.isHost) return;
      const packet = { type: 'snapshot', data: stateData };
      for (const id in this.clients) {
        const c = this.clients[id];
        if (c && c.open) c.send(packet);
      }
    }

    sendClientInput(data) {
      if (this.isHost || !this.hostConn || !this.hostConn.open) return;
      this.hostConn.send({ type: 'client_input', data: data });
    }

    sendAction(action, payload) {
      const packet = {
        type: 'action',
        sender: this.myId || (this.isHost ? 'host' : 'client'),
        action: action,
        payload: payload
      };

      if (this.isHost) {
        for (const id in this.clients) {
          const c = this.clients[id];
          if (c && c.open) c.send(packet);
        }
      } else if (this.hostConn && this.hostConn.open) {
        this.hostConn.send(packet);
      }
    }

    _relayAction(originatorId, action, payload) {
      const packet = {
        type: 'action',
        sender: originatorId,
        action: action,
        payload: payload
      };
      for (const id in this.clients) {
        if (id !== originatorId) {
          const c = this.clients[id];
          if (c && c.open) c.send(packet);
        }
      }
    }
  }

  window.Game.Network = new NetworkManager();
})();