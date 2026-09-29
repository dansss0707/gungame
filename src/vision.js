window.Game = window.Game || {};
window.Game.Vision = window.Game.Vision || {};

// Dedicated offscreen shadow mask canvas to prevent alpha-stacking seams
let shadowCanvas = null;
let shadowCtx = null;

function getShadowBuffer(w, h) {
  if (!shadowCanvas) {
    shadowCanvas = document.createElement('canvas');
    shadowCtx = shadowCanvas.getContext('2d');
  }
  if (shadowCanvas.width !== w || shadowCanvas.height !== h) {
    shadowCanvas.width = w;
    shadowCanvas.height = h;
  }
  return { shadowCanvas, shadowCtx };
}

// Line-of-sight test for player culling
window.Game.Vision.hasLineOfSight = function(x1, y1, x2, y2, mapData, currentFloor) {
  const level = mapData.levels[currentFloor];
  if (!level) return false;
  const cfg = window.Game.CONFIG;

  // 1. Solid grid blocks
  const dist = Math.hypot(x2 - x1, y2 - y1);
  const steps = Math.ceil(dist / (cfg.TILE_SIZE * 0.4));
  for (let i = 1; i < steps; i++) {
    const t = i / steps;
    const px = x1 + (x2 - x1) * t;
    const py = y1 + (y2 - y1) * t;
    const col = Math.floor(px / cfg.TILE_SIZE);
    const row = Math.floor(py / cfg.TILE_SIZE);
    if (level.solids && level.solids[`${col},${row}`]) return false;
  }

  // 2. Thin walls
  if (level.walls) {
    for (const w of level.walls) {
      if (window.Game.lineIntersection(x1, y1, x2, y2, w.x1, w.y1, w.x2, w.y2)) return false;
    }
  }

  // 3. Closed doors
  if (level.doors) {
    for (const d of level.doors) {
      if (!d.isOpen) {
        const rad = (d.currentRotation !== undefined ? d.currentRotation : (d.rotation || 0)) * Math.PI / 180;
        const dx2 = d.hingeX + Math.cos(rad) * d.width;
        const dy2 = d.hingeY + Math.sin(rad) * d.width;
        if (window.Game.lineIntersection(x1, y1, x2, y2, d.hingeX, d.hingeY, dx2, dy2)) return false;
      }
    }
  }

  return true;
};

// Seamless 2D Shadow Projection (No Overlap Artifacts)
window.Game.Vision.drawFieldOfView = function(ctx, playerX, playerY, mapData, currentFloor, camera) {
  const level = mapData.levels[currentFloor];
  if (!level) return;

  const cfg = window.Game.CONFIG;
  const shadowDist = 2400;

  // 1. Gather all shadow-casting segments near player
  const segments = [];

  if (level.walls) {
    for (const w of level.walls) {
      if (Math.hypot((w.x1 + w.x2) / 2 - playerX, (w.y1 + w.y2) / 2 - playerY) < 1400) {
        segments.push({ x1: w.x1, y1: w.y1, x2: w.x2, y2: w.y2 });
      }
    }
  }

  if (level.doors) {
    for (const d of level.doors) {
      if (!d.isOpen) {
        const rad = (d.currentRotation !== undefined ? d.currentRotation : (d.rotation || 0)) * Math.PI / 180;
        segments.push({
          x1: d.hingeX,
          y1: d.hingeY,
          x2: d.hingeX + Math.cos(rad) * d.width,
          y2: d.hingeY + Math.sin(rad) * d.width
        });
      }
    }
  }

  if (level.solids) {
    const range = 1200;
    const minC = Math.max(0, Math.floor((playerX - range) / cfg.TILE_SIZE));
    const maxC = Math.min((mapData.cols || cfg.MAP_COLS), Math.ceil((playerX + range) / cfg.TILE_SIZE));
    const minR = Math.max(0, Math.floor((playerY - range) / cfg.TILE_SIZE));
    const maxR = Math.min((mapData.rows || cfg.MAP_ROWS), Math.ceil((playerY + range) / cfg.TILE_SIZE));

    for (let c = minC; c < maxC; c++) {
      for (let r = minR; r < maxR; r++) {
        if (level.solids[`${c},${r}`]) {
          const x = c * cfg.TILE_SIZE;
          const y = r * cfg.TILE_SIZE;
          const s = cfg.TILE_SIZE;

          if (!level.solids[`${c},${r - 1}`]) segments.push({ x1: x, y1: y, x2: x + s, y2: y });
          if (!level.solids[`${c + 1},${r}`]) segments.push({ x1: x + s, y1: y, x2: x + s, y2: y + s });
          if (!level.solids[`${c},${r + 1}`]) segments.push({ x1: x + s, y1: y + s, x2: x, y2: y + s });
          if (!level.solids[`${c - 1},${r}`]) segments.push({ x1: x, y1: y + s, x2: x, y2: y });
        }
      }
    }
  }

  // 2. Prepare screen buffer for zero-overlap rendering
  const bufW = Math.ceil(camera.width);
  const bufH = Math.ceil(camera.height);
  const { shadowCanvas: sCanvas, shadowCtx: sCtx } = getShadowBuffer(bufW, bufH);

  // Clear offscreen buffer completely
  sCtx.clearRect(0, 0, bufW, bufH);

  // Apply camera matrix so we project in world space
  sCtx.save();
  camera.apply(sCtx);

  // Draw all shadow quads with SOLID opacity (#000000)
  // Since opacity is 1.0 here, overlapping shadows fuse into a single shape
  sCtx.fillStyle = '#000000';
  sCtx.beginPath();

  for (const seg of segments) {
    const cross = (seg.x2 - seg.x1) * (playerY - seg.y1) - (seg.y2 - seg.y1) * (playerX - seg.x1);

    const v1x = seg.x1 - playerX;
    const v1y = seg.y1 - playerY;
    const v2x = seg.x2 - playerX;
    const v2y = seg.y2 - playerY;

    const len1 = Math.hypot(v1x, v1y) || 1;
    const len2 = Math.hypot(v2x, v2y) || 1;

    const p1x = seg.x1 + (v1x / len1) * shadowDist;
    const p1y = seg.y1 + (v1y / len1) * shadowDist;
    const p2x = seg.x2 + (v2x / len2) * shadowDist;
    const p2y = seg.y2 + (v2y / len2) * shadowDist;

    if (cross > 0) {
      sCtx.moveTo(seg.x1, seg.y1);
      sCtx.lineTo(seg.x2, seg.y2);
      sCtx.lineTo(p2x, p2y);
      sCtx.lineTo(p1x, p1y);
    } else {
      sCtx.moveTo(seg.x2, seg.y2);
      sCtx.lineTo(seg.x1, seg.y1);
      sCtx.lineTo(p1x, p1y);
      sCtx.lineTo(p2x, p2y);
    }
  }

  sCtx.closePath();
  sCtx.fill();

  // 3. Ambient edge vignette on the buffer
  const viewW = camera.width / camera.currentZoom;
  const viewH = camera.height / camera.currentZoom;
  const maxR = Math.max(viewW, viewH) * 0.75;
  const grad = sCtx.createRadialGradient(playerX, playerY, maxR * 0.45, playerX, playerY, maxR);
  grad.addColorStop(0, 'rgba(0, 0, 0, 0)');
  grad.addColorStop(0.8, 'rgba(0, 0, 0, 0.3)');
  grad.addColorStop(1, 'rgba(0, 0, 0, 1)');

  sCtx.fillStyle = grad;
  sCtx.beginPath();
  sCtx.arc(playerX, playerY, maxR, 0, Math.PI * 2);
  sCtx.fill();

  sCtx.restore();

  // 4. Blit to main screen with a single globalAlpha (change 0.55 to make darker/lighter)
  ctx.save();
  ctx.setTransform(1, 0, 0, 1, 0, 0); // Reset to screen space
  ctx.globalAlpha = 0.58;            // Uniform transparency everywhere!
  ctx.drawImage(sCanvas, 0, 0);
  ctx.restore();
};