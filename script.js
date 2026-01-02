const canvas = document.getElementById("game");
const ctx = canvas.getContext("2d");
const scoreEl = document.getElementById("score");
const livesEl = document.getElementById("lives");
const levelEl = document.getElementById("level");
const startOverlay = document.getElementById("startOverlay");
const gameOverOverlay = document.getElementById("gameOverOverlay");
const finalScoreEl = document.getElementById("finalScore");
const startBtn = document.getElementById("startBtn");
const restartBtn = document.getElementById("restartBtn");
const leftBtn = document.getElementById("leftBtn");
const rightBtn = document.getElementById("rightBtn");

const state = {
  running: false,
  score: 0,
  lives: 3,
  level: 1,
  speed: 80,
  apples: [],
  spawnTimer: 0,
  spawnInterval: 1.4,
  moveDir: 0,
  pointerActive: false,
};

const player = {
  x: 220,
  y: 560,
  width: 60,
  height: 44,
  speed: 220,
};

const world = {
  width: canvas.width,
  height: canvas.height,
  ground: 600,
};

const audioCtx = new (window.AudioContext || window.webkitAudioContext)();

function beep(frequency, duration, type = "square") {
  const oscillator = audioCtx.createOscillator();
  const gain = audioCtx.createGain();
  oscillator.type = type;
  oscillator.frequency.value = frequency;
  gain.gain.value = 0.08;
  oscillator.connect(gain);
  gain.connect(audioCtx.destination);
  oscillator.start();
  gain.gain.exponentialRampToValueAtTime(0.0001, audioCtx.currentTime + duration);
  oscillator.stop(audioCtx.currentTime + duration);
}

function resetGame() {
  state.score = 0;
  state.lives = 3;
  state.level = 1;
  state.speed = 80;
  state.apples = [];
  state.spawnTimer = 0;
  state.spawnInterval = 1.4;
  player.x = world.width / 2 - player.width / 2;
  updateHud();
}

function updateHud() {
  scoreEl.textContent = state.score;
  livesEl.textContent = state.lives;
  levelEl.textContent = state.level;
}

function startGame() {
  resetGame();
  state.running = true;
  startOverlay.classList.remove("active");
  gameOverOverlay.classList.remove("active");
  audioCtx.resume();
}

function gameOver() {
  state.running = false;
  finalScoreEl.textContent = state.score;
  gameOverOverlay.classList.add("active");
}

function spawnApple() {
  const size = 18;
  const x = Math.random() * (world.width - size - 30) + 15;
  state.apples.push({
    x,
    y: 120,
    size,
    vy: state.speed + Math.random() * 40,
  });
}

function updateDifficulty(delta) {
  if (!state.running) return;
  const levelUp = Math.floor(state.score / 8) + 1;
  if (levelUp > state.level) {
    state.level = levelUp;
    state.speed += 20;
    state.spawnInterval = Math.max(0.6, state.spawnInterval - 0.08);
  }
  updateHud();
}

function updatePlayer(delta) {
  if (!state.running) return;
  player.x += state.moveDir * player.speed * delta;
  player.x = Math.max(12, Math.min(world.width - player.width - 12, player.x));
}

function updateApples(delta) {
  state.spawnTimer += delta;
  if (state.spawnTimer >= state.spawnInterval) {
    state.spawnTimer = 0;
    spawnApple();
  }

  state.apples.forEach((apple) => {
    apple.y += apple.vy * delta;
  });

  state.apples = state.apples.filter((apple) => {
    const caught = checkCollision(apple, player);
    if (caught) {
      state.score += 1;
      beep(660, 0.12, "triangle");
      updateHud();
      return false;
    }
    const missed = apple.y + apple.size >= world.ground;
    if (missed) {
      state.lives -= 1;
      beep(180, 0.2, "sawtooth");
      updateHud();
      if (state.lives <= 0) {
        gameOver();
      }
      return false;
    }
    return true;
  });
}

function checkCollision(apple, basket) {
  return (
    apple.x < basket.x + basket.width &&
    apple.x + apple.size > basket.x &&
    apple.y < basket.y + basket.height &&
    apple.y + apple.size > basket.y
  );
}

function drawBackground() {
  ctx.fillStyle = "#76c96f";
  ctx.fillRect(0, 0, world.width, world.height);

  ctx.fillStyle = "#4fa34c";
  ctx.fillRect(0, world.ground, world.width, world.height - world.ground);

  drawTree();
}

function drawTree() {
  const trunkX = 50;
  const trunkY = 60;
  ctx.fillStyle = "#6b3e2e";
  ctx.fillRect(trunkX + 40, trunkY + 80, 24, 90);
  ctx.fillStyle = "#2f7b32";
  ctx.fillRect(trunkX, trunkY, 120, 80);
  ctx.fillRect(trunkX - 10, trunkY + 40, 140, 60);

  ctx.fillStyle = "#a5362c";
  drawPixelApple(trunkX + 20, trunkY + 30, 12);
  drawPixelApple(trunkX + 70, trunkY + 15, 12);
}

function drawPixelApple(x, y, size) {
  ctx.fillStyle = "#d23b36";
  ctx.fillRect(x, y, size, size);
  ctx.fillStyle = "#f0655d";
  ctx.fillRect(x + 2, y + 2, size - 4, size - 4);
  ctx.fillStyle = "#5c2c1c";
  ctx.fillRect(x + size / 2 - 1, y - 4, 3, 5);
}

function drawPlayer() {
  const { x, y, width, height } = player;
  ctx.fillStyle = "#c98c3e";
  ctx.fillRect(x + 6, y + 20, width - 12, height - 20);
  ctx.fillStyle = "#8b4d2e";
  ctx.fillRect(x + 10, y + 24, width - 20, height - 28);

  ctx.fillStyle = "#f0b65b";
  ctx.fillRect(x + 18, y - 6, 24, 24);
  ctx.fillRect(x + 14, y + 10, 8, 8);
  ctx.fillRect(x + 38, y + 10, 8, 8);

  ctx.fillStyle = "#f8d39a";
  ctx.fillRect(x + 20, y + 2, 6, 6);
  ctx.fillRect(x + 34, y + 2, 6, 6);

  ctx.fillStyle = "#2a1f1c";
  ctx.fillRect(x + 24, y + 6, 3, 3);
  ctx.fillRect(x + 36, y + 6, 3, 3);
  ctx.fillRect(x + 30, y + 12, 3, 3);

  ctx.fillStyle = "#b57b2e";
  ctx.fillRect(x + 12, y - 6, 8, 8);
  ctx.fillRect(x + 40, y - 6, 8, 8);
}

function drawApples() {
  state.apples.forEach((apple) => {
    drawPixelApple(apple.x, apple.y, apple.size);
  });
}

function drawGroundLine() {
  ctx.fillStyle = "#3b7b38";
  ctx.fillRect(0, world.ground - 4, world.width, 4);
}

let lastTime = 0;
function loop(timestamp) {
  const delta = Math.min(0.033, (timestamp - lastTime) / 1000 || 0);
  lastTime = timestamp;

  if (state.running) {
    updateDifficulty(delta);
    updatePlayer(delta);
    updateApples(delta);
  }

  ctx.clearRect(0, 0, world.width, world.height);
  drawBackground();
  drawGroundLine();
  drawApples();
  drawPlayer();

  requestAnimationFrame(loop);
}

function handleKey(event, isDown) {
  if (event.key === "ArrowLeft" || event.key === "a" || event.key === "A") {
    state.moveDir = isDown ? -1 : state.moveDir === -1 ? 0 : state.moveDir;
  }
  if (event.key === "ArrowRight" || event.key === "d" || event.key === "D") {
    state.moveDir = isDown ? 1 : state.moveDir === 1 ? 0 : state.moveDir;
  }
}

function addPointerControls() {
  const updateFromPointer = (clientX) => {
    const rect = canvas.getBoundingClientRect();
    const pos = ((clientX - rect.left) / rect.width) * world.width;
    player.x = Math.max(12, Math.min(world.width - player.width - 12, pos - player.width / 2));
  };

  canvas.addEventListener("pointerdown", (event) => {
    state.pointerActive = true;
    updateFromPointer(event.clientX);
  });

  canvas.addEventListener("pointermove", (event) => {
    if (!state.pointerActive) return;
    updateFromPointer(event.clientX);
  });

  window.addEventListener("pointerup", () => {
    state.pointerActive = false;
  });
}

startBtn.addEventListener("click", startGame);
restartBtn.addEventListener("click", startGame);

window.addEventListener("keydown", (event) => handleKey(event, true));
window.addEventListener("keyup", (event) => handleKey(event, false));

leftBtn.addEventListener("pointerdown", () => {
  state.moveDir = -1;
});
leftBtn.addEventListener("pointerup", () => {
  state.moveDir = 0;
});
leftBtn.addEventListener("pointerleave", () => {
  state.moveDir = 0;
});

rightBtn.addEventListener("pointerdown", () => {
  state.moveDir = 1;
});
rightBtn.addEventListener("pointerup", () => {
  state.moveDir = 0;
});
rightBtn.addEventListener("pointerleave", () => {
  state.moveDir = 0;
});

addPointerControls();
requestAnimationFrame(loop);
