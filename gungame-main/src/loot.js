window.Game = window.Game || {};
window.Game._lootIdCounter = window.Game._lootIdCounter || 1;

window.Game.GroundItem = class GroundItem {
  constructor(x, y, floor, itemData, id = null) {
    this.id = id || `loot_${Date.now()}_${window.Game._lootIdCounter++}_${Math.floor(Math.random() * 10000)}`;
    this.x = x;
    this.y = y;
    this.floor = floor;
    this.item = itemData || { type: 'cash', name: 'Cash', value: 50, color: '#4ade80' };
    this.radius = 12;
    this.bobTimer = Math.random() * Math.PI * 2;
  }

  update(dt) {
    this.bobTimer += dt * 3;
  }

  draw(ctx) {
    const bob = Math.sin(this.bobTimer) * 3;
    ctx.save();
    ctx.translate(this.x, this.y + bob);

    ctx.fillStyle = (this.item && this.item.color) || '#38bdf8';
    ctx.shadowColor = (this.item && this.item.color) || '#38bdf8';
    ctx.shadowBlur = 10;
    ctx.beginPath();
    ctx.arc(0, 0, 7, 0, Math.PI * 2);
    ctx.fill();

    ctx.strokeStyle = '#ffffff';
    ctx.lineWidth = 1.5;
    ctx.stroke();

    ctx.restore();
  }
};

window.Game.Chest = class Chest {
  constructor(x, y, floor, id = null, isLegendary = false) {
    this.id = id || `chest_${floor}_${Math.round(x)}_${Math.round(y)}`;
    this.x = x;
    this.y = y;
    this.floor = floor;
    this.isOpen = false;
    this.isLegendary = isLegendary;
    this.lidAngle = 0;
  }

  update(dt) {
    if (this.isOpen && this.lidAngle < 0.8) {
      this.lidAngle = Math.min(0.8, this.lidAngle + dt * 4);
    }
  }

  _pickWeaponSafe(isLegendary) {
    const allWeapons = window.Game.WEAPON_TYPES || {};
    const availableKeys = Object.keys(allWeapons);

    // Hard fallback if WEAPON_TYPES hasn't loaded
    if (availableKeys.length === 0) {
      return {
        id: 'DEFAULT_M4',
        name: 'M4 Tactical',
        type: 'weapon',
        color: '#38bdf8',
        damage: 25,
        fireRate: 7,
        speed: 900,
        magSize: 30,
        reserveAmmo: 90
      };
    }

    const trashIds = ['RUSTY_PISTOL', 'PIPE_PISTOL', 'CIVILIAN_REVOLVER', 'HUNTING_RIFLE_OLD', 'OLD_DOUBLE_BARREL', 'NAIL_GUN'];
    const powerIds = ['PKM_HEAVY', 'BOLT_ACTION', 'SNIPER', 'MINIGUN', 'RAILGUN'];

    let candidateKeys = [];
    const roll = Math.random();

    if (isLegendary) {
      candidateKeys = powerIds.filter(id => allWeapons[id]);
    } else {
      if (roll < 0.35) {
        candidateKeys = trashIds.filter(id => allWeapons[id]);
      } else if (roll < 0.85) {
        candidateKeys = availableKeys.filter(id => !trashIds.includes(id) && !powerIds.includes(id));
      } else {
        candidateKeys = powerIds.filter(id => allWeapons[id]);
      }
    }

    // Fall back to any available key
    if (candidateKeys.length === 0) {
      candidateKeys = availableKeys;
    }

    const chosenKey = candidateKeys[Math.floor(Math.random() * candidateKeys.length)];
    return allWeapons[chosenKey] || allWeapons[availableKeys[0]];
  }

  generateLootDrops() {
    const drops = [];

    // 1. Cash Roll
    drops.push({
      type: 'cash',
      name: 'Cash Roll',
      value: this.isLegendary ? 400 : 150,
      color: '#4ade80'
    });

    // 2. Primary Weapon
    const primaryWep = this._pickWeaponSafe(this.isLegendary);
    drops.push({
      type: 'weapon',
      name: primaryWep.name,
      color: primaryWep.color || '#38bdf8',
      weaponData: { ...primaryWep }
    });

    // 3. Ammo Crate
    drops.push({
      type: 'ammo',
      name: 'Ammo Crate',
      value: (primaryWep.magSize || 30) * 2,
      color: '#fbbf24'
    });

    // 4. Secondary Weapon Chance
    if (this.isLegendary || Math.random() < 0.65) {
      const secondaryWep = this._pickWeaponSafe(false);
      drops.push({
        type: 'weapon',
        name: secondaryWep.name,
        color: secondaryWep.color || '#38bdf8',
        weaponData: { ...secondaryWep }
      });
    }

    // 5. Consumables
    const consObj = window.Game.CONSUMABLE_TYPES || {};
    const consKeys = Object.keys(consObj);
    if (consKeys.length > 0) {
      const chosenKey = consKeys[Math.floor(Math.random() * consKeys.length)];
      const cons = consObj[chosenKey];
      if (cons) {
        drops.push({
          type: 'consumable',
          name: cons.name,
          color: cons.color || '#10b981',
          count: (cons.name && cons.name.includes('Mini')) ? 2 : 1,
          consumableData: { ...cons }
        });
      }
    }

    // 6. Token Chance
    if (Math.random() < (this.isLegendary ? 0.35 : 0.08)) {
      drops.push({
        type: 'token',
        name: 'Revive Token',
        value: 1,
        color: '#facc15'
      });
    }

    return drops;
  }

  openWithItems(dropItems, spawnCallback, mapData = null) {
    if (this.isOpen) return;
    this.isOpen = true;

    if (!Array.isArray(dropItems) || dropItems.length === 0) return;

    const angleStep = (Math.PI * 2) / dropItems.length;

    dropItems.forEach((drop, idx) => {
      const angle = idx * angleStep + (Math.random() * 0.35 - 0.175);
      let finalDist = 38 + Math.random() * 16;

      try {
        if (mapData && mapData.levels && mapData.levels[this.floor]) {
          const level = mapData.levels[this.floor];
          const targetX = this.x + Math.cos(angle) * finalDist;
          const targetY = this.y + Math.sin(angle) * finalDist;

          if (Array.isArray(level.walls) && window.Game.lineIntersection) {
            for (const w of level.walls) {
              const hit = window.Game.lineIntersection(this.x, this.y, targetX, targetY, w.x1, w.y1, w.x2, w.y2);
              if (hit) {
                const distToWall = Math.hypot(hit.x - this.x, hit.y - this.y) - 10;
                finalDist = Math.min(finalDist, Math.max(8, distToWall));
              }
            }
          }
        }
      } catch (err) {
        console.warn('Loot raycast check bypassed:', err);
      }

      const dropX = this.x + Math.cos(angle) * finalDist;
      const dropY = this.y + Math.sin(angle) * finalDist;

      const groundItem = new window.Game.GroundItem(
        dropX,
        dropY,
        this.floor,
        drop,
        drop.id || null
      );

      if (typeof spawnCallback === 'function') {
        spawnCallback(groundItem);
      }
    });
  }

  draw(ctx) {
    ctx.save();
    ctx.translate(this.x, this.y);

    ctx.fillStyle = this.isOpen ? '#334155' : (this.isLegendary ? '#831843' : '#1e293b');
    ctx.fillRect(-18, -12, 36, 24);

    ctx.strokeStyle = this.isOpen ? '#64748b' : (this.isLegendary ? '#ec4899' : '#f59e0b');
    ctx.lineWidth = 2;
    ctx.strokeRect(-18, -12, 36, 24);

    if (!this.isOpen) {
      ctx.fillStyle = this.isLegendary ? '#ec4899' : '#f59e0b';
      ctx.fillRect(-4, -4, 8, 8);
    } else {
      ctx.fillStyle = '#475569';
      ctx.fillRect(-18, -16, 36, 6);
    }

    ctx.restore();
  }
};

window.Game.generateLooseFloorLoot = function (mapData, densityPerFloor = 14) {
  const items = [];
  const cfg = window.Game.CONFIG || { MAP_COLS: 40, MAP_ROWS: 40, TILE_SIZE: 48 };
  const floors = ['floor1', 'floor2', 'roof'];
  const allWeapons = window.Game.WEAPON_TYPES || {};
  const wepKeys = Object.keys(allWeapons);

  floors.forEach(flr => {
    const level = mapData && mapData.levels ? mapData.levels[flr] : null;
    if (!level) return;

    for (let i = 0; i < densityPerFloor; i++) {
      let x = 120 + Math.random() * (cfg.MAP_COLS * cfg.TILE_SIZE - 240);
      let y = 120 + Math.random() * (cfg.MAP_ROWS * cfg.TILE_SIZE - 240);

      const roll = Math.random();
      let dropData = null;

      if (roll < 0.55 && wepKeys.length > 0) {
        const wep = allWeapons[wepKeys[Math.floor(Math.random() * wepKeys.length)]];
        dropData = {
          type: 'weapon',
          name: wep.name,
          color: wep.color || '#38bdf8',
          weaponData: { ...wep }
        };
      } else if (roll < 0.80) {
        dropData = { type: 'ammo', name: 'Ammo Box', value: 45, color: '#fbbf24' };
      } else {
        dropData = { type: 'cash', name: 'Cash Roll', value: 80, color: '#4ade80' };
      }

      items.push(new window.Game.GroundItem(x, y, flr, dropData));
    }
  });

  return items;
};