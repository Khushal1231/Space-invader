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
      console.error(`Failed to load image: ${imageSources[key]}. Check path and capitalization on GitHub.`);
    };
  }
}

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
  speed: 2,
  direction: 1,
  shootTimer: 0
};

// Bullet properties
const bullets = [];
const enemyBullets = [];
const bulletSpeed = 7;

// Game state
let gameState = 'playing'; // 'playing', 'won', 'lost'

// --- KEYBOARD INPUT ---
const keys = {};
document.addEventListener('keydown', (e) => {
  // Prevent spacebar and arrow keys from scrolling the webpage on GitHub Pages
  if ([' ', 'ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight'].includes(e.key)) {
    e.preventDefault();
  }
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

  // Move side to side
  boss.x += boss.speed * boss.direction;
  if (boss.x <= 0 || boss.x + boss.width >= canvas.width) {
    boss.direction *= -1;
  }

  // Boss fires back periodically
  boss.shootTimer++;
  if (boss.shootTimer >= 90) {
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
  if (playerHpEl) playerHpEl.textContent = `Player HP: ${player.hp}`;
  if (bossHpEl) bossHpEl.textContent = `Boss HP: ${Math.max(0, boss.hp)}`;
  if (gameStateEl) gameStateEl.textContent = `Game State: ${gameState}`;
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
        y: row * (alienHeight + 10) + 130, // Moved down below the boss
        width: alienWidth,
        height: alienHeight,
        speed: 0.3,
        image: row % 2 === 0 ? images.alien1 : images.alien2
      });
    }
  }
}

// --- START GAME AFTER IMAGES LOAD ---
loadImages(() => {
  initializeAliens();
  gameLoop();
});