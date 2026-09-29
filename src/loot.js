window.Game = window.Game || {};
window.Game._lootIdCounter = window.Game._lootIdCounter || 1;

window.Game.GroundItem = class GroundItem {
  constructor(x, y, floor, itemData, id = null) {
    this.id = id || `loot_${Date.now()}_${window.Game._lootIdCounter++}_${Math.floor(Math.random() * 10000)}`;
    this.x = x;
    this.y = y;
    this.floor = floor;
    this.item = itemData;
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

    ctx.fillStyle = this.item.color || '#38bdf8';
    ctx.shadowColor = this.item.color || '#38bdf8';
    ctx.shadowBlur = 8;
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

  generateLootDrops() {
    const drops = [];

    drops.push({
      type: 'cash',
      name: 'Cash Roll',
      value: this.isLegendary ? 500 : 150,
      color: '#4ade80'
    });

    drops.push({
      type: 'ammo',
      name: 'Ammo Crate',
      value: 60,
      color: '#fbbf24'
    });

    const wepKeys = Object.keys(window.Game.WEAPON_TYPES);
    const chosenWepKey = wepKeys[Math.floor(Math.random() * wepKeys.length)];
    const wep = window.Game.WEAPON_TYPES[chosenWepKey];
    drops.push({
      type: 'weapon',
      name: wep.name,
      color: wep.color,
      weaponData: { ...wep }
    });

    const consKeys = Object.keys(window.Game.CONSUMABLE_TYPES);
    const chosenConsKey = consKeys[Math.floor(Math.random() * consKeys.length)];
    const cons = window.Game.CONSUMABLE_TYPES[chosenConsKey];
    drops.push({
      type: 'consumable',
      name: cons.name,
      color: cons.color,
      count: cons.name.includes('Mini') ? 2 : 1,
      consumableData: { ...cons }
    });

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

    const angleStep = (Math.PI * 2) / dropItems.length;
    dropItems.forEach((drop, idx) => {
      const angle = idx * angleStep + (Math.random() * 0.4 - 0.2);
      const targetDist = 34 + Math.random() * 16;
      let finalDist = targetDist;

      if (mapData) {
        const level = mapData.levels[this.floor];
        if (level) {
          const cfg = window.Game.CONFIG;
          const targetX = this.x + Math.cos(angle) * targetDist;
          const targetY = this.y + Math.sin(angle) * targetDist;

          if (level.walls) {
            for (const w of level.walls) {
              const hit = window.Game.lineIntersection(this.x, this.y, targetX, targetY, w.x1, w.y1, w.x2, w.y2);
              if (hit) {
                const distToWall = Math.hypot(hit.x - this.x, hit.y - this.y) - 10;
                finalDist = Math.min(finalDist, Math.max(6, distToWall));
              }
            }
          }

          if (level.doors) {
            for (const d of level.doors) {
              const rad = (d.currentRotation !== undefined ? d.currentRotation : (d.rotation || 0)) * Math.PI / 180;
              const x2 = d.hingeX + Math.cos(rad) * d.width;
              const y2 = d.hingeY + Math.sin(rad) * d.width;
              const hit = window.Game.lineIntersection(this.x, this.y, targetX, targetY, d.hingeX, d.hingeY, x2, y2);
              if (hit) {
                const distToDoor = Math.hypot(hit.x - this.x, hit.y - this.y) - 10;
                finalDist = Math.min(finalDist, Math.max(6, distToDoor));
              }
            }
          }

          const steps = 6;
          for (let s = 1; s <= steps; s++) {
            const checkDist = (targetDist / steps) * s;
            const cx = this.x + Math.cos(angle) * checkDist;
            const cy = this.y + Math.sin(angle) * checkDist;
            const col = Math.floor(cx / cfg.TILE_SIZE);
            const row = Math.floor(cy / cfg.TILE_SIZE);
            if (level.solids && level.solids[`${col},${row}`]) {
              finalDist = Math.min(finalDist, Math.max(6, checkDist - 12));
              break;
            }
          }
        }
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
      spawnCallback(groundItem);
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