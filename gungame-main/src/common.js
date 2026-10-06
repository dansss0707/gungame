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

// ==========================================
// 30-WEAPON COMPREHENSIVE TIERED ARSENAL
// ==========================================
window.Game.WEAPON_TYPES = {
  // --- TIER I: JUNK & CIVILIAN STARTERS ---
  RUSTY_PISTOL: {
    id: 'RUSTY_PISTOL',
    name: 'Rusty Makarov',
    type: 'weapon',
    color: '#94a3b8',
    damage: 14,
    fireRate: 3.5,
    speed: 680,
    magSize: 8,
    reserveAmmo: 32,
    reloadTime: 1.8,
    spread: 0.065,
    pellets: 1
  },
  PIPE_PISTOL: {
    id: 'PIPE_PISTOL',
    name: 'Scrap Pipe Pistol',
    type: 'weapon',
    color: '#a1a1aa',
    damage: 22,
    fireRate: 2.0,
    speed: 620,
    magSize: 6,
    reserveAmmo: 24,
    reloadTime: 2.4,
    spread: 0.08,
    pellets: 1
  },
  HUNTING_RIFLE_OLD: {
    id: 'HUNTING_RIFLE_OLD',
    name: 'Rotted .22 Carbine',
    type: 'weapon',
    color: '#78716c',
    damage: 32,
    fireRate: 1.5,
    speed: 800,
    magSize: 5,
    reserveAmmo: 25,
    reloadTime: 2.6,
    spread: 0.035,
    pellets: 1
  },
  OLD_DOUBLE_BARREL: {
    id: 'OLD_DOUBLE_BARREL',
    name: 'Rusted Boomstick',
    type: 'weapon',
    color: '#b45309',
    damage: 11,
    fireRate: 2.2,
    speed: 590,
    magSize: 2,
    reserveAmmo: 18,
    reloadTime: 2.8,
    spread: 0.22,
    pellets: 7
  },
  CIVILIAN_REVOLVER: {
    id: 'CIVILIAN_REVOLVER',
    name: '.38 Snub Revolver',
    type: 'weapon',
    color: '#cbd5e1',
    damage: 34,
    fireRate: 2.5,
    speed: 750,
    magSize: 6,
    reserveAmmo: 24,
    reloadTime: 2.3,
    spread: 0.05,
    pellets: 1
  },
  NAIL_GUN: {
    id: 'NAIL_GUN',
    name: 'Pneumatic Nailer',
    type: 'weapon',
    color: '#e2e8f0',
    damage: 10,
    fireRate: 14.0,
    speed: 550,
    magSize: 40,
    reserveAmmo: 120,
    reloadTime: 1.7,
    spread: 0.11,
    pellets: 1
  },

  // --- TIER II: STANDARD SIDEARMS & PATROL SMGS ---
  SERVICE_PISTOL: {
    id: 'SERVICE_PISTOL',
    name: 'G19 Tactical 9mm',
    type: 'weapon',
    color: '#38bdf8',
    damage: 21,
    fireRate: 6.0,
    speed: 820,
    magSize: 17,
    reserveAmmo: 68,
    reloadTime: 1.3,
    spread: 0.04,
    pellets: 1
  },
  MAGNUM: {
    id: 'MAGNUM',
    name: '.44 Python Magnum',
    type: 'weapon',
    color: '#f59e0b',
    damage: 52,
    fireRate: 2.0,
    speed: 980,
    magSize: 6,
    reserveAmmo: 24,
    reloadTime: 2.1,
    spread: 0.025,
    pellets: 1
  },
  DEAGLE: {
    id: 'DEAGLE',
    name: 'Desert Eagle .50',
    type: 'weapon',
    color: '#ec4899',
    damage: 64,
    fireRate: 2.2,
    speed: 1080,
    magSize: 7,
    reserveAmmo: 28,
    reloadTime: 1.8,
    spread: 0.02,
    pellets: 1
  },
  AKIMBO_BERETTAS: {
    id: 'AKIMBO_BERETTAS',
    name: 'Dual Berettas',
    type: 'weapon',
    color: '#818cf8',
    damage: 19,
    fireRate: 8.0,
    speed: 800,
    magSize: 30,
    reserveAmmo: 90,
    reloadTime: 2.2,
    spread: 0.08,
    pellets: 2
  },
  MAC10: {
    id: 'MAC10',
    name: 'MAC-10 Enforcer',
    type: 'weapon',
    color: '#10b981',
    damage: 13,
    fireRate: 15.0,
    speed: 730,
    magSize: 32,
    reserveAmmo: 96,
    reloadTime: 1.4,
    spread: 0.10,
    pellets: 1
  },
  SMG: {
    id: 'SMG',
    name: 'Micro SMG',
    type: 'weapon',
    color: '#4ade80',
    damage: 17,
    fireRate: 11.0,
    speed: 780,
    magSize: 30,
    reserveAmmo: 90,
    reloadTime: 1.5,
    spread: 0.075,
    pellets: 1
  },
  UMP45: {
    id: 'UMP45',
    name: 'UMP-45 Tactical',
    type: 'weapon',
    color: '#059669',
    damage: 26,
    fireRate: 7.2,
    speed: 830,
    magSize: 25,
    reserveAmmo: 75,
    reloadTime: 1.7,
    spread: 0.045,
    pellets: 1
  },
  VECTOR: {
    id: 'VECTOR',
    name: 'Vector K10',
    type: 'weapon',
    color: '#22c55e',
    damage: 14,
    fireRate: 18.0,
    speed: 840,
    magSize: 33,
    reserveAmmo: 99,
    reloadTime: 1.4,
    spread: 0.09,
    pellets: 1
  },
  P90: {
    id: 'P90',
    name: 'PDW-50 FN',
    type: 'weapon',
    color: '#06b6d4',
    damage: 18,
    fireRate: 10.5,
    speed: 880,
    magSize: 50,
    reserveAmmo: 150,
    reloadTime: 2.2,
    spread: 0.06,
    pellets: 1
  },

  // --- TIER III: SHOTGUNS ---
  SAWED_OFF: {
    id: 'SAWED_OFF',
    name: 'Sawed-Off Double',
    type: 'weapon',
    color: '#f97316',
    damage: 16,
    fireRate: 3.2,
    speed: 680,
    magSize: 2,
    reserveAmmo: 20,
    reloadTime: 1.7,
    spread: 0.19,
    pellets: 8
  },
  SHOTGUN: {
    id: 'SHOTGUN',
    name: 'M870 Pump Shotgun',
    type: 'weapon',
    color: '#fb923c',
    damage: 15,
    fireRate: 1.1,
    speed: 700,
    magSize: 8,
    reserveAmmo: 32,
    reloadTime: 2.4,
    spread: 0.12,
    pellets: 6
  },
  SLUG_SHOTGUN: {
    id: 'SLUG_SHOTGUN',
    name: 'Sabot Slug Shotgun',
    type: 'weapon',
    color: '#d97706',
    damage: 72,
    fireRate: 1.2,
    speed: 980,
    magSize: 6,
    reserveAmmo: 24,
    reloadTime: 2.3,
    spread: 0.015,
    pellets: 1
  },
  AA12: {
    id: 'AA12',
    name: 'Auto-12 Sweeper',
    type: 'weapon',
    color: '#ea580c',
    damage: 12,
    fireRate: 4.8,
    speed: 720,
    magSize: 12,
    reserveAmmo: 36,
    reloadTime: 2.7,
    spread: 0.15,
    pellets: 5
  },

  // --- TIER IV: ASSAULT RIFLES & BATTLE RIFLES ---
  AK47: {
    id: 'AK47',
    name: 'AK-47 Classic',
    type: 'weapon',
    color: '#d97706',
    damage: 34,
    fireRate: 6.0,
    speed: 890,
    magSize: 30,
    reserveAmmo: 90,
    reloadTime: 2.1,
    spread: 0.05,
    pellets: 1
  },
  ASSAULT_RIFLE: {
    id: 'ASSAULT_RIFLE',
    name: 'M4 Tactical',
    type: 'weapon',
    color: '#38bdf8',
    damage: 27,
    fireRate: 7.5,
    speed: 930,
    magSize: 30,
    reserveAmmo: 90,
    reloadTime: 1.9,
    spread: 0.035,
    pellets: 1
  },
  BURST_RIFLE: {
    id: 'BURST_RIFLE',
    name: 'Burst AR 3-Shot',
    type: 'weapon',
    color: '#eab308',
    damage: 28,
    fireRate: 4.2,
    speed: 950,
    magSize: 24,
    reserveAmmo: 72,
    reloadTime: 2.0,
    spread: 0.024,
    pellets: 1
  },
  BATTLE_RIFLE_SCAR: {
    id: 'BATTLE_RIFLE_SCAR',
    name: 'SCAR Heavy 7.62',
    type: 'weapon',
    color: '#ca8a04',
    damage: 42,
    fireRate: 5.0,
    speed: 1000,
    magSize: 20,
    reserveAmmo: 60,
    reloadTime: 2.3,
    spread: 0.028,
    pellets: 1
  },
  AUG_BULLPUP: {
    id: 'AUG_BULLPUP',
    name: 'Steyr Bullpup A3',
    type: 'weapon',
    color: '#14b8a6',
    damage: 30,
    fireRate: 6.8,
    speed: 960,
    magSize: 30,
    reserveAmmo: 90,
    reloadTime: 2.1,
    spread: 0.022,
    pellets: 1
  },

  // --- TIER V: LIGHT & HEAVY MACHINE GUNS ---
  M249: {
    id: 'M249',
    name: 'M249 SAW Belt-Fed',
    type: 'weapon',
    color: '#e11d48',
    damage: 24,
    fireRate: 8.8,
    speed: 870,
    magSize: 75,
    reserveAmmo: 150,
    reloadTime: 4.2,
    spread: 0.065,
    pellets: 1
  },
  PKM_HEAVY: {
    id: 'PKM_HEAVY',
    name: 'PKM Heavy Machine Gun',
    type: 'weapon',
    color: '#be123c',
    damage: 35,
    fireRate: 6.5,
    speed: 920,
    magSize: 100,
    reserveAmmo: 200,
    reloadTime: 4.8,
    spread: 0.075,
    pellets: 1
  },

  // --- TIER VI: LONG RANGE & SNIPERS ---
  DMR: {
    id: 'DMR',
    name: 'Scout DMR',
    type: 'weapon',
    color: '#a855f7',
    damage: 48,
    fireRate: 3.5,
    speed: 1100,
    magSize: 15,
    reserveAmmo: 45,
    reloadTime: 2.1,
    spread: 0.016,
    pellets: 1
  },
  BOLT_ACTION: {
    id: 'BOLT_ACTION',
    name: 'AWM .338 Lapua',
    type: 'weapon',
    color: '#7c3aed',
    damage: 88,
    fireRate: 1.0,
    speed: 1350,
    magSize: 5,
    reserveAmmo: 20,
    reloadTime: 2.7,
    spread: 0.008,
    pellets: 1
  },
  SNIPER: {
    id: 'SNIPER',
    name: 'Heavy Sniper .50',
    type: 'weapon',
    color: '#f43f5e',
    damage: 98,
    fireRate: 0.75,
    speed: 1500,
    magSize: 5,
    reserveAmmo: 15,
    reloadTime: 3.0,
    spread: 0.006,
    pellets: 1
  },

  // --- TIER VII: EXPERIMENTAL POWER WEAPONS ---
  MINIGUN: {
    id: 'MINIGUN',
    name: 'Vulcan Microgun',
    type: 'weapon',
    color: '#f43f5e',
    damage: 15,
    fireRate: 19.0,
    speed: 920,
    magSize: 150,
    reserveAmmo: 300,
    reloadTime: 5.2,
    spread: 0.11,
    pellets: 1
  },
  RAILGUN: {
    id: 'RAILGUN',
    name: 'Prototype Railgun',
    type: 'weapon',
    color: '#06b6d4',
    damage: 125,
    fireRate: 0.5,
    speed: 1900,
    magSize: 3,
    reserveAmmo: 9,
    reloadTime: 3.4,
    spread: 0.001,
    pellets: 1
  }
};

// ==========================================
// CONSUMABLE DEFINITIONS
// ==========================================
window.Game.CONSUMABLE_TYPES = {
  MINI_SHIELD: {
    id: 'MINI_SHIELD',
    name: 'Mini Shields',
    type: 'consumable',
    color: '#38bdf8',
    healType: 'armor',
    amount: 25,
    maxCap: 50,
    useTime: 2.0
  },
  BIG_SHIELD: {
    id: 'BIG_SHIELD',
    name: 'Big Shield',
    type: 'consumable',
    color: '#0284c7',
    healType: 'armor',
    amount: 50,
    maxCap: 150,
    useTime: 3.5
  },
  MEDKIT: {
    id: 'MEDKIT',
    name: 'Medical Kit',
    type: 'consumable',
    color: '#10b981',
    healType: 'health',
    amount: 100,
    maxCap: 100,
    useTime: 4.5
  }
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