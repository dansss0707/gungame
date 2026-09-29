window.Game = window.Game || {};

window.Game.UI = {
  elements: {},
  isShopOpen: false,

  init(player, onBuyCallback) {
    this.elements = {
      cursorTooltip: document.getElementById('cursor-tooltip'),
      lblFloor: document.getElementById('lbl-floor'),
      lblZone: document.getElementById('lbl-zone'),
      lblHp: document.getElementById('lbl-hp-val'),
      hpBar: document.getElementById('hp-bar'),
      lblArmor: document.getElementById('lbl-armor-val'),
      plate1: document.getElementById('plate-1'),
      plate2: document.getElementById('plate-2'),
      plate3: document.getElementById('plate-3'),
      lblCash: document.getElementById('lbl-cash'),
      lblTokens: document.getElementById('lbl-tokens'),
      hintElem: document.getElementById('interact-hint'),
      lblAction: document.getElementById('lbl-action'),
      ammoPanel: document.getElementById('ammo-panel'),
      lblMag: document.getElementById('lbl-mag'),
      lblReserve: document.getElementById('lbl-reserve'),
      inventoryBar: document.getElementById('inventory-bar'),
      pickupFeed: document.getElementById('pickup-feed'),
      matchTimer: document.getElementById('match-timer'),
      matchPhase: document.getElementById('match-phase'),
      shopModal: document.getElementById('shop-modal'),
      shopCash: document.getElementById('shop-cash-val'),
      btnCloseShop: document.getElementById('btn-close-shop'),
      slots: [0, 1, 2, 3, 4].map(i => ({
        box: document.getElementById(`slot-${i}`),
        name: document.getElementById(`slot-${i}-name`),
        sub: document.getElementById(`slot-${i}-sub`)
      }))
    };

    const stopPropagation = e => e.stopPropagation();
    if (this.elements.inventoryBar) {
      this.elements.inventoryBar.addEventListener('mousedown', stopPropagation);
      this.elements.inventoryBar.addEventListener('mouseup', stopPropagation);
      this.elements.inventoryBar.addEventListener('click', stopPropagation);
    }

    if (this.elements.shopModal) {
      this.elements.shopModal.addEventListener('mousedown', stopPropagation);
      this.elements.shopModal.addEventListener('mouseup', stopPropagation);
      this.elements.shopModal.addEventListener('click', stopPropagation);
    }

    if (this.elements.btnCloseShop) {
      this.elements.btnCloseShop.onclick = () => this.closeShop();
    }

    document.querySelectorAll('.btn-buy-item').forEach(btn => {
      btn.onclick = (e) => {
        e.stopPropagation();
        const itemId = btn.getAttribute('data-item');
        const cost = parseInt(btn.getAttribute('data-cost'));
        if (onBuyCallback) onBuyCallback(itemId, cost);
      };
    });

    this.setupDragAndDrop(player);
  },

  openShop(player) {
    this.isShopOpen = true;
    if (this.elements.shopModal) {
      this.elements.shopModal.style.display = 'flex';
      this.elements.shopCash.textContent = player.inventory.cash;
    }
  },

  closeShop() {
    this.isShopOpen = false;
    if (this.elements.shopModal) {
      this.elements.shopModal.style.display = 'none';
    }
  },

  addPickupFeed(text, color = '#38bdf8') {
    const feed = this.elements.pickupFeed;
    if (!feed) return;

    const item = document.createElement('div');
    item.className = 'pickup-feed-item';
    item.innerHTML = `<span style="color:${color}; font-weight:800; margin-right:4px;">+</span> ${text}`;
    item.style.borderColor = color;

    feed.appendChild(item);

    setTimeout(() => {
      item.classList.add('fade-out');
      setTimeout(() => item.remove(), 400);
    }, 3200);
  },

  setupDragAndDrop(player) {
    let draggedIndex = null;

    this.elements.slots.forEach((s, idx) => {
      const box = s.box;

      box.addEventListener('click', (e) => {
        e.stopPropagation();
        player.inventory.switchSlot(idx);
      });

      box.addEventListener('dragstart', (e) => {
        e.stopPropagation();
        if (!player.inventory.slots[idx]) {
          e.preventDefault();
          return;
        }
        draggedIndex = idx;
        box.classList.add('dragging');
        e.dataTransfer.setData('text/plain', idx);
      });

      box.addEventListener('dragend', (e) => {
        e.stopPropagation();
        box.classList.remove('dragging');
        this.elements.slots.forEach(s2 => s2.box.classList.remove('drag-over'));
      });

      box.addEventListener('dragover', (e) => {
        e.preventDefault();
        e.stopPropagation();
        box.classList.add('drag-over');
      });

      box.addEventListener('dragleave', (e) => {
        e.stopPropagation();
        box.classList.remove('drag-over');
      });

      box.addEventListener('drop', (e) => {
        e.preventDefault();
        e.stopPropagation();
        box.classList.remove('drag-over');
        if (draggedIndex !== null && draggedIndex !== idx) {
          const temp = player.inventory.slots[idx];
          player.inventory.slots[idx] = player.inventory.slots[draggedIndex];
          player.inventory.slots[draggedIndex] = temp;
          draggedIndex = null;
        }
      });
    });
  },

  update(player, matchTimeRemaining) {
    const el = this.elements;

    // Match Timer Logic (6:00 scaling)
    if (el.matchTimer && matchTimeRemaining !== undefined) {
      const totalSec = Math.max(0, Math.ceil(matchTimeRemaining));
      const mins = Math.floor(totalSec / 60);
      const secs = totalSec % 60;
      el.matchTimer.textContent = `${String(mins).padStart(2, '0')}:${String(secs).padStart(2, '0')}`;

      if (totalSec <= 30) {
        // Critical Final 30s
        el.matchTimer.style.color = '#ef4444';
        el.matchPhase.textContent = 'FINAL COLLAPSE';
        el.matchPhase.style.color = '#ef4444';
      } else if (totalSec <= 120) {
        // 2-minute Warning Phase
        el.matchTimer.style.color = '#f59e0b';
        el.matchPhase.textContent = 'RESURGENCE CLOSING';
        el.matchPhase.style.color = '#f59e0b';
      } else {
        // Standard Active Phase
        el.matchTimer.style.color = '#38bdf8';
        el.matchPhase.textContent = 'RESURGENCE ACTIVE';
        el.matchPhase.style.color = '#94a3b8';
      }
    }

    // HP & Armor
    const hpPct = Math.max(0, Math.min(100, (player.hp / player.maxHp) * 100));
    el.hpBar.style.width = `${hpPct}%`;
    el.hpBar.style.background = hpPct > 30 ? '#22c55e' : '#ef4444';
    el.lblHp.textContent = Math.ceil(player.hp);

    const a = player.armorHp;
    el.lblArmor.textContent = `${Math.ceil(a)} / 150`;
    el.plate1.style.width = `${Math.min(100, Math.max(0, (a / 50) * 100))}%`;
    el.plate2.style.width = `${Math.min(100, Math.max(0, ((a - 50) / 50) * 100))}%`;
    el.plate3.style.width = `${Math.min(100, Math.max(0, ((a - 100) / 50) * 100))}%`;

    el.lblFloor.textContent = player.currentFloor.toUpperCase();
    el.lblZone.textContent = player.currentZone > 0 ? `BUILDING ${player.currentZone}` : "OUTSIDE";
    el.lblCash.textContent = player.inventory.cash;
    el.lblTokens.textContent = player.inventory.respawnTokens;
    if (this.isShopOpen && el.shopCash) {
      el.shopCash.textContent = player.inventory.cash;
    }

    // 5-Slot Hotbar
    for (let i = 0; i < 5; i++) {
      const s = el.slots[i];
      const slotData = player.inventory.slots[i];

      s.box.className = `slot-box ${player.inventory.activeSlotIndex === i ? 'active' : ''}`;
      s.box.draggable = slotData !== null;

      if (slotData && slotData.item) {
        s.name.textContent = slotData.item.name;
        s.name.style.color = slotData.item.color || '#fff';
        if (slotData.item.type === 'weapon') {
          s.sub.textContent = `${slotData.currentMag} / ${slotData.reserveAmmo}`;
        } else {
          s.sub.textContent = `x${slotData.count || 1}`;
        }
      } else {
        s.name.textContent = 'EMPTY';
        s.name.style.color = '#64748b';
        subEl = '-';
        s.sub.textContent = '-';
      }
    }

    // Action banner & Ammo
    const active = player.inventory.getActiveSlot();
    if (player.inventory.isReloading) {
      el.lblAction.style.display = 'block';
      el.lblAction.textContent = 'RELOADING...';
      el.lblAction.style.borderColor = '#eab308';
    } else if (player.inventory.isUsingItem) {
      el.lblAction.style.display = 'block';
      el.lblAction.textContent = `USING ${active?.item?.name}...`;
      el.lblAction.style.borderColor = '#38bdf8';
    } else {
      el.lblAction.style.display = 'none';
    }

    if (active && active.item && active.item.type === 'weapon') {
      el.ammoPanel.style.display = 'flex';
      el.lblMag.textContent = active.currentMag;
      el.lblReserve.textContent = active.reserveAmmo;
    } else {
      el.ammoPanel.style.display = 'none';
    }
  }
};