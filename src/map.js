window.Game = window.Game || {};

// Asynchronously load the official map.json from the repository
window.Game.loadMapData = async function() {
  // 1. Try local storage override (if you're editing locally)
  try {
    const local = localStorage.getItem('resurgence_custom_map') || localStorage.getItem('arena_map_data');
    if (local) return JSON.parse(local);
  } catch (e) {}

  // 2. Fetch the map.json hosted on GitHub Pages
  try {
    const response = await fetch('./map.json?v=' + Date.now());
    if (response.ok) {
      const data = await response.json();
      return data;
    }
  } catch (err) {
    console.error("Failed to load map.json from server, using fallback:", err);
  }

  // 3. Emergency fallback if offline
  return {
    cols: 60,
    rows: 40,
    levels: {
      floor1: { floors: {}, solids: {}, walls: [], windows: [], doors: [], stairs: [], chests: [], kiosks: [], spawns: [] },
      floor2: { floors: {}, solids: {}, walls: [], windows: [], doors: [], stairs: [], chests: [], kiosks: [], spawns: [] },
      roof:   { floors: {}, solids: {}, walls: [], windows: [], doors: [], stairs: [], chests: [], kiosks: [], spawns: [] }
    },
    buildingZones: {}
  };
};

window.Game.MapRenderer = {
  initDoors(mapData) {
    if (!mapData || !mapData.levels) return;
    ['floor1', 'floor2', 'roof'].forEach(flr => {
      const level = mapData.levels[flr];
      if (level && level.doors) {
        level.doors.forEach((d, idx) => {
          d.id = `${flr}_door_${idx}`;
          d.hingeX = d.x;
          d.hingeY = d.y;
          d.currentRotation = d.rotation || 0;
          d.targetRotation = d.rotation || 0;
          d.isOpen = !!d.isOpen;
        });
      }
    });
  },

  updateDoors(dt, mapData) {
    if (!mapData || !mapData.levels) return;
    ['floor1', 'floor2', 'roof'].forEach(flr => {
      const level = mapData.levels[flr];
      if (level && level.doors) {
        level.doors.forEach(d => {
          d.targetRotation = d.isOpen ? (d.rotation + 90) : d.rotation;

          let diff = d.targetRotation - d.currentRotation;
          while (diff < -180) diff += 360;
          while (diff > 180) diff -= 360;

          if (Math.abs(diff) > 0.5) {
            d.currentRotation += diff * Math.min(14 * dt, 1);
          } else {
            d.currentRotation = d.targetRotation;
          }
        });
      }
    });
  },

  drawLevel(ctx, mapData, currentFloor) {
    const cfg = window.Game.CONFIG;
    const maxCols = (mapData && mapData.cols) || cfg.MAP_COLS;
    const maxRows = (mapData && mapData.rows) || cfg.MAP_ROWS;
    const mapWidth = maxCols * cfg.TILE_SIZE;
    const mapHeight = maxRows * cfg.TILE_SIZE;

    ctx.fillStyle = '#0f121a';
    ctx.fillRect(0, 0, mapWidth, mapHeight);

    if (!mapData || !mapData.levels) return;
    const level = mapData.levels[currentFloor];
    if (!level) return;

    if (level.floors) {
      for (const [key, color] of Object.entries(level.floors)) {
        const [c, r] = key.split(',').map(Number);
        if (c < maxCols && r < maxRows) {
          ctx.fillStyle = color;
          ctx.fillRect(c * cfg.TILE_SIZE, r * cfg.TILE_SIZE, cfg.TILE_SIZE, cfg.TILE_SIZE);
        }
      }
    }

    if (level.solids) {
      for (const [key, color] of Object.entries(level.solids)) {
        const [c, r] = key.split(',').map(Number);
        if (c < maxCols && r < maxRows) {
          ctx.fillStyle = color;
          ctx.fillRect(c * cfg.TILE_SIZE, r * cfg.TILE_SIZE, cfg.TILE_SIZE, cfg.TILE_SIZE);
        }
      }
    }

    if (level.stairs) {
      for (const st of level.stairs) {
        ctx.save();
        const sx = st.col * cfg.TILE_SIZE + cfg.TILE_SIZE / 2;
        const sy = st.row * cfg.TILE_SIZE + cfg.TILE_SIZE / 2;
        ctx.translate(sx, sy);
        ctx.rotate((st.rotation * Math.PI) / 180);

        const isDown = st.direction === 'down';
        ctx.fillStyle = isDown ? '#2a1e16' : '#182433';
        const w = cfg.TILE_SIZE - 4;
        const h = st.length * cfg.TILE_SIZE - 4;
        ctx.fillRect(-w / 2, -h / 2, w, h);

        ctx.strokeStyle = isDown ? '#7d4a22' : '#3d5675';
        ctx.lineWidth = 2;
        const steps = st.length * 4;
        for (let i = 0; i <= steps; i++) {
          const stepY = -h / 2 + (i * h) / steps;
          ctx.beginPath();
          ctx.moveTo(-w / 2, stepY);
          ctx.lineTo(w / 2, stepY);
          ctx.stroke();
        }

        ctx.fillStyle = isDown ? '#e3b341' : '#58a6ff';
        ctx.beginPath();
        if (isDown) {
          ctx.moveTo(0, h / 2 - 6); ctx.lineTo(-6, h / 2 - 16); ctx.lineTo(6, h / 2 - 16);
        } else {
          ctx.moveTo(0, -h / 2 + 6); ctx.lineTo(-6, -h / 2 + 16); ctx.lineTo(6, -h / 2 + 16);
        }
        ctx.fill();
        ctx.restore();
      }
    }

    if (level.walls) {
      for (const w of level.walls) {
        ctx.strokeStyle = w.color;
        ctx.lineWidth = w.thickness;
        ctx.beginPath();
        ctx.moveTo(w.x1, w.y1);
        ctx.lineTo(w.x2, w.y2);
        ctx.stroke();
      }
    }

    if (level.windows) {
      for (const win of level.windows) {
        ctx.strokeStyle = '#38bdf8';
        ctx.lineWidth = win.thickness;
        ctx.beginPath();
        ctx.moveTo(win.x1, win.y1);
        ctx.lineTo(win.x2, win.y2);
        ctx.stroke();
      }
    }

    if (level.doors) {
      for (const d of level.doors) {
        ctx.save();
        ctx.translate(d.hingeX, d.hingeY);
        ctx.rotate((d.currentRotation * Math.PI) / 180);

        ctx.strokeStyle = '#d29922';
        ctx.lineWidth = 5;
        ctx.lineCap = 'round';
        ctx.beginPath();
        ctx.moveTo(0, 0);
        ctx.lineTo(d.width, 0);
        ctx.stroke();

        ctx.fillStyle = '#ffffff';
        ctx.beginPath();
        ctx.arc(0, 0, 3.5, 0, Math.PI * 2);
        ctx.fill();
        ctx.restore();
      }
    }

    ctx.strokeStyle = '#38bdf8';
    ctx.lineWidth = 2;
    ctx.strokeRect(0, 0, mapWidth, mapHeight);
  }
};
