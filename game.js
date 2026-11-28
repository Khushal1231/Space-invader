/*
- Name: Khushal
- Date: 2024-06-10
- Title: Galactic Boss Fight
- Description: Defend Earth by piloting your starfighter and shooting down waves of 
- descending alien invaders! Use weapon modes (which consume energy) and destroy the 
- entire alien fleet before they reach your ship or deplete your health.
 */

// --- CANVAS & HUD SETUP ---
const canvas = document.getElementById('gameCanvas');
const ctx = canvas.getContext('2d');
const playerHpEl = document.getElementById('playerHp');
const bossHpEl = document.getElementById('bossHp');
const gameStateEl = document.getElementById('gameState');

// --- LOAD IMAGES SAFELY FOR GITHUB PAGES ---
const imageSources = {
  player: 'assets/player.jpg',
  alien1: 'assets/alien1.png',
  alien2: 'assets/alien2.png',
  boss: 'assets/boss.png'
};

const images = {};
let imagesLoaded = 0;
const totalImages = Object.keys(imageSources).length;

function loadImages(callback) {
  for (let key in imageSources) {
    images[key] = new Image();
    images[key].src = imageSources[key];
    
    images[key].onload = () => {
      imagesLoaded++;
      if (imagesLoaded === totalImages) {
        callback();
      }
    };

    images[key].onerror = () => {
      console.error(`Missing image: ${imageSources[key]} - using fallback shape`);
      images[key].loaded = false;
      imagesLoaded++;
      if (imagesLoaded === totalImages) {
        callback();
      }
    };
  }
}

// --- DIFFICULTY SETTINGS ---
const difficultySettings = {
  easy: { label: 'Easy', bossBaseSpeed: 1.5, alienSpeed: 0.2, bossShootInterval: 110 },
  normal: { label: 'Normal', bossBaseSpeed: 2.5, alienSpeed: 0.35, bossShootInterval: 90 },
  hard: { label: 'Hard', bossBaseSpeed: 3.8, alienSpeed: 0.55, bossShootInterval: 65 }
};

let currentDifficulty = 'normal';

// Player properties
const player = {
  x: canvas.width / 2 - 25,
  y: canvas.height - 60,
  width: 50,
  height: 50,
  speed: 5,
  hp: 100,
  energy: 100,
  shootCooldown: 0
};

// Alien properties
const aliens = [];
const alienRows = 3;
const alienCols = 8;
const alienWidth = 40;
const alienHeight = 40;

// Boss properties
const boss = {
  x: canvas.width / 2 - 50,
  y: 20,
  width: 100,
  height: 100,
  hp: 300,
  maxHp: 300,
  baseSpeed: 2.5,
  speed: 2.5,
  direction: 1,
  shootTimer: 0
};

// Bullet properties
const bullets = [];
const enemyBullets = [];
const bulletSpeed = 7;

// Game state: 'menu', 'playing', 'won', 'lost'
let gameState = 'menu';

// --- UI BUTTON REGIONS FOR MOUSE CLICKS ---
const menuButtons = [
  { id: 'easy', label: 'Easy Mode (1)', x: canvas.width / 2 - 110, y: 190, width: 220, height: 42, color: '#2ecc71' },
  { id: 'normal', label: 'Normal Mode (2)', x: canvas.width / 2 - 110, y: 248, width: 220, height: 42, color: '#f1c40f' },
  { id: 'hard', label: 'Hard Mode (3)', x: canvas.width / 2 - 110, y: 306, width: 220, height: 42, color: '#e74c3c' }
];

const endButtons = [
  { id: 'restart', label: 'Play Again (R)', x: canvas.width / 2 - 110, y: canvas.height / 2 + 30, width: 220, height: 42, color: '#3498db' },
  { id: 'menu', label: 'Change Difficulty (M)', x: canvas.width / 2 - 110, y: canvas.height / 2 + 85, width: 220, height: 42, color: '#9b59b6' }
];

// --- START OR RESTART GAME WITH SELECTED DIFFICULTY ---
function startGame(difficultyKey) {
  currentDifficulty = difficultyKey;
  const settings = difficultySettings[currentDifficulty];

  // Reset player
  player.x = canvas.width / 2 - 25;
  player.y = canvas.height - 60;
  player.hp = 100;
  player.energy = 100;
  player.shootCooldown = 0;

  // Reset boss with difficulty speed
  boss.x = canvas.width / 2 - 50;
  boss.y = 20;
  boss.hp = boss.maxHp;
  boss.baseSpeed = settings.bossBaseSpeed;
  boss.speed = settings.bossBaseSpeed;
  boss.direction = 1;
  boss.shootTimer = 0;

  // Clear bullets & rebuild aliens
  bullets.length = 0;
  enemyBullets.length = 0;
  initializeAliens(settings.alienSpeed);

  gameState = 'playing';
  updateHUD();
  requestAnimationFrame(gameLoop);
}

// --- KEYBOARD & MOUSE INPUT ---
const keys = {};
document.addEventListener('keydown', (e) => {
  if ([' ', 'ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight'].includes(e.key)) {
    e.preventDefault();
  }
  keys[e.key] = true;

  // Difficulty selection via keyboard on menu
  if (gameState === 'menu') {
    if (e.key === '1') startGame('easy');
    if (e.key === '2') startGame('normal');
    if (e.key === '3') startGame('hard');
  }

  // Restart or return to menu on win/loss
  if (gameState === 'won' || gameState === 'lost') {
    if (e.key === 'r' || e.key === 'R') {
      startGame(currentDifficulty);
    } else if (e.key === 'm' || e.key === 'M') {
      gameState = 'menu';
      updateHUD();
      drawMenu();
    }
  }
});

document.addEventListener('keyup', (e) => {
  keys[e.key] = false;
});

canvas.addEventListener('click', (e) => {
  const rect = canvas.getBoundingClientRect();
  const clickX = e.clientX - rect.left;
  const clickY = e.clientY - rect.top;

  if (gameState === 'menu') {
    menuButtons.forEach((btn) => {
      if (isPointInRect(clickX, clickY, btn)) {
        startGame(btn.id);
      }
    });
  } else if (gameState === 'won' || gameState === 'lost') {
    endButtons.forEach((btn) => {
      if (isPointInRect(clickX, clickY, btn)) {
        if (btn.id === 'restart') {
          startGame(currentDifficulty);
        } else if (btn.id === 'menu') {
          gameState = 'menu';
          updateHUD();
          drawMenu();
        }
      }
    });
  }
});

function isPointInRect(x, y, rect) {
  return x >= rect.x && x <= rect.x + rect.width && y >= rect.y && y <= rect.y + rect.height;
}

// --- GAME LOOP ---
function gameLoop() {
  if (gameState === 'playing') {
    update();
    draw();
    requestAnimationFrame(gameLoop);
  } else if (gameState === 'won' || gameState === 'lost') {
    updateHUD();
    drawGameOver();
  }
}

// --- UPDATE GAME STATE ---
function update() {
  updatePlayer();
  updateBullets();
  updateAliens();
  updateBoss();
  checkCollisions();
  checkWinCondition();
  updateHUD();
}

// --- UPDATE PLAYER ---
function updatePlayer() {
  if (keys['ArrowLeft'] && player.x > 0) {
    player.x -= player.speed;
  }
  if (keys['ArrowRight'] && player.x < canvas.width - player.width) {
    player.x += player.speed;
  }

  // Cooldown & energy regeneration
  if (player.shootCooldown > 0) {
    player.shootCooldown--;
  }
  if (player.energy < 100) {
    player.energy = Math.min(100, player.energy + 0.15);
  }

  // Shoot bullets
  if (keys[' '] && player.energy >= 5 && player.shootCooldown === 0) {
    shootBullet();
    player.energy -= 5;
    player.shootCooldown = 10;
  }
}

// --- UPDATE BOSS ---
function updateBoss() {
  if (boss.hp <= 0) return;

  // Dynamic speed scaling: increases up to 2.2x baseSpeed as boss HP approaches 0
  const missingHpRatio = 1 - boss.hp / boss.maxHp;
  boss.speed = boss.baseSpeed * (1 + missingHpRatio * 1.2);

  // Move side to side
  boss.x += boss.speed * boss.direction;
  if (boss.x <= 0) {
    boss.x = 0;
    boss.direction = 1;
  } else if (boss.x + boss.width >= canvas.width) {
    boss.x = canvas.width - boss.width;
    boss.direction = -1;
  }

  // Boss fires back periodically based on difficulty
  const shootInterval = difficultySettings[currentDifficulty].bossShootInterval;
  boss.shootTimer++;
  if (boss.shootTimer >= shootInterval) {
    enemyBullets.push({
      x: boss.x + boss.width / 2 - 4,
      y: boss.y + boss.height,
      width: 8,
      height: 15,
      speed: 4
    });
    boss.shootTimer = 0;
  }
}

// --- UPDATE BULLETS ---
function updateBullets() {
  // Player bullets
  for (let i = bullets.length - 1; i >= 0; i--) {
    bullets[i].y -= bulletSpeed;
    if (bullets[i].y < 0) {
      bullets.splice(i, 1);
    }
  }

  // Boss bullets
  for (let i = enemyBullets.length - 1; i >= 0; i--) {
    enemyBullets[i].y += enemyBullets[i].speed;
    if (enemyBullets[i].y > canvas.height) {
      enemyBullets.splice(i, 1);
    }
  }
}

// --- DRAW MENU ---
function drawMenu() {
  ctx.clearRect(0, 0, canvas.width, canvas.height);
  ctx.fillStyle = 'black';
  ctx.fillRect(0, 0, canvas.width, canvas.height);

  ctx.fillStyle = 'white';
  ctx.font = 'bold 28px Arial';
  ctx.textAlign = 'center';
  ctx.fillText('GALACTIC BOSS FIGHT', canvas.width / 2, 100);

  ctx.font = '16px Arial';
  ctx.fillStyle = '#cccccc';
  ctx.fillText('Select Difficulty Level to Begin', canvas.width / 2, 145);

  menuButtons.forEach((btn) => {
    ctx.fillStyle = btn.color;
    ctx.fillRect(btn.x, btn.y, btn.width, btn.height);

    ctx.fillStyle = btn.id === 'hard' ? 'white' : 'black';
    ctx.font = 'bold 15px Arial';
    ctx.fillText(btn.label, btn.x + btn.width / 2, btn.y + 26);
  });

  ctx.fillStyle = '#aaaaaa';
  ctx.font = '13px Arial';
  ctx.fillText('Arrow Keys: Move | Spacebar: Shoot', canvas.width / 2, 395);
}

// --- DRAW GAME ---
function draw() {
  ctx.clearRect(0, 0, canvas.width, canvas.height);

  // Draw player
  ctx.drawImage(images.player, player.x, player.y, player.width, player.height);

  // Draw aliens
  aliens.forEach((alien) => {
    ctx.drawImage(alien.image, alien.x, alien.y, alien.width, alien.height);
  });

  // Draw boss
  if (boss.hp > 0) {
    ctx.drawImage(images.boss, boss.x, boss.y, boss.width, boss.height);
  }

  // Draw player bullets
  bullets.forEach((bullet) => {
    ctx.fillStyle = 'yellow';
    ctx.fillRect(bullet.x, bullet.y, bullet.width, bullet.height);
  });

  // Draw boss bullets
  enemyBullets.forEach((bullet) => {
    ctx.fillStyle = 'red';
    ctx.fillRect(bullet.x, bullet.y, bullet.width, bullet.height);
  });
}

// --- SHOOT BULLET ---
function shootBullet() {
  bullets.push({
    x: player.x + player.width / 2 - 2.5,
    y: player.y,
    width: 5,
    height: 10
  });
}

// --- UPDATE ALIENS ---
function updateAliens() {
  aliens.forEach((alien) => {
    alien.y += alien.speed;
    if (alien.y + alien.height > canvas.height) {
      gameState = 'lost';
    }
  });
}

// --- CHECK COLLISIONS ---
function checkCollisions() {
  // Player bullets vs Aliens & Boss
  for (let bIndex = bullets.length - 1; bIndex >= 0; bIndex--) {
    const bullet = bullets[bIndex];
    let bulletHit = false;

    for (let aIndex = aliens.length - 1; aIndex >= 0; aIndex--) {
      const alien = aliens[aIndex];
      if (isColliding(bullet, alien)) {
        aliens.splice(aIndex, 1);
        bullets.splice(bIndex, 1);
        bulletHit = true;
        break;
      }
    }

    if (!bulletHit && boss.hp > 0 && isColliding(bullet, boss)) {
      boss.hp -= 10;
      if (boss.hp < 0) boss.hp = 0;
      bullets.splice(bIndex, 1);
    }
  }

  // Boss bullets vs Player
  for (let i = enemyBullets.length - 1; i >= 0; i--) {
    if (isColliding(enemyBullets[i], player)) {
      player.hp -= 20;
      enemyBullets.splice(i, 1);
      if (player.hp <= 0) {
        player.hp = 0;
        gameState = 'lost';
      }
    }
  }

  // Aliens crashing into Player
  for (let i = aliens.length - 1; i >= 0; i--) {
    if (isColliding(aliens[i], player)) {
      player.hp -= 25;
      aliens.splice(i, 1);
      if (player.hp <= 0) {
        player.hp = 0;
        gameState = 'lost';
      }
    }
  }
}

// Helper for bounding-box collision
function isColliding(rect1, rect2) {
  return (
    rect1.x < rect2.x + rect2.width &&
    rect1.x + rect1.width > rect2.x &&
    rect1.y < rect2.y + rect2.height &&
    rect1.y + rect1.height > rect2.y
  );
}

// --- CHECK WIN CONDITION ---
function checkWinCondition() {
  if (aliens.length === 0 && boss.hp <= 0) {
    gameState = 'won';
  }
}

// --- UPDATE HUD ---
function updateHUD() {
  const diffLabel = difficultySettings[currentDifficulty].label;
  if (playerHpEl) playerHpEl.textContent = player.hp;
  if (bossHpEl) bossHpEl.textContent = Math.max(0, boss.hp);
  if (gameStateEl) gameStateEl.textContent = `${gameState.toUpperCase()} (${diffLabel})`;
}

// --- DRAW GAME OVER ---
function drawGameOver() {
  ctx.clearRect(0, 0, canvas.width, canvas.height);
  ctx.fillStyle = 'black';
  ctx.fillRect(0, 0, canvas.width, canvas.height);

  ctx.textAlign = 'center';
  ctx.fillStyle = gameState === 'won' ? '#2ecc71' : '#e74c3c';
  ctx.font = 'bold 30px Arial';
  ctx.fillText(gameState === 'won' ? 'You Won!' : 'Game Over!', canvas.width / 2, canvas.height / 2 - 35);

  ctx.fillStyle = '#cccccc';
  ctx.font = '16px Arial';
  ctx.fillText(`Difficulty: ${difficultySettings[currentDifficulty].label}`, canvas.width / 2, canvas.height / 2);

  endButtons.forEach((btn) => {
    ctx.fillStyle = btn.color;
    ctx.fillRect(btn.x, btn.y, btn.width, btn.height);

    ctx.fillStyle = 'white';
    ctx.font = 'bold 15px Arial';
    ctx.fillText(btn.label, btn.x + btn.width / 2, btn.y + 26);
  });
}

// --- INITIALIZE ALIENS ---
function initializeAliens(alienSpeed) {
  aliens.length = 0;
  for (let row = 0; row < alienRows; row++) {
    for (let col = 0; col < alienCols; col++) {
      aliens.push({
        x: col * (alienWidth + 10) + 50,
        y: row * (alienHeight + 10) + 130,
        width: alienWidth,
        height: alienHeight,
        speed: alienSpeed,
        image: row % 2 === 0 ? images.alien1 : images.alien2
      });
    }
  }
}

// --- SHOW DIFFICULTY MENU AFTER IMAGES LOAD ---
loadImages(() => {
  updateHUD();
  drawMenu();
});