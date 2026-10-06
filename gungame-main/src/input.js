window.Game = window.Game || {};

window.Game.InputController = class InputController {
  constructor(canvas, camera, player, handlers = {}) {
    this.canvas = canvas;
    this.camera = camera;
    this.player = player;
    this.handlers = handlers;

    this.keys = {};
    this.mouseScreen = { x: 0, y: 0 };
    this.mouseWorld = { x: 0, y: 0 };
    this.hoveredItem = null;

    this.bindEvents();
  }

  bindEvents() {
    window.addEventListener('resize', () => {
      this.canvas.width = window.innerWidth;
      this.canvas.height = window.innerHeight;
      this.camera.resize(this.canvas.width, this.canvas.height);
    });

    window.addEventListener('contextmenu', e => e.preventDefault());

    window.addEventListener('keydown', e => {
      // Diagnostic log: proves keydown is firing at all
      console.log('[Input] Key down:', e.key, '| code:', e.code);

      if (e.key === 'Escape' || e.code === 'Escape') {
        if (window.Game.UI && window.Game.UI.isShopOpen) {
          window.Game.UI.closeShop();
          return;
        }
      }

      // If shop is open, ignore game controls
      if (window.Game.UI && window.Game.UI.isShopOpen) {
        console.log('[Input] Ignored because shop is open');
        return;
      }

      this.keys[e.code] = true;
      this.keys[e.key] = true;

      // Slot hotkeys 1-5
      if (e.code.startsWith('Digit')) {
        const slot = parseInt(e.code.replace('Digit', ''));
        if (slot >= 1 && slot <= 5) this.player.inventory.switchSlot(slot - 1);
      }

      // Reload [R]
      if (e.code === 'KeyR' || e.key === 'r' || e.key === 'R') {
        if (this.player.inventory) this.player.inventory.startReload();
      }

      // Pickup [F]
      if (e.code === 'KeyF' || e.key === 'f' || e.key === 'F') {
        console.log('[Input] Triggered Pickup [F]');
        if (this.handlers.onPickup) this.handlers.onPickup(this.hoveredItem);
      }

      // Interact [E] - checks both code and key
      if (e.code === 'KeyE' || e.key === 'e' || e.key === 'E') {
        console.log('[Input] Triggered Interact [E]');
        if (this.handlers.onInteract) {
          this.handlers.onInteract();
        } else {
          console.warn('[Input] No onInteract handler bound!');
        }
      }
    });

    window.addEventListener('keyup', e => {
      this.keys[e.code] = false;
      this.keys[e.key] = false;
    });

    window.addEventListener('wheel', e => {
      if (this.player.isDead || (window.Game.UI && window.Game.UI.isShopOpen)) return;
      let idx = this.player.inventory.activeSlotIndex;
      idx = e.deltaY > 0 ? (idx + 1) % 5 : (idx + 4) % 5;
      this.player.inventory.switchSlot(idx);
    });

    window.addEventListener('mousemove', e => {
      this.mouseScreen.x = e.clientX;
      this.mouseScreen.y = e.clientY;
      const tooltip = window.Game.UI?.elements?.cursorTooltip || document.getElementById('cursor-tooltip');
      if (tooltip) {
        tooltip.style.left = `${e.clientX}px`;
        tooltip.style.top = `${e.clientY}px`;
      }
    });

    window.addEventListener('mousedown', e => {
      if (this.player.isDead || (window.Game.UI && window.Game.UI.isShopOpen)) return;
      if (e.button === 0) this.keys['mouseLeft'] = true;
      if (e.button === 2) this.keys['mouseRight'] = true;
    });

    const releaseClicks = () => {
      this.keys['mouseLeft'] = false;
      this.keys['mouseRight'] = false;
    };
    window.addEventListener('mouseup', releaseClicks);
    window.addEventListener('blur', releaseClicks);
  }

  update(groundItems) {
    this.mouseWorld = this.camera.screenToWorld(this.mouseScreen.x, this.mouseScreen.y);
    this.hoveredItem = null;

    if (!this.player.isDead && (!window.Game.UI || !window.Game.UI.isShopOpen)) {
      for (const item of groundItems) {
        if (item.floor === this.player.currentFloor) {
          if (item.item.type === 'cash' || item.item.type === 'ammo' || item.item.type === 'token') continue;
          const distMouse = Math.hypot(item.x - this.mouseWorld.x, item.y - this.mouseWorld.y);
          const distPlayer = Math.hypot(item.x - this.player.x, item.y - this.player.y);
          if (distMouse < 24 && distPlayer < 90) {
            this.hoveredItem = item;
            break;
          }
        }
      }
    }

    const tooltip = window.Game.UI?.elements?.cursorTooltip || document.getElementById('cursor-tooltip');
    if (this.hoveredItem) {
      const action = this.player.inventory.isFull() ? 'Swap for' : 'Pick up';
      if (tooltip) {
        tooltip.textContent = `[F] ${action} ${this.hoveredItem.item.name}`;
        tooltip.style.display = 'block';
      }
    } else if (tooltip) {
      tooltip.style.display = 'none';
    }
  }
};