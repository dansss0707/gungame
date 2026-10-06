window.Game = window.Game || {};

window.Game.Physics = {
  // Checks if a line segment (x1, y1) -> (x2, y2) crosses another segment (x3, y3) -> (x4, y4)
  lineIntersects(x1, y1, x2, y2, x3, y3, x4, y4) {
    const denom = (y4 - y3) * (x2 - x1) - (x4 - x3) * (y2 - y1);
    if (Math.abs(denom) < 1e-8) return null;

    const ua = ((x4 - x3) * (y1 - y3) - (y4 - y3) * (x1 - x3)) / denom;
    const ub = ((x2 - x1) * (y1 - y3) - (y2 - y1) * (x1 - x3)) / denom;

    if (ua >= 0 && ua <= 1 && ub >= 0 && ub <= 1) {
      return {
        x: x1 + ua * (x2 - x1),
        y: y1 + ua * (y2 - y1),
        distFraction: ua
      };
    }
    return null;
  },

  // Swept hit test for bullet movement from (fromX, fromY) to (toX, toY)
  checkBulletTrajectory(fromX, fromY, toX, toY, floor, mapData) {
    const level = mapData.levels[floor];
    if (!level) return { hit: false };

    const cfg = window.Game.CONFIG;

    // 1. Thin walls
    for (const w of level.walls) {
      const hit = this.lineIntersects(fromX, fromY, toX, toY, w.x1, w.y1, w.x2, w.y2);
      if (hit) return { hit: true, at: hit };
    }

    // 2. Animated/closed doors
    for (const d of level.doors) {
      const currentAngle = (d.currentRotation !== undefined ? d.currentRotation : (d.rotation || 0)) * Math.PI / 180;
      const x2 = d.hingeX + Math.cos(currentAngle) * d.width;
      const y2 = d.hingeY + Math.sin(currentAngle) * d.width;
      const hit = this.lineIntersects(fromX, fromY, toX, toY, d.hingeX, d.hingeY, x2, y2);
      if (hit) return { hit: true, at: hit };
    }

    // 3. Solid grid blocks (check grid cells along line)
    const toCol = Math.floor(toX / cfg.TILE_SIZE);
    const toRow = Math.floor(toY / cfg.TILE_SIZE);
    if (level.solids[`${toCol},${toRow}`]) {
      return { hit: true, at: { x: toX, y: toY } };
    }

    // Note: Windows are intentionally ignored so bullets fly through glass
    return { hit: false };
  },

  // Calculate safe bullet spawn position: ensures barrel hasn't clipped past a wall
  getSafeMuzzlePosition(px, py, angle, barrelLength, floor, mapData) {
    const targetX = px + Math.cos(angle) * barrelLength;
    const targetY = py + Math.sin(angle) * barrelLength;

    // Check if the gun barrel itself intersects a wall
    const result = this.checkBulletTrajectory(px, py, targetX, targetY, floor, mapData);
    if (result.hit) {
      // Wall is blocking the barrel! Return null so gun cannot fire through the wall
      return null;
    }
    return { x: targetX, y: targetY };
  }
};