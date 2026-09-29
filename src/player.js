window.Game = window.Game || {};

window.Game.Player = class Player {
  constructor(x, y) {
    const cfg = window.Game.CONFIG;
    this.x = x;
    this.y = y;
    this.radius = cfg.PLAYER_RADIUS;
    this.angle = 0;

    this.maxHp = 100;
    this.hp = 100;
    this.maxArmorHp = 150;
    this.armorHp = 0;

    this.currentFloor = 'floor1';
    this.currentZone = 0;
    this.cooldown = 0;
    this.stairCooldown = 0;
    this.isDead = false;

    this.isAiming = false;
    this.inventory = new window.Game.Inventory();
  }

  takeDamage(amount) {
    if (this.isDead) return { hpLost: 0, armorLost: 0, died: false };

    let armorLost = 0;
    let hpLost = 0;

    if (this.armorHp > 0) {
      if (this.armorHp >= amount) {
        this.armorHp -= amount;
        armorLost = amount;
        amount = 0;
      } else {
        armorLost = this.armorHp;
        amount -= this.armorHp;
        this.armorHp = 0;
      }
    }

    if (amount > 0) {
      const prevHp = this.hp;
      this.hp = Math.max(0, this.hp - amount);
      hpLost = prevHp - this.hp;
    }

    if (this.hp <= 0) {
      this.isDead = true;
    }

    return { hpLost, armorLost, died: this.isDead };
  }

  update(dt, keys, mouseWorld, mapData, spawnBullet) {
    if (this.isDead) return;

    const cfg = window.Game.CONFIG;
    if (this.cooldown > 0) this.cooldown -= dt;
    if (this.stairCooldown > 0) this.stairCooldown -= dt;

    this.inventory.update(dt, this);
    this.angle = Math.atan2(mouseWorld.y - this.y, mouseWorld.x - this.x);

    this.isAiming = !!keys['mouseRight'];

    let dx = 0;
    let dy = 0;
    if (keys['KeyW'] || keys['ArrowUp']) dy -= 1;
    if (keys['KeyS'] || keys['ArrowDown']) dy += 1;
    if (keys['KeyA'] || keys['ArrowLeft']) dx -= 1;
    if (keys['KeyD'] || keys['ArrowRight']) dx += 1;

    if (dx !== 0 && dy !== 0) {
      dx *= 0.7071;
      dy *= 0.7071;
    }

    const isSprinting = !!(keys['ShiftLeft'] || keys['ShiftRight']);

    let speedMult = 1.0;
    if (this.inventory.isUsingItem) {
      speedMult = 0.45;
    } else if (this.isAiming) {
      speedMult = 0.60;
    } else if (isSprinting && (dx !== 0 || dy !== 0)) {
      speedMult = 1.35;
    }

    const nextX = this.x + dx * cfg.PLAYER_SPEED * speedMult * dt;
    const nextY = this.y + dy * cfg.PLAYER_SPEED * speedMult * dt;

    if (!this.checkCollision(nextX, this.y, mapData)) this.x = nextX;
    if (!this.checkCollision(this.x, nextY, mapData)) this.y = nextY;

    const col = Math.floor(this.x / cfg.TILE_SIZE);
    const row = Math.floor(this.y / cfg.TILE_SIZE);
    this.currentZone = mapData.buildingZones[`${col},${row}`] || 0;

    // Stairs
    if (this.stairCooldown <= 0) {
      const level = mapData.levels[this.currentFloor];
      if (level && level.stairs) {
        for (const st of level.stairs) {
          const cx = st.col * cfg.TILE_SIZE + cfg.TILE_SIZE / 2;
          const cy = st.row * cfg.TILE_SIZE + cfg.TILE_SIZE / 2;
          const halfH = (st.length * cfg.TILE_SIZE) / 2;
          const rad = (st.rotation * Math.PI) / 180;
          const forwardX = Math.sin(rad);
          const forwardY = -Math.cos(rad);

          const topX = cx + forwardX * (halfH - 8);
          const topY = cy + forwardY * (halfH - 8);
          const btmX = cx - forwardX * (halfH - 8);
          const btmY = cy - forwardY * (halfH - 8);
          const triggerDist = 18;

          if (st.direction === 'up' && Math.hypot(this.x - topX, this.y - topY) < triggerDist) {
            this.currentFloor = st.targetFloor;
            this.x = topX + forwardX * 36;
            this.y = topY + forwardY * 36;
            this.stairCooldown = 0.8;
            break;
          } else if (st.direction === 'down' && Math.hypot(this.x - btmX, this.y - btmY) < triggerDist) {
            this.currentFloor = st.targetFloor;
            this.x = btmX - forwardX * 36;
            this.y = btmY - forwardY * 36;
            this.stairCooldown = 0.8;
            break;
          }
        }
      }
    }

    if (keys['mouseLeft']) {
      const slot = this.inventory.getActiveSlot();
      if (slot && slot.item) {
        if (slot.item.type === 'weapon' && this.cooldown <= 0) {
          this.shoot(spawnBullet, mapData);
        } else if (slot.item.type === 'consumable') {
          this.inventory.startUsingConsumable(this);
        }
      }
    } else {
      if (this.inventory.isUsingItem) {
        this.inventory.isUsingItem = false;
        this.inventory.useTimer = 0;
      }
    }
  }

  shoot(spawnBullet, mapData) {
    const slot = this.inventory.getActiveSlot();
    if (!slot || !slot.item || slot.item.type !== 'weapon') return;
    if (this.inventory.isReloading) return;

    if (slot.currentMag <= 0) {
      this.inventory.startReload();
      return;
    }

    const wep = slot.item;
    this.cooldown = wep.fireRate;
    slot.currentMag -= 1;

    const barrelLength = this.radius + 10;
    const muzzle = window.Game.Physics.getSafeMuzzlePosition(
      this.x, this.y, this.angle, barrelLength, this.currentFloor, mapData
    );

    if (!muzzle) return;

    const currentSpread = this.isAiming ? wep.spread * 0.35 : wep.spread;
    const pellets = wep.pellets || 1;
    const shooterId = (window.Game.Network && window.Game.Network.myId) ? window.Game.Network.myId : 'local_player';

    for (let i = 0; i < pellets; i++) {
      const spreadOffset = (Math.random() - 0.5) * currentSpread;
      const fireAngle = this.angle + spreadOffset;

      const bullet = new window.Game.Bullet(
        muzzle.x, muzzle.y, fireAngle, this.currentFloor, wep.damage, wep.bulletSpeed, shooterId
      );
      spawnBullet(bullet);

      if (window.Game.Network && typeof window.Game.Network.sendAction === 'function') {
        window.Game.Network.sendAction('shoot', {
          id: bullet.id,
          x: muzzle.x,
          y: muzzle.y,
          angle: fireAngle,
          floor: this.currentFloor,
          damage: wep.damage,
          speed: wep.bulletSpeed,
          shooterId: shooterId
        });
      }
    }
  }

  checkCollision(x, y, mapData) {
    const level = mapData.levels[this.currentFloor];
    if (!level) return false;
    const cfg = window.Game.CONFIG;

    if (x < this.radius || x > mapData.cols * cfg.TILE_SIZE - this.radius) return true;
    if (y < this.radius || y > mapData.rows * cfg.TILE_SIZE - this.radius) return true;

    const col = Math.floor(x / cfg.TILE_SIZE);
    const row = Math.floor(y / cfg.TILE_SIZE);
    if (level.solids[`${col},${row}`]) return true;

    for (const w of level.walls) {
      if (window.Game.distToSegment(x, y, w.x1, w.y1, w.x2, w.y2) < this.radius + w.thickness / 2) return true;
    }

    if (level.windows) {
      for (const win of level.windows) {
        if (window.Game.distToSegment(x, y, win.x1, win.y1, win.x2, win.y2) < this.radius + win.thickness / 2) return true;
      }
    }

    for (const d of level.doors) {
      const currentAngle = (d.currentRotation !== undefined ? d.currentRotation : (d.rotation || 0)) * Math.PI / 180;
      const x2 = d.hingeX + Math.cos(currentAngle) * d.width;
      const y2 = d.hingeY + Math.sin(currentAngle) * d.width;
      if (window.Game.distToSegment(x, y, d.hingeX, d.hingeY, x2, y2) < this.radius + 3) return true;
    }

    return false;
  }

  draw(ctx) {
    if (this.isDead) return;

    ctx.save();
    ctx.translate(this.x, this.y);
    ctx.rotate(this.angle);

    const slot = this.inventory.getActiveSlot();

    if (slot && slot.item) {
      if (slot.item.type === 'weapon') {
        ctx.fillStyle = slot.item.color || '#6e7681';
        ctx.fillRect(0, -3, this.radius + 10, 6);
      } else if (slot.item.type === 'consumable') {
        ctx.fillStyle = slot.item.color;
        ctx.beginPath();
        ctx.arc(this.radius + 6, 0, 5, 0, Math.PI * 2);
        ctx.fill();
      }
    }

    ctx.fillStyle = '#2563eb';
    ctx.beginPath();
    ctx.arc(0, 0, this.radius, 0, Math.PI * 2);
    ctx.fill();

    if (this.armorHp > 0) {
      ctx.fillStyle = 'rgba(56, 189, 248, 0.28)';
      ctx.beginPath();
      ctx.arc(0, 0, this.radius - 1, 0, Math.PI * 2);
      ctx.fill();

      ctx.strokeStyle = '#38bdf8';
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.arc(0, 0, this.radius - 2, 0, Math.PI * 2);
      ctx.stroke();
    }

    ctx.strokeStyle = '#ffffff';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.arc(0, 0, this.radius, 0, Math.PI * 2);
    ctx.stroke();

    ctx.restore();
  }
};

window.Game.RemotePlayer = class RemotePlayer {
  constructor(id, name, color = '#f43f5e') {
    this.id = id;
    this.name = name || 'Spectre';
    this.color = color;
    this.x = 150;
    this.y = 150;
    this.targetX = 150;
    this.targetY = 150;
    this.angle = 0;
    this.targetAngle = 0;
    this.currentFloor = 'floor1';
    this.hp = 100;
    this.armorHp = 0;
    this.radius = 16;
    this.isDead = false;
  }

  applySnapshot(data) {
    this.targetX = data.x;
    this.targetY = data.y;
    this.targetAngle = data.angle;
    this.currentFloor = data.floor;
    this.hp = data.hp;
    this.armorHp = data.armorHp;
    this.isDead = !!data.isDead;
  }

  takeDamage(amount) {
    if (this.isDead) return { hpLost: 0, armorLost: 0, died: false };

    let armorLost = 0;
    let hpLost = 0;

    if (this.armorHp > 0) {
      if (this.armorHp >= amount) {
        this.armorHp -= amount;
        armorLost = amount;
        amount = 0;
      } else {
        armorLost = this.armorHp;
        amount -= this.armorHp;
        this.armorHp = 0;
      }
    }

    if (amount > 0) {
      const prevHp = this.hp;
      this.hp = Math.max(0, this.hp - amount);
      hpLost = prevHp - this.hp;
    }

    if (this.hp <= 0) {
      this.isDead = true;
    }

    return { hpLost, armorLost, died: this.isDead };
  }

  update(dt) {
    this.x += (this.targetX - this.x) * Math.min(18 * dt, 1);
    this.y += (this.targetY - this.y) * Math.min(18 * dt, 1);

    let diff = this.targetAngle - this.angle;
    while (diff < -Math.PI) diff += Math.PI * 2;
    while (diff > Math.PI) diff -= Math.PI * 2;
    this.angle += diff * Math.min(18 * dt, 1);
  }

  draw(ctx) {
    if (this.isDead) return;

    ctx.save();
    ctx.translate(this.x, this.y);

    // Nametag
    ctx.save();
    ctx.font = 'bold 11px monospace';
    ctx.fillStyle = '#ffffff';
    ctx.textAlign = 'center';
    ctx.fillText(this.name, 0, -28);

    // HP & Shield Bar
    const barW = 34;
    const hpRatio = Math.max(0, this.hp / 100);
    ctx.fillStyle = 'rgba(15, 23, 42, 0.85)';
    ctx.fillRect(-barW / 2, -24, barW, 4);
    ctx.fillStyle = this.armorHp > 0 ? '#38bdf8' : '#22c55e';
    ctx.fillRect(-barW / 2, -24, barW * hpRatio, 4);
    ctx.restore();

    ctx.rotate(this.angle);

    ctx.fillStyle = this.color;
    ctx.shadowColor = this.color;
    ctx.shadowBlur = 8;
    ctx.beginPath();
    ctx.arc(0, 0, this.radius, 0, Math.PI * 2);
    ctx.fill();

    // Weapon barrel
    ctx.fillStyle = '#1e293b';
    ctx.fillRect(8, -4, 14, 8);
    ctx.strokeStyle = '#64748b';
    ctx.lineWidth = 1.5;
    ctx.strokeRect(8, -4, 14, 8);

    ctx.restore();
  }
};