window.Game = window.Game || {};

window.Game.ResurgenceManager = class ResurgenceManager {
  constructor(player, allSpawns, onRedeploy, onLootDrop) {
    this.player = player;
    this.allSpawns = allSpawns;
    this.onRedeploy = onRedeploy;
    this.onLootDrop = onLootDrop;
    this.isDead = false;
    this.respawnCountdown = 0;

    this.dom = {
      overlay: document.getElementById('death-overlay'),
      title: document.getElementById('lbl-redeploy-title'),
      timer: document.getElementById('lbl-redeploy-timer'),
      detail: document.getElementById('lbl-redeploy-detail'),
      forfeitBtn: document.getElementById('btn-forfeit'),
      phase: document.getElementById('match-phase')
    };

    if (this.dom.forfeitBtn) {
      this.dom.forfeitBtn.onclick = () => location.reload();
    }
  }

  dropPlayerLoot(pX, pY, pFloor, inv, isLocal = true) {
    const droppedItems = [];
    if (inv && inv.slots) {
      inv.slots.forEach(slot => {
        if (slot && slot.item) {
          droppedItems.push({
            type: slot.item.type,
            name: slot.item.name,
            color: slot.item.color,
            count: slot.count || 1,
            weaponData: slot.item.type === 'weapon' ? slot.item : undefined,
            consumableData: slot.item.type === 'consumable' ? slot.item : undefined
          });
        }
      });
      if (isLocal) {
        inv.slots = [null, null, null, null, null];
        inv.activeSlotIndex = 0;
      }
    }

    if (inv && inv.cash > 0) {
      const dropCash = Math.floor(inv.cash * 0.5);
      if (dropCash > 0) {
        droppedItems.push({
          type: 'cash',
          name: 'Cash Roll',
          value: dropCash,
          color: '#4ade80'
        });
        if (isLocal) inv.cash -= dropCash;
      }
    }

    const netDrops = [];
    droppedItems.forEach((it, idx) => {
      const angle = (idx / (droppedItems.length || 1)) * Math.PI * 2 + (Math.random() * 0.4 - 0.2);
      const dist = 28 + Math.random() * 20;
      netDrops.push({ x: pX + Math.cos(angle) * dist, y: pY + Math.sin(angle) * dist, floor: pFloor, item: it });
    });

    if (this.onLootDrop) this.onLootDrop(netDrops, isLocal);
  }

  kill(matchTimeRemaining) {
    if (this.isDead) return;
    this.isDead = true;
    this.player.isDead = true;

    if (window.Game.UI && window.Game.UI.isShopOpen) window.Game.UI.closeShop();

    this.dropPlayerLoot(this.player.x, this.player.y, this.player.currentFloor, this.player.inventory, true);
    if (this.dom.overlay) this.dom.overlay.style.display = 'flex';

    if (matchTimeRemaining > 120) {
      this.respawnCountdown = 10;
      if (this.dom.title) this.dom.title.textContent = 'RESURGENCE REDEPLOYING IN';
      if (this.dom.timer) {
        this.dom.timer.textContent = '10';
        this.dom.timer.style.fontSize = '56px';
        this.dom.timer.style.color = '#38bdf8';
      }
      if (this.dom.detail) {
        this.dom.detail.textContent = 'RESURGENCE WINDOW: ACTIVE (FREE)';
        this.dom.detail.style.color = '#38bdf8';
      }
      if (this.dom.forfeitBtn) this.dom.forfeitBtn.style.display = 'none';
    } else {
      if (this.player.inventory.respawnTokens > 0) {
        this.player.inventory.respawnTokens -= 1;
        window.Game.UI.addPickupFeed('Revive Token Consumed!', '#facc15');
        this.respawnCountdown = 10;
        if (this.dom.title) this.dom.title.textContent = 'REVIVE TOKEN REDEPLOY IN';
        if (this.dom.timer) {
          this.dom.timer.textContent = '10';
          this.dom.timer.style.fontSize = '56px';
          this.dom.timer.style.color = '#facc15';
        }
        if (this.dom.detail) {
          this.dom.detail.textContent = `TOKEN USED! (${this.player.inventory.respawnTokens} REMAINING)`;
          this.dom.detail.style.color = '#facc15';
        }
        if (this.dom.forfeitBtn) this.dom.forfeitBtn.style.display = 'none';
      } else {
        this.respawnCountdown = -1;
        if (this.dom.title) this.dom.title.textContent = 'RESURGENCE CLOSED - ELIMINATED';
        if (this.dom.timer) {
          this.dom.timer.textContent = 'DEFEAT';
          this.dom.timer.style.fontSize = '36px';
          this.dom.timer.style.color = '#ef4444';
        }
        if (this.dom.detail) {
          this.dom.detail.textContent = 'NO REVIVE TOKENS REMAINING';
          this.dom.detail.style.color = '#ef4444';
        }
        if (this.dom.forfeitBtn) this.dom.forfeitBtn.style.display = 'block';
      }
    }
  }

  redeploy() {
    this.isDead = false;
    this.player.isDead = false;
    this.player.hp = 100;
    this.player.armorHp = 50;

    if (this.allSpawns.length > 0) {
      const sp = this.allSpawns[Math.floor(Math.random() * this.allSpawns.length)];
      this.player.x = sp.x;
      this.player.y = sp.y;
      this.player.currentFloor = sp.floor;
    }

    if (this.dom.overlay) this.dom.overlay.style.display = 'none';
    window.Game.UI.addPickupFeed('Redeployed to Arena!', '#22c55e');
    if (this.onRedeploy) this.onRedeploy(this.player);
  }

  update(dt) {
    if (this.isDead && this.respawnCountdown > 0) {
      this.respawnCountdown -= dt;
      if (this.dom.timer) this.dom.timer.textContent = Math.max(0, Math.ceil(this.respawnCountdown)).toString();
      if (this.respawnCountdown <= 0) this.redeploy();
    }
  }
};