import * as THREE from 'three';

const LANES = [-3, 0, 3];
const COLLISION_Z = 1.2;
const SPAWN_Z = -220;
const DESPAWN_Z = 6;
const BASE_SPEED = 26;
const SPEED_PER_SECOND = 0.9;
const MAX_SPEED = 70;
const BASE_SPAWN_INTERVAL = 1.15;
const MIN_SPAWN_INTERVAL = 0.45;

const container = document.getElementById('game-container');
const scoreEl = document.getElementById('score');
const startScreen = document.getElementById('start-screen');
const gameOverScreen = document.getElementById('gameover-screen');
const finalScoreEl = document.getElementById('final-score');
const btnLeft = document.getElementById('btn-left');
const btnRight = document.getElementById('btn-right');
const btnStart = document.getElementById('btn-start');
const btnRestart = document.getElementById('btn-restart');

let state = 'ready'; // 'ready' | 'playing' | 'gameover'
let laneIndex = 1;
let targetX = LANES[laneIndex];
let elapsed = 0;
let spawnTimer = 0;
let lastLane = -1;
let obstacles = [];

const scene = new THREE.Scene();
scene.background = new THREE.Color(0x0b0f19);
scene.fog = new THREE.Fog(0x0b0f19, 40, 200);

const camera = new THREE.PerspectiveCamera(70, container.clientWidth / container.clientHeight, 0.1, 500);
camera.position.set(0, 4.2, 8);
camera.lookAt(0, 0.6, -10);

const renderer = new THREE.WebGLRenderer({ antialias: true });
renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
renderer.setSize(container.clientWidth, container.clientHeight);
container.appendChild(renderer.domElement);

scene.add(new THREE.AmbientLight(0x8899cc, 0.6));
const sun = new THREE.DirectionalLight(0xffffff, 1.1);
sun.position.set(5, 12, 6);
scene.add(sun);

// Chão
const floor = new THREE.Mesh(
  new THREE.PlaneGeometry(12, 620),
  new THREE.MeshStandardMaterial({ color: 0x161b28, roughness: 0.9 })
);
floor.rotation.x = -Math.PI / 2;
floor.position.set(0, 0, -290);
scene.add(floor);

// Divisórias de faixa
const laneLineMat = new THREE.LineBasicMaterial({ color: 0x3a4a7a, transparent: true, opacity: 0.6 });
[-1.5, 1.5].forEach((x) => {
  const points = [new THREE.Vector3(x, 0.02, 20), new THREE.Vector3(x, 0.02, -580)];
  const geo = new THREE.BufferGeometry().setFromPoints(points);
  scene.add(new THREE.Line(geo, laneLineMat));
});

// Jogador
const player = new THREE.Mesh(
  new THREE.BoxGeometry(1.2, 1.2, 1.2),
  new THREE.MeshStandardMaterial({ color: 0x0d6efd, emissive: 0x08306b, emissiveIntensity: 0.4 })
);
player.position.set(0, 0.6, 0);
scene.add(player);

const obstacleGeo = new THREE.BoxGeometry(1.8, 1.6, 1.8);
const obstacleMat = new THREE.MeshStandardMaterial({ color: 0xdc3545, roughness: 0.5 });

function spawnObstacle() {
  let lane = Math.floor(Math.random() * LANES.length);
  if (lane === lastLane) {
    lane = (lane + 1 + Math.floor(Math.random() * (LANES.length - 1))) % LANES.length;
  }
  lastLane = lane;

  const mesh = new THREE.Mesh(obstacleGeo, obstacleMat);
  mesh.position.set(LANES[lane], 0.8, SPAWN_Z);
  scene.add(mesh);
  obstacles.push({ mesh, lane });
}

function currentSpeed() {
  return Math.min(BASE_SPEED + elapsed * SPEED_PER_SECOND, MAX_SPEED);
}

function currentSpawnInterval() {
  return Math.max(BASE_SPAWN_INTERVAL - elapsed * 0.02, MIN_SPAWN_INTERVAL);
}

function moveLane(delta) {
  if (state !== 'playing') return;
  laneIndex = Math.min(LANES.length - 1, Math.max(0, laneIndex + delta));
  targetX = LANES[laneIndex];
}

function resetGame() {
  obstacles.forEach((o) => scene.remove(o.mesh));
  obstacles = [];
  laneIndex = 1;
  targetX = LANES[laneIndex];
  player.position.x = targetX;
  elapsed = 0;
  spawnTimer = 0;
  lastLane = -1;
  scoreEl.textContent = '0';
}

function startGame() {
  resetGame();
  state = 'playing';
  startScreen.classList.add('d-none');
  gameOverScreen.classList.add('d-none');
}

function endGame() {
  if (state !== 'playing') return;
  state = 'gameover';
  finalScoreEl.textContent = scoreEl.textContent;
  gameOverScreen.classList.remove('d-none');
}

window.addEventListener('keydown', (e) => {
  if (e.code === 'ArrowLeft' || e.code === 'KeyA') moveLane(-1);
  if (e.code === 'ArrowRight' || e.code === 'KeyD') moveLane(1);
  if (e.code === 'Space' || e.code === 'Enter') {
    if (state === 'ready' || state === 'gameover') startGame();
  }
});
btnLeft.addEventListener('click', () => moveLane(-1));
btnRight.addEventListener('click', () => moveLane(1));
btnStart.addEventListener('click', startGame);
btnRestart.addEventListener('click', startGame);

window.addEventListener('resize', () => {
  camera.aspect = container.clientWidth / container.clientHeight;
  camera.updateProjectionMatrix();
  renderer.setSize(container.clientWidth, container.clientHeight);
});

const clock = new THREE.Clock();

function animate() {
  requestAnimationFrame(animate);
  const delta = Math.min(clock.getDelta(), 0.1);

  player.position.x += (targetX - player.position.x) * Math.min(delta * 10, 1);
  player.rotation.y += delta * 0.6;

  if (state === 'playing') {
    elapsed += delta;
    spawnTimer += delta;
    if (spawnTimer >= currentSpawnInterval()) {
      spawnTimer = 0;
      spawnObstacle();
    }

    const speed = currentSpeed();
    for (let i = obstacles.length - 1; i >= 0; i--) {
      const o = obstacles[i];
      o.mesh.position.z += speed * delta;

      if (o.lane === laneIndex && Math.abs(o.mesh.position.z - player.position.z) < COLLISION_Z) {
        endGame();
      }

      if (o.mesh.position.z > DESPAWN_Z) {
        scene.remove(o.mesh);
        obstacles.splice(i, 1);
      }
    }

    scoreEl.textContent = Math.floor(elapsed * 10).toString();
  }

  renderer.render(scene, camera);
}

animate();
