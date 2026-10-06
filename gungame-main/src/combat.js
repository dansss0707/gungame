window.Game = window.Game || {};

window.Game.CombatSystem = class CombatSystem {
  constructor(player, remotePlayers, damageFx, resurgence, network) {
    this.player = player;
    this.remotePlayers = remotePlayers;
    this.damageFx = damageFx;
    this.resurgence = resurgence;
    this.network = network;
    this.bullets = [];
  }

  addBullet(bullet) {
    this.bullets.push(bullet);
  }

  update(dt, mapData, matchTimeRemaining, localPlayerName) {
    const myId = this.network.myId || 'local_player';

    for (let i = this.bullets.length - 1; i >= 0; i--) {
      const b = this.bullets[i];
      b.update(dt, mapData);

      if (!b.isDead) {
        // Hit remote players
        for (const pid in this.remotePlayers) {
          const rp = this.remotePlayers[pid];
          if (!rp.isDead && rp.currentFloor === b.floor && b.shooterId !== rp.id) {
            if (Math.hypot(b.x - rp.x, b.y - rp.y) < rp.radius + b.radius) {
              b.isDead = true;
              const res = rp.takeDamage(b.damage);
              this.damageFx.spawn(rp.x, rp.y, b.damage, res.armorLost > 0);

              if (this.network?.sendAction) {
                this.network.sendAction('player_damaged', {
                  targetId: rp.id,
                  amount: b.damage,
                  x: rp.x,
                  y: rp.y,
                  isShield: res.armorLost > 0,
                  attackerName: localPlayerName
                });
              }

              if (rp.isDead) {
                this.resurgence.dropPlayerLoot(rp.x, rp.y, rp.currentFloor, { slots: [], cash: 200 }, false);
              }
              break;
            }
          }
        }

        // Hit local player
        if (!b.isDead && !this.player.isDead && !this.resurgence.isDead &&
            this.player.currentFloor === b.floor && b.shooterId !== myId) {
          if (Math.hypot(b.x - this.player.x, b.y - this.player.y) < this.player.radius + b.radius) {
            b.isDead = true;
            const res = this.player.takeDamage(b.damage);
            this.damageFx.spawn(this.player.x, this.player.y, b.damage, res.armorLost > 0);

            if (this.network?.sendAction) {
              this.network.sendAction('player_damaged', {
                targetId: myId,
                amount: b.damage,
                x: this.player.x,
                y: this.player.y,
                isShield: res.armorLost > 0,
                attackerName: 'Opponent'
              });
            }

            if (this.player.isDead) {
              this.resurgence.kill(matchTimeRemaining);
            }
          }
        }
      }

      if (b.isDead) this.bullets.splice(i, 1);
    }
  }

  draw(ctx, currentFloor) {
    for (const b of this.bullets) {
      if (b.floor === currentFloor) b.draw(ctx);
    }
  }
};