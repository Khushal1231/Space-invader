/*
 * Name: [Khushal]
 * Date: [2024-06-10]
 * Title: Galactic Boss Fight
 * Description: Defend Earth by piloting your starfighter and shooting down waves of 
 * descending alien invaders! Use weapon modes (which consume energy) and destroy the 
 * entire alien fleet before they reach your ship or deplete your health.
 */

// --- CANVAS & HUD SETUP ---
const canvas = document.getElementById('gameCanvas');
const ctx = canvas.getContext('2d');
const playerHpEl = document.getElementById('playerHp');
const bossHpEl = document.getElementById('bossHp');
const gameStateEl = document.getElementById('gameState');

// --- LOAD IMAGES ---
const images = {
  player: new Image(),
  alien1: new Image(),
  alien2: new Image(),
  boss: new Image()
};

images.player.src = './assets/player.jpg';
images.alien1.src = './assets/alien1.png';
images.alien2.src = './assets/alien2.png';
images.boss.src = './assets/boss.png';

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
  y: 50,
  width: 100,
  height: 100,
  hp: 300,
  speed: 2
};

// Bullet properties
const bullets = [];
const bulletSpeed = 7;

// Game state
let gameState = 'playing'; // 'playing', 'won', 'lost'

// --- KEYBOARD INPUT ---
const keys = {};
document.addEventListener('keydown', (e) => {
  keys[e.key] = true;
});
document.addEventListener('keyup', (e) => {
  keys[e.key] = false;
});

// --- GAME LOOP ---
function gameLoop() {
  if (gameState === 'playing') {
    update();
    draw();
    requestAnimationFrame(gameLoop);
  } else {
    updateHUD();
    drawGameOver();
  }
}

// --- UPDATE GAME STATE ---
function update() {
  updatePlayer();
  updateBullets();
  updateAliens();
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

// --- UPDATE BULLETS ---
function updateBullets() {
  for (let i = bullets.length - 1; i >= 0; i--) {
    bullets[i].y -= bulletSpeed;
    if (bullets[i].y < 0) {
      bullets.splice(i, 1);
    }
  }
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

  // Draw bullets
  bullets.forEach((bullet) => {
    ctx.fillStyle = 'yellow';
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
  for (let bIndex = bullets.length - 1; bIndex >= 0; bIndex--) {
    const bullet = bullets[bIndex];
    let bulletHit = false;

    // Check collision with aliens
    for (let aIndex = aliens.length - 1; aIndex >= 0; aIndex--) {
      const alien = aliens[aIndex];
      if (
        bullet.x < alien.x + alien.width &&
        bullet.x + bullet.width > alien.x &&
        bullet.y < alien.y + alien.height &&
        bullet.y + bullet.height > alien.y
      ) {
        aliens.splice(aIndex, 1);
        bullets.splice(bIndex, 1);
        bulletHit = true;
        break;
      }
    }

    // Check collision with boss (only if bullet didn't already hit an alien)
    if (!bulletHit && boss.hp > 0) {
      if (
        bullet.x < boss.x + boss.width &&
        bullet.x + bullet.width > boss.x &&
        bullet.y < boss.y + boss.height &&
        bullet.y + bullet.height > boss.y
      ) {
        boss.hp -= 10;
        bullets.splice(bIndex, 1);
      }
    }
  }
}

// --- CHECK WIN CONDITION ---
function checkWinCondition() {
  if (aliens.length === 0 && boss.hp <= 0) {
    gameState = 'won';
  }
}

// --- UPDATE HUD ---
function updateHUD() {
  playerHpEl.textContent = `Player HP: ${player.hp}`;
  bossHpEl.textContent = `Boss HP: ${Math.max(0, boss.hp)}`;
  gameStateEl.textContent = `Game State: ${gameState}`;
}

// --- DRAW GAME OVER ---
function drawGameOver() {
  ctx.clearRect(0, 0, canvas.width, canvas.height);
  ctx.fillStyle = 'black';
  ctx.fillRect(0, 0, canvas.width, canvas.height);
  ctx.fillStyle = 'white';
  ctx.font = '30px Arial';
  ctx.textAlign = 'center';
  if (gameState === 'won') {
    ctx.fillText('You Won!', canvas.width / 2, canvas.height / 2);
  } else if (gameState === 'lost') {
    ctx.fillText('Game Over!', canvas.width / 2, canvas.height / 2);
  }
}

// --- INITIALIZE ALIENS ---
function initializeAliens() {
  for (let row = 0; row < alienRows; row++) {
    for (let col = 0; col < alienCols; col++) {
      aliens.push({
        x: col * (alienWidth + 10) + 50,
        y: row * (alienHeight + 10) + 50,
        width: alienWidth,
        height: alienHeight,
        speed: 0.3,
        image: row % 2 === 0 ? images.alien1 : images.alien2
      });
    }
  }
}

// --- START GAME ---
initializeAliens();
gameLoop();
