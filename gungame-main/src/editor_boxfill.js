window.Game = window.Game || {};

window.Game.BoxFill = {
  isBoxDragging: false,
  startCol: 0,
  startRow: 0,
  currentCol: 0,
  currentRow: 0,

  start(col, row) {
    this.isBoxDragging = true;
    this.startCol = col;
    this.startRow = row;
    this.currentCol = col;
    this.currentRow = row;
  },

  update(col, row) {
    if (this.isBoxDragging) {
      this.currentCol = col;
      this.currentRow = row;
    }
  },

  getBounds(maxCols, maxRows) {
    const c1 = Math.max(0, Math.min(this.startCol, this.currentCol));
    const c2 = Math.min(maxCols - 1, Math.max(this.startCol, this.currentCol));
    const r1 = Math.max(0, Math.min(this.startRow, this.currentRow));
    const r2 = Math.min(maxRows - 1, Math.max(this.startRow, this.currentRow));
    return { c1, c2, r1, r2 };
  },

  apply(level, paintType, color, maxCols, maxRows) {
    if (!this.isBoxDragging) return;
    const { c1, c2, r1, r2 } = this.getBounds(maxCols, maxRows);

    for (let c = c1; c <= c2; c++) {
      for (let r = r1; r <= r2; r++) {
        const key = `${c},${r}`;
        if (paintType === 'floor') {
          level.floors[key] = color;
          delete level.solids[key];
        } else {
          level.solids[key] = color;
          delete level.floors[key];
        }
      }
    }
    this.isBoxDragging = false;
  },

  cancel() {
    this.isBoxDragging = false;
  },

  drawPreview(ctx, tileSize, maxCols, maxRows, color) {
    if (!this.isBoxDragging) return;
    const { c1, c2, r1, r2 } = this.getBounds(maxCols, maxRows);
    const x = c1 * tileSize;
    const y = r1 * tileSize;
    const w = (c2 - c1 + 1) * tileSize;
    const h = (r2 - r1 + 1) * tileSize;

    ctx.save();
    ctx.fillStyle = color;
    ctx.globalAlpha = 0.45;
    ctx.fillRect(x, y, w, h);

    ctx.globalAlpha = 1.0;
    ctx.strokeStyle = '#38bdf8';
    ctx.lineWidth = 2;
    ctx.setLineDash([6, 4]);
    ctx.strokeRect(x, y, w, h);
    ctx.restore();
  }
};