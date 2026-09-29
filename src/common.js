window.Game = window.Game || {};

// Line segment intersection test: returns {x, y} point or null
window.Game.lineIntersection = function(x1, y1, x2, y2, x3, y3, x4, y4) {
  const denom = (y4 - y3) * (x2 - x1) - (x4 - x3) * (y2 - y1);
  if (denom === 0) return null; // Parallel or collinear

  const ua = ((x4 - x3) * (y1 - y3) - (y4 - y3) * (x1 - x3)) / denom;
  const ub = ((x2 - x1) * (y1 - y3) - (y2 - y1) * (x1 - x3)) / denom;

  if (ua >= 0 && ua <= 1 && ub >= 0 && ub <= 1) {
    return {
      x: x1 + ua * (x2 - x1),
      y: y1 + ua * (y2 - y1)
    };
  }
  return null;
};

window.Game.CONFIG = {
  TILE_SIZE: 48,
  PLAYER_SPEED: 260,
  PLAYER_RADIUS: 16,
  BULLET_SPEED: 700,
  BULLET_LIFETIME: 1.2,
  FIRE_RATE: 0.15,
  MAP_COLS: 40,
  MAP_ROWS: 40,
  VISION_RADIUS: 520,
  STORAGE_KEY: 'resurgence_custom_map'
};

window.Game.distToSegment = function(px, py, x1, y1, x2, y2) {
  const l2 = (x2 - x1) ** 2 + (y2 - y1) ** 2;
  if (l2 === 0) return Math.hypot(px - x1, py - y1);
  let t = ((px - x1) * (x2 - x1) + (py - y1) * (y2 - y1)) / l2;
  t = Math.max(0, Math.min(1, t));
  return Math.hypot(px - (x1 + t * (x2 - x1)), py - (y1 + t * (y2 - y1)));
};

window.Game.getRayIntersection = function(rx, ry, rdx, rdy, x1, y1, x2, y2) {
  const dx = x2 - x1;
  const dy = y2 - y1;
  const cross = rdx * dy - rdy * dx;
  if (Math.abs(cross) < 1e-8) return null;

  const t1 = ((x1 - rx) * dy - (y1 - ry) * dx) / cross;
  const t2 = ((x1 - rx) * rdy - (y1 - ry) * rdx) / cross;

  if (t1 > 0 && t2 >= 0 && t2 <= 1) {
    return { x: rx + rdx * t1, y: ry + rdy * t1, dist: t1 };
  }
  return null;
};

window.Game.loadMapData = function() {
  const raw = localStorage.getItem(window.Game.CONFIG.STORAGE_KEY);
  if (raw) {
    try {
      const data = JSON.parse(raw);
      for (const key of ['floor1', 'floor2', 'roof']) {
        if (!data.levels[key].windows) data.levels[key].windows = [];
        if (!data.levels[key].chests) data.levels[key].chests = [];
      }
      return data;
    } catch (e) {
      console.error("Map parsing fallback", e);
    }
  }
  return {
    tileSize: window.Game.CONFIG.TILE_SIZE,
    cols: window.Game.CONFIG.MAP_COLS,
    rows: window.Game.CONFIG.MAP_ROWS,
    buildingZones: {},
    levels: {
      floor1: { floors: {}, solids: {}, walls: [], doors: [], windows: [], stairs: [], chests: [] },
      floor2: { floors: {}, solids: {}, walls: [], doors: [], windows: [], stairs: [], chests: [] },
      roof:   { floors: {}, solids: {}, walls: [], doors: [], windows: [], stairs: [], chests: [] }
    }
  };
};