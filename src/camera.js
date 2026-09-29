window.Game = window.Game || {};

window.Game.Camera = class Camera {
  constructor(w, h) {
    this.width = w;
    this.height = h;

    this.x = 0;
    this.y = 0;

    // Zoomed in closer: base 1.45x, ADS 1.85x
    this.baseZoom = 1.45;
    this.adsZoom = 1.85;
    this.currentZoom = this.baseZoom;
    this.targetZoom = this.baseZoom;

    this.offsetX = 0;
    this.offsetY = 0;

    // Padding margins to avoid UI occlusion
    this.paddingLeft = 70;
    this.paddingRight = 70;
    this.paddingTop = 60;
    this.paddingBottom = 160;
  }

  resize(w, h) {
    this.width = w;
    this.height = h;
  }

  update(dt, isAiming, playerX, playerY, mouseWorld) {
    this.targetZoom = isAiming ? this.adsZoom : this.baseZoom;
    this.currentZoom += (this.targetZoom - this.currentZoom) * Math.min(10 * dt, 1);

    let targetOffsetX = 0;
    let targetOffsetY = 0;

    if (isAiming && mouseWorld) {
      const toMouseX = mouseWorld.x - playerX;
      const toMouseY = mouseWorld.y - playerY;
      const dist = Math.hypot(toMouseX, toMouseY);

      const maxLead = 150;
      const leadDist = Math.min(dist * 0.45, maxLead);

      if (dist > 1) {
        targetOffsetX = (toMouseX / dist) * leadDist;
        targetOffsetY = (toMouseY / dist) * leadDist;
      }
    }

    this.offsetX += (targetOffsetX - this.offsetX) * Math.min(10 * dt, 1);
    this.offsetY += (targetOffsetY - this.offsetY) * Math.min(10 * dt, 1);
  }

  follow(tx, ty, mapWidth, mapHeight) {
    const viewW = this.width / this.currentZoom;
    const viewH = this.height / this.currentZoom;

    const focusX = tx + this.offsetX;
    const focusY = ty + this.offsetY;

    this.x = focusX - viewW / 2;
    this.y = focusY - viewH / 2;

    const minX = -this.paddingLeft;
    const maxX = mapWidth + this.paddingRight - viewW;
    const minY = -this.paddingTop;
    const maxY = mapHeight + this.paddingBottom - viewH;

    if (maxX < minX) {
      this.x = (mapWidth - viewW) / 2;
    } else {
      this.x = Math.max(minX, Math.min(this.x, maxX));
    }

    if (maxY < minY) {
      this.y = (mapHeight - viewH) / 2;
    } else {
      this.y = Math.max(minY, Math.min(this.y, maxY));
    }
  }

  apply(ctx) {
    ctx.save();
    ctx.scale(this.currentZoom, this.currentZoom);
    ctx.translate(-Math.floor(this.x), -Math.floor(this.y));
  }

  restore(ctx) {
    ctx.restore();
  }

  screenToWorld(sx, sy) {
    return {
      x: sx / this.currentZoom + this.x,
      y: sy / this.currentZoom + this.y
    };
  }
};