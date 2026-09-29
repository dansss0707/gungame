window.Game = window.Game || {};

// 8 Distinct Weapon Types Across Rarity & Classes
window.Game.WEAPON_TYPES = {
  // --- SIDEARMS ---
  PISTOL: {
    type: 'weapon',
    name: 'Tactical Pistol',
    code: 'PST',
    magSize: 15,
    fireRate: 0.22,
    bulletSpeed: 680,
    damage: 26,
    spread: 0.025,
    reloadTime: 1.2,
    color: '#94a3b8' // Common Grey
  },
  REVOLVER: {
    type: 'weapon',
    name: 'Magnum Revolver',
    code: 'MAG',
    magSize: 6,
    fireRate: 0.48,
    bulletSpeed: 820,
    damage: 54,
    spread: 0.015,
    reloadTime: 2.1,
    color: '#38bdf8' // Rare Cyan
  },

  // --- SUBMACHINE GUNS ---
  SMG: {
    type: 'weapon',
    name: 'Micro SMG',
    code: 'SMG',
    magSize: 35,
    fireRate: 0.075, // Rapid shredder
    bulletSpeed: 720,
    damage: 16,
    spread: 0.07,
    reloadTime: 1.5,
    color: '#4ade80' // Uncommon Green
  },

  // --- ASSAULT RIFLES ---
  AR: {
    type: 'weapon',
    name: 'Assault Rifle',
    code: 'AR',
    magSize: 30,
    fireRate: 0.12,
    bulletSpeed: 760,
    damage: 23,
    spread: 0.038,
    reloadTime: 1.8,
    color: '#38bdf8' // Rare Cyan
  },
  BURST_AR: {
    type: 'weapon',
    name: 'Burst Rifle',
    code: 'BST',
    magSize: 24,
    fireRate: 0.28,
    pellets: 3, // 3-round burst simulation
    bulletSpeed: 820,
    damage: 21,
    spread: 0.018,
    reloadTime: 1.9,
    color: '#c084fc' // Epic Purple
  },

  // --- SHOTGUNS ---
  SHOTGUN: {
    type: 'weapon',
    name: 'Pump Shotgun',
    code: 'SG',
    magSize: 8,
    fireRate: 0.72,
    bulletSpeed: 640,
    damage: 14,
    pellets: 6,
    spread: 0.16,
    reloadTime: 2.3,
    color: '#4ade80' // Uncommon Green
  },
  DOUBLE_BARREL: {
    type: 'weapon',
    name: 'Double Barrel',
    code: 'DB',
    magSize: 2,
    fireRate: 0.18,
    bulletSpeed: 600,
    damage: 18,
    pellets: 8,
    spread: 0.22,
    reloadTime: 1.6,
    color: '#fb923c' // Legendary Amber
  },

  // --- PRECISION & SNIPERS ---
  DMR: {
    type: 'weapon',
    name: 'Marksman DMR',
    code: 'DMR',
    magSize: 12,
    fireRate: 0.34,
    bulletSpeed: 880,
    damage: 48,
    spread: 0.01,
    reloadTime: 2.0,
    color: '#c084fc' // Epic Purple
  },
  SNIPER: {
    type: 'weapon',
    name: 'Heavy Sniper',
    code: 'SNP',
    magSize: 5,
    fireRate: 1.15,
    bulletSpeed: 980,
    damage: 92,
    spread: 0.005,
    reloadTime: 2.7,
    color: '#f43f5e' // Legendary Crimson
  }
};

window.Game.CONSUMABLE_TYPES = {
  BANDAGE: {
    type: 'consumable',
    name: 'Bandages',
    code: 'BND',
    healHp: 25,
    maxHpCap: 75,
    useTime: 2.0,
    color: '#22c55e',
    stackSize: 5
  },
  MEDKIT: {
    type: 'consumable',
    name: 'Medkit',
    code: 'MED',
    healHp: 100,
    maxHpCap: 100,
    useTime: 4.5,
    color: '#10b981',
    stackSize: 1
  },
  MINI_SHIELD: {
    type: 'consumable',
    name: 'Mini Shield',
    code: 'MINI',
    healArmor: 25,
    maxArmorCap: 50,
    useTime: 2.0,
    color: '#38bdf8',
    stackSize: 3
  },
  BIG_SHIELD: {
    type: 'consumable',
    name: 'Big Shield',
    code: 'BIG',
    healArmor: 50,
    maxArmorCap: 150,
    useTime: 3.5,
    color: '#0284c7',
    stackSize: 2
  }
};

window.Game.Inventory = class Inventory {
  constructor() {
    this.slots = [null, null, null, null, null];
    this.activeSlotIndex = 0;
    this.isReloading = false;
    this.reloadTimer = 0;

    this.isUsingItem = false;
    this.useTimer = 0;
    this.totalUseTime = 0;

    this.cash = 0;
    this.respawnTokens = 0;
  }

  getActiveSlot() {
    return this.slots[this.activeSlotIndex];
  }

  getFirstEmptySlotIndex() {
    return this.slots.findIndex(s => s === null);
  }

  isFull() {
    return this.slots.every(s => s !== null);
  }

  switchSlot(index) {
    if (index >= 0 && index < 5 && index !== this.activeSlotIndex) {
      this.activeSlotIndex = index;
      this.cancelAction();
    }
  }

  cancelAction() {
    this.isReloading = false;
    this.isUsingItem = false;
    this.useTimer = 0;
  }

  startReload() {
    const slot = this.getActiveSlot();
    if (!slot || !slot.item || slot.item.type !== 'weapon') return;
    if (this.isReloading || this.isUsingItem) return;
    if (slot.currentMag >= slot.item.magSize) return;
    if (slot.reserveAmmo <= 0) return;

    this.isReloading = true;
    this.reloadTimer = slot.item.reloadTime;
  }

  startUsingConsumable(player) {
    const slot = this.getActiveSlot();
    if (!slot || !slot.item || slot.item.type !== 'consumable') return;
    if (this.isUsingItem || this.isReloading) return;

    const it = slot.item;
    if (it.healHp && player.hp >= it.maxHpCap) return;
    if (it.healArmor && player.armorHp >= it.maxArmorCap) return;

    this.isUsingItem = true;
    this.totalUseTime = it.useTime;
    this.useTimer = it.useTime;
  }

  update(dt, player) {
    if (this.isReloading) {
      this.reloadTimer -= dt;
      if (this.reloadTimer <= 0) {
        this.isReloading = false;
        const slot = this.getActiveSlot();
        if (slot && slot.item && slot.item.type === 'weapon') {
          const needed = slot.item.magSize - slot.currentMag;
          const added = Math.min(needed, slot.reserveAmmo);
          slot.currentMag += added;
          slot.reserveAmmo -= added;
        }
      }
    }

    if (this.isUsingItem) {
      this.useTimer -= dt;
      if (this.useTimer <= 0) {
        this.isUsingItem = false;
        const slot = this.getActiveSlot();
        if (slot && slot.item && slot.item.type === 'consumable') {
          const it = slot.item;
          if (it.healHp) player.hp = Math.min(it.maxHpCap, player.hp + it.healHp);
          if (it.healArmor) player.armorHp = Math.min(it.maxArmorCap, player.armorHp + it.healArmor);

          slot.count -= 1;
          if (slot.count <= 0) {
            this.slots[this.activeSlotIndex] = null;
          }
        }
      }
    }
  }
};