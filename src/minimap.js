window.Game = window.Game || {};

window.Game.Minimap = class Minimap {
  constructor(canvasId) {
    this.canvas = document.getElementById(canvasId);
    this.ctx = this.canvas ? this.canvas.getContext('2d') : null;
    this.size = 170;
    this.radarRadius = 1150;
  }

  draw(mapData, player, chests, kiosks, camera) {
    if (!this.ctx || !this.canvas) return;
    const ctx = this.ctx;
    const size = this.size;
    const center = size / 2;

    const cfg = window.Game.CONFIG;
    const scale = (size / 2) / this.radarRadius;

    ctx.clearRect(0, 0, size, size);

    ctx.save();
    ctx.beginPath();
    ctx.arc(center, center, center - 2, 0, Math.PI * 2);
    ctx.clip();

    ctx.fillStyle = '#090d16';
    ctx.fillRect(0, 0, size, size);

    // ==========================================
    // LAYER 1: World Map Geometry
    // ==========================================
    ctx.save();
    ctx.translate(center, center);
    ctx.scale(scale, scale);
    ctx.translate(-player.x, -player.y);

    const level = mapData.levels[player.currentFloor];

    const minX = player.x - this.radarRadius;
    const maxX = player.x + this.radarRadius;
    const minY = player.y - this.radarRadius;
    const maxY = player.y + this.radarRadius;

    if (level) {
      for (const [key, color] of Object.entries(level.floors)) {
        const [c, r] = key.split(',').map(Number);
        const wx = c * cfg.TILE_SIZE;
        const wy = r * cfg.TILE_SIZE;
        if (wx + cfg.TILE_SIZE >= minX && wx <= maxX && wy + cfg.TILE_SIZE >= minY && wy <= maxY) {
          ctx.fillStyle = color || '#1e293b';
          ctx.fillRect(wx, wy, cfg.TILE_SIZE, cfg.TILE_SIZE);
        }
      }

      for (const [key, color] of Object.entries(level.solids)) {
        const [c, r] = key.split(',').map(Number);
        const wx = c * cfg.TILE_SIZE;
        const wy = r * cfg.TILE_SIZE;
        if (wx + cfg.TILE_SIZE >= minX && wx <= maxX && wy + cfg.TILE_SIZE >= minY && wy <= maxY) {
          ctx.fillStyle = '#475569';
          ctx.fillRect(wx, wy, cfg.TILE_SIZE, cfg.TILE_SIZE);
        }
      }

      if (level.walls) {
        ctx.strokeStyle = '#94a3b8';
        ctx.lineWidth = Math.max(2, 4 / scale * 0.2);
        ctx.lineCap = 'round';
        ctx.beginPath();
        for (const w of level.walls) {
          ctx.moveTo(w.x1, w.y1);
          ctx.lineTo(w.x2, w.y2);
        }
        ctx.stroke();
      }

      if (level.doors) {
        ctx.strokeStyle = '#d29922';
        ctx.lineWidth = Math.max(2, 4 / scale * 0.2);
        ctx.beginPath();
        for (const d of level.doors) {
          const rad = (d.currentRotation !== undefined ? d.currentRotation : (d.rotation || 0)) * Math.PI / 180;
          ctx.moveTo(d.hingeX, d.hingeY);
          ctx.lineTo(d.hingeX + Math.cos(rad) * d.width, d.hingeY + Math.sin(rad) * d.width);
        }
        ctx.stroke();
      }
    }

    ctx.restore();

    // ==========================================
    // LAYER 2: Kiosks ($) & Player Marker
    // ==========================================
    ctx.save();
    ctx.translate(center, center);

    for (const k of kiosks) {
      if (k.floor === player.currentFloor) {
        const mx = (k.x - player.x) * scale;
        const my = (k.y - player.y) * scale;

        if (Math.hypot(mx, my) > center - 10) continue;

        ctx.save();
        ctx.translate(mx, my);

        ctx.fillStyle = '#15803d';
        ctx.beginPath();
        ctx.arc(0, 0, 9, 0, Math.PI * 2);
        ctx.fill();

        ctx.strokeStyle = '#4ade80';
        ctx.lineWidth = 1.5;
        ctx.stroke();

        ctx.fillStyle = '#ffffff';
        ctx.font = 'bold 12px monospace';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText('$', 0, 0.5);

        ctx.restore();
      }
    }

    ctx.save();
    ctx.rotate(player.angle);
    ctx.fillStyle = '#38bdf8';
    ctx.shadowColor = '#0284c7';
    ctx.shadowBlur = 6;
    ctx.beginPath();
    ctx.moveTo(9, 0);
    ctx.lineTo(-6, -5);
    ctx.lineTo(-3, 0);
    ctx.lineTo(-6, 5);
    ctx.closePath();
    ctx.fill();
    ctx.restore();

    ctx.restore();

    // ==========================================
    // LAYER 3: Outer Bezel
    // ==========================================
    ctx.restore();
    ctx.strokeStyle = '#38bdf8';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.arc(center, center, center - 2, 0, Math.PI * 2);
    ctx.stroke();
  }
};