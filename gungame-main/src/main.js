import { GameMap } from './map.js';
import { Camera } from './camera.js';
import { Player } from './player.js';

const canvas = document.getElementById('gameCanvas');
const ctx = canvas.getContext('2d');
const hpVal = document.getElementById('hp-val');
const ammoVal = document.getElementById('ammo-val');

// Game state
const map = new GameMap();
const camera = new Camera(window.innerWidth, window.innerHeight);
const player = new Player(150, 150);
const bullets = [];

// Input state
const keys = {};
const mouseScreen = { x: 0, y: 0 };

function resize() {
  canvas.width = window.innerWidth;
  canvas.height = window.innerHeight;
  camera.resize(canvas.width, canvas.height);
}
window.addEventListener('resize', resize);
resize();

// Listeners
window.addEventListener('keydown', (e) => (keys[e.key] = true));
window.addEventListener('keyup', (e) => (keys[e.key] = false));

window.addEventListener('mousemove', (e) => {
  mouseScreen.x = e.clientX;
  mouseScreen.y = e.clientY;
});

window.addEventListener('mousedown', (e) => {
  if (e.button === 0) keys['mouseLeft'] = true;
});

window.addEventListener('mouseup', (e) => {
  if (e.button === 0) keys['mouseLeft'] = false;
});

// Game loop
let lastTime = performance.now();

function gameLoop(now) {
  const dt = Math.min((now - lastTime) / 1000, 0.1);
  lastTime = now;

  // 1. Update
  const mouseWorld = camera.screenToWorld(mouseScreen.x, mouseScreen.y);
  player.update(dt, keys, mouseWorld, map, (b) => bullets.push(b));

  for (let i = bullets.length - 1; i >= 0; i--) {
    const b = bullets[i];
    b.update(dt, map);
    if (b.isDead) bullets.splice(i, 1);
  }

  camera.follow(player.x, player.y, map.width, map.height);

  // 2. HUD
  hpVal.textContent = player.hp;
  ammoVal.textContent = player.ammo;

  // 3. Render
  ctx.clearRect(0, 0, canvas.width, canvas.height);

  camera.apply(ctx);
  map.draw(ctx);
  for (const b of bullets) b.draw(ctx);
  player.draw(ctx);
  camera.restore(ctx);

  requestAnimationFrame(gameLoop);
}

requestAnimationFrame(gameLoop);