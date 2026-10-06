window.Game = window.Game || {};
window.Game._bulletIdCounter = window.Game._bulletIdCounter || 1;

window.Game.Bullet = class Bullet {
  constructor(x, y, angle, floor, damage = 25, speed = 900, shooterId = null, id = null) {
    this.id = id || `b_${Date.now()}_${window.Game._bulletIdCounter++}`;
    this.x = x;
    this.y = y;
    this.prevX = x;
    this.prevY = y;
    this.angle = angle;
    this.floor = floor;
    this.damage = damage;
    this.speed = speed;
    this.shooterId = shooterId; // Prevent self-hits
    this.distanceTraveled = 0;
    this.maxDistance = 1400;
    this.isDead = false;
    this.radius = 3;
  }

  update(dt, mapData, onHitCallback = null) {
    if (this.isDead) return;

    this.prevX = this.x;
    this.prevY = this.y;

    const moveDist = this.speed * dt;
    this.x += Math.cos(this.angle) * moveDist;
    this.y += Math.sin(this.angle) * moveDist;
    this.distanceTraveled += moveDist;

    if (this.distanceTraveled >= this.maxDistance) {
      this.isDead = true;
      return;
    }

    // Check collision against map level
    const level = mapData.levels[this.floor];
    if (level) {
      const cfg = window.Game.CONFIG;

      // 1. Solid Blocks
      const col = Math.floor(this.x / cfg.TILE_SIZE);
      const row = Math.floor(this.y / cfg.TILE_SIZE);
      if (level.solids && level.solids[`${col},${row}`]) {
        this.isDead = true;
        return;
      }

      // 2. Thin Walls
      if (level.walls) {
        for (const w of level.walls) {
          if (window.Game.lineIntersection(this.prevX, this.prevY, this.x, this.y, w.x1, w.y1, w.x2, w.y2)) {
            this.isDead = true;
            return;
          }
        }
      }

      // 3. Doors (only block if closed or moving)
      if (level.doors) {
        for (const d of level.doors) {
          if (!d.isOpen) {
            const rad = (d.currentRotation !== undefined ? d.currentRotation : (d.rotation || 0)) * Math.PI / 180;
            const x2 = d.hingeX + Math.cos(rad) * d.width;
            const y2 = d.hingeY + Math.sin(rad) * d.width;
            if (window.Game.lineIntersection(this.prevX, this.prevY, this.x, this.y, d.hingeX, d.hingeY, x2, y2)) {
              this.isDead = true;
              return;
            }
          }
        }
      }
    }
  }

  draw(ctx) {
    if (this.isDead) return;

    ctx.save();
    ctx.strokeStyle = '#fde047';
    ctx.lineWidth = 3;
    ctx.lineCap = 'round';
    ctx.shadowColor = '#facc15';
    ctx.shadowBlur = 6;

    ctx.beginPath();
    ctx.moveTo(this.prevX, this.prevY);
    ctx.lineTo(this.x, this.y);
    ctx.stroke();

    ctx.restore();
  }
};