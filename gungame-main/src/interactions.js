window.Game = window.Game || {};

window.Game.InteractionSystem = class InteractionSystem {
  constructor(player, activeChests, activeKiosks, mapData, groundItems, network) {
    this.player = player;
    this.activeChests = activeChests || [];
    this.activeKiosks = activeKiosks || [];
    this.mapData = mapData || {};
    this.groundItems = groundItems || [];
    this.network = network || {};
  }

  handleInteract() {
    const px = this.player.x;
    const py = this.player.y;
    const pFloor = this.player.currentFloor;

    // 1. KIOSKS (Prioritized if within 85px)
    for (const k of this.activeKiosks) {
      if (k.floor === pFloor && Math.hypot(k.x - px, k.y - py) < 85) {
        if (window.Game.UI && window.Game.UI.isShopOpen) {
          window.Game.UI.closeShop();
        } else if (window.Game.UI) {
          window.Game.UI.openShop(this.player);
        }
        return;
      }
    }

    // 2. SUPPLY CHESTS: Find the SINGLE CLOSEST unopened chest within 120px
    let closestChest = null;
    let minChestDist = 120; // Maximum interaction reach

    for (const ch of this.activeChests) {
      if (ch.floor === pFloor && !ch.isOpen) {
        const dist = Math.hypot(ch.x - px, ch.y - py);
        if (dist < minChestDist) {
          minChestDist = dist;
          closestChest = ch;
        }
      }
    }

    if (closestChest) {
      const isClient = this.network && !this.network.isHost && this.network.hostConn && this.network.hostConn.open;

      if (isClient) {
        this.network.sendAction('request_open_chest', { chestId: closestChest.id });
      } else {
        const drops = closestChest.generateLootDrops ? closestChest.generateLootDrops() : [];
        closestChest.openWithItems(drops, item => this.groundItems.push(item));

        if (this.network && this.network.isHost) {
          this.network.sendAction('chest_opened', { chestId: closestChest.id, drops });
        }
      }
      return;
    }

    // 3. DOORS: Check hinge AND door midpoint (within 85px)
    const level = this.mapData.levels ? this.mapData.levels[pFloor] : null;
    if (level && level.doors) {
      let closestDoor = null;
      let minDoorDist = 85;

      for (const d of level.doors) {
        const hx = d.hingeX !== undefined ? d.hingeX : d.x;
        const hy = d.hingeY !== undefined ? d.hingeY : d.y;
        const hingeDist = Math.hypot(hx - px, hy - py);

        // Approximate center of the door leaf
        const w = d.width || 48;
        const rot = (d.currentRotation !== undefined ? d.currentRotation : (d.rotation || 0)) * (Math.PI / 180);
        const midX = hx + Math.cos(rot) * (w / 2);
        const midY = hy + Math.sin(rot) * (w / 2);
        const midDist = Math.hypot(midX - px, midY - py);

        const effectiveDist = Math.min(hingeDist, midDist);
        if (effectiveDist < minDoorDist) {
          minDoorDist = effectiveDist;
          closestDoor = d;
        }
      }

      if (closestDoor) {
        closestDoor.isOpen = !closestDoor.isOpen;
        if (this.network && this.network.sendAction) {
          this.network.sendAction('door_toggle', { doorId: closestDoor.id, isOpen: closestDoor.isOpen });
        }
        return;
      }
    }
  }

  updateHints() {
    const hintElem = window.Game.UI?.elements?.hintElem || document.getElementById('interact-hint');
    let hintText = null;

    if (!this.player.isDead) {
      const px = this.player.x;
      const py = this.player.y;
      const pFloor = this.player.currentFloor;

      // Kiosk check
      for (const k of this.activeKiosks) {
        if (k.floor === pFloor && Math.hypot(k.x - px, k.y - py) < 85) {
          hintText = "Press [E] to Access Buy Station";
          break;
        }
      }

      // Chest check (find closest)
      if (!hintText) {
        let nearestDist = 120;
        for (const ch of this.activeChests) {
          if (ch.floor === pFloor && !ch.isOpen) {
            const dist = Math.hypot(ch.x - px, ch.y - py);
            if (dist < nearestDist) {
              nearestDist = dist;
              hintText = "Press [E] to Open Supply Crate";
            }
          }
        }
      }

      // Door check
      if (!hintText) {
        const level = this.mapData.levels ? this.mapData.levels[pFloor] : null;
        if (level && level.doors) {
          for (const d of level.doors) {
            const hx = d.hingeX !== undefined ? d.hingeX : d.x;
            const hy = d.hingeY !== undefined ? d.hingeY : d.y;
            const w = d.width || 48;
            const rot = (d.currentRotation !== undefined ? d.currentRotation : (d.rotation || 0)) * (Math.PI / 180);
            const midX = hx + Math.cos(rot) * (w / 2);
            const midY = hy + Math.sin(rot) * (w / 2);

            if (Math.min(Math.hypot(hx - px, hy - py), Math.hypot(midX - px, midY - py)) < 85) {
              hintText = d.isOpen ? "Press [E] to Close Door" : "Press [E] to Open Door";
              break;
            }
          }
        }
      }
    }

    if (hintElem) {
      const shopOpen = window.Game.UI && window.Game.UI.isShopOpen;
      hintElem.style.display = (hintText && !shopOpen) ? 'block' : 'none';
      if (hintText) hintElem.textContent = hintText;
    }
  }
};