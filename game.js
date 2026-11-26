/*
 * Name: [Khushal]
 * Date: [2024-06-10]
 * Title: Galactic Boss Fight
 * Description: Pilot your starfighter using the Left and Right arrow keys and press Spacebar
 * to fire lasers at the alien Dreadnought Boss. Dodge incoming red energy orbs and defeat
 * both boss attack phases before your ship's health reaches zero!
 */

// ---CANVAS & HUD setup---
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

