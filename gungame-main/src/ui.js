window.Game = window.Game || {};

(function () {
  class UIManager {
    constructor() {
      this.player = null;
      this.isShopOpen = false;

      // Safe DOM element registry
      this.elements = {
        cursorTooltip: document.getElementById('cursor-tooltip'),
        hintElem: document.getElementById('interact-hint'),
        pickupFeed: document.getElementById('pickup-feed'),
        lblFloor: document.getElementById('lbl-floor'),
        lblZone: document.getElementById('lbl-zone'),
        lblArmorVal: document.getElementById('lbl-armor-val'),
        plate1: document.getElementById('plate-1'),
        plate2: document.getElementById('plate-2'),
        plate3: document.getElementById('plate-3'),
        lblHpVal: document.getElementById('lbl-hp-val'),
        hpBar: document.getElementById('hp-bar'),
        lblCash: document.getElementById('lbl-cash'),
        lblTokens: document.getElementById('lbl-tokens'),
        lblAction: document.getElementById('lbl-action'),
        lblMag: document.getElementById('lbl-mag'),
        lblReserve: document.getElementById('lbl-reserve'),
        matchTimer: document.getElementById('match-timer'),
        matchPhase: document.getElementById('match-phase')
      };

      // Cache inventory slot elements
      this.slots = [];
      for (let i = 0; i < 5; i++) {
        this.slots.push({
          box: document.getElementById(`slot-${i}`),
          name: document.getElementById(`slot-${i}-name`),
          sub: document.getElementById(`slot-${i}-sub`)
        });
      }
    }

    init(player) {
      this.player = player;

      // Click to select inventory slot
      this.slots.forEach((slot, idx) => {
        if (slot.box) {
          slot.box.onclick = () => {
            if (this.player && this.player.inventory) {
              this.player.inventory.switchSlot(idx);
            }
          };
        }
      });
    }

    addPickupFeed(text, color = '#38bdf8') {
      const feed = this.elements.pickupFeed || document.getElementById('pickup-feed');
      if (!feed) return;

      const item = document.createElement('div');
      item.className = 'pickup-feed-item';
      item.textContent = text;
      item.style.borderLeftColor = color;

      feed.appendChild(item);

      setTimeout(() => {
        item.classList.add('fade-out');
        setTimeout(() => item.remove(), 400);
      }, 2500);
    }

    update(player, matchSecondsRemaining) {
      if (!player) return;
      const el = this.elements;

      // 1. Health & Armor
      const hp = Math.max(0, Math.round(player.hp || 0));
      const armor = Math.max(0, Math.round(player.armorHp || 0));

      if (el.lblHpVal) el.lblHpVal.textContent = hp;
      if (el.hpBar) el.hpBar.style.width = `${Math.min(100, hp)}%`;

      if (el.lblArmorVal) el.lblArmorVal.textContent = `${armor} / 150`;

      // 3 Armor plates (50 HP per plate)
      const p1 = Math.min(50, armor);
      const p2 = Math.max(0, Math.min(50, armor - 50));
      const p3 = Math.max(0, Math.min(50, armor - 100));

      if (el.plate1) el.plate1.style.width = `${(p1 / 50) * 100}%`;
      if (el.plate2) el.plate2.style.width = `${(p2 / 50) * 100}%`;
      if (el.plate3) el.plate3.style.width = `${(p3 / 50) * 100}%`;

      // 2. Economy
      const inv = player.inventory;
      if (inv) {
        if (el.lblCash) el.lblCash.textContent = inv.cash || 0;
        if (el.lblTokens) el.lblTokens.textContent = inv.respawnTokens || 0;

        // 3. Inventory Slots
        const activeIdx = inv.activeSlotIndex || 0;

        this.slots.forEach((slot, idx) => {
          if (!slot.box) return;

          if (idx === activeIdx) {
            slot.box.classList.add('active');
          } else {
            slot.box.classList.remove('active');
          }

          const slotData = inv.slots ? inv.slots[idx] : null;
          if (slotData && slotData.item) {
            const it = slotData.item;
            if (slot.name) {
              slot.name.textContent = it.name || 'UNKNOWN';
              slot.name.style.color = it.color || '#f8fafc';
            }
            if (slot.sub) {
              if (it.type === 'weapon') {
                slot.sub.textContent = `${slotData.currentMag || 0} / ${slotData.reserveAmmo || 0}`;
              } else if (it.type === 'consumable') {
                slot.sub.textContent = `x${slotData.count || 1}`;
              } else {
                slot.sub.textContent = '-';
              }
            }
          } else {
            if (slot.name) {
              slot.name.textContent = 'EMPTY';
              slot.name.style.color = '#64748b';
            }
            if (slot.sub) slot.sub.textContent = '-';
          }
        });

        // 4. Ammo & Reload status
        const activeSlot = inv.getActiveSlot ? inv.getActiveSlot() : inv.slots[activeIdx];
        if (activeSlot && activeSlot.item && activeSlot.item.type === 'weapon') {
          if (el.lblMag) el.lblMag.textContent = activeSlot.currentMag !== undefined ? activeSlot.currentMag : '-';
          if (el.lblReserve) el.lblReserve.textContent = activeSlot.reserveAmmo !== undefined ? activeSlot.reserveAmmo : '-';
        } else {
          if (el.lblMag) el.lblMag.textContent = '-';
          if (el.lblReserve) el.lblReserve.textContent = '-';
        }

        if (el.lblAction) {
          if (inv.isReloading) {
            el.lblAction.style.display = 'block';
            el.lblAction.textContent = 'RELOADING...';
          } else {
            el.lblAction.style.display = 'none';
          }
        }
      }

      // 5. Elevation & Zone
      if (el.lblFloor) {
        el.lblFloor.textContent = (player.currentFloor || 'floor1').toUpperCase();
      }
    }
  }

  window.Game.UI = new UIManager();
})();