window.Game = window.Game || {};

window.Game.DamageFx = class DamageFx {
  constructor() {
    this.pops = [];
  }

  spawn(x, y, damage, isShield = false) {
    this.pops.push({
      x: x + (Math.random() * 12 - 6),
      y: y - 10,
      text: Math.round(damage).toString(),
      color: isShield ? '#38bdf8' : '#ef4444',
      alpha: 1.0,
      vy: -40
    });
  }

  update(dt) {
    for (let i = this.pops.length - 1; i >= 0; i--) {
      const p = this.pops[i];
      p.y += p.vy * dt;
      p.alpha -= dt * 1.8;
      if (p.alpha <= 0) this.pops.splice(i, 1);
    }
  }

  draw(ctx) {
    for (const pop of this.pops) {
      ctx.save();
      ctx.globalAlpha = Math.max(0, pop.alpha);
      ctx.font = 'bold 15px -apple-system, monospace';
      ctx.fillStyle = pop.color;
      ctx.strokeStyle = '#000000';
      ctx.lineWidth = 3;
      ctx.textAlign = 'center';
      ctx.strokeText(pop.text, pop.x, pop.y);
      ctx.fillText(pop.text, pop.x, pop.y);
      ctx.restore();
    }
  }
};