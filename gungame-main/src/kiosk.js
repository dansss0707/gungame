window.Game = window.Game || {};

window.Game.Kiosk = class Kiosk {
  constructor(x, y, floor, id = Math.random().toString(36).substr(2, 9)) {
    this.id = id;
    this.x = x;
    this.y = y;
    this.floor = floor;
    this.width = 44;
    this.height = 30;
    this.pulseTimer = Math.random() * Math.PI * 2;
  }

  update(dt) {
    this.pulseTimer += dt * 3.0;
  }

  draw(ctx) {
    ctx.save();
    ctx.translate(this.x, this.y);

    const pulse = (Math.sin(this.pulseTimer) + 1) / 2;
    const glowColor = '#22c55e';

    // Terminal Base
    ctx.shadowColor = glowColor;
    ctx.shadowBlur = 12 + pulse * 10;

    ctx.fillStyle = '#0f172a';
    ctx.fillRect(-this.width / 2, -this.height / 2, this.width, this.height);

    ctx.strokeStyle = '#15803d';
    ctx.lineWidth = 2.5;
    ctx.strokeRect(-this.width / 2, -this.height / 2, this.width, this.height);

    // Glowing Green Screen
    ctx.fillStyle = `rgba(34, 197, 94, ${0.4 + pulse * 0.35})`;
    ctx.fillRect(-this.width / 2 + 4, -this.height / 2 + 4, this.width - 8, this.height - 8);

    // Dollar Crest
    ctx.shadowBlur = 4;
    ctx.shadowColor = '#ffffff';
    ctx.fillStyle = '#ffffff';
    ctx.font = 'bold 16px monospace';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText('$', 0, 1);

    ctx.restore();
  }
};