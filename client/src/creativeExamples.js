export const CREATIVE_EXAMPLES = [
  {
    name: 'Particle terrain',
    category: 'Three.js · generative 3D',
    description: 'From the archived project: a deforming point landscape with geometry construction, nested loops, easing, rendering, and resize systems.',
    flowchart: `flowchart TB
  Foundation["Renderer scene and camera #3-18"]
  Foundation --> Terrain["Create terrain objects #69-81"]
  Terrain --> Texture["Generate dot texture #27-41"]
  Terrain --> Points["Build point grid #43-54"]
  Terrain --> Shadow["Build shadow plane #56-67"]
  Texture --> GeometryReady["Assemble terrain geometry #70-80"]
  Points --> GeometryReady
  Shadow --> GeometryReady
  GeometryReady --> Motion["Animate crater and camera #110-125"]
  Motion --> FrameLoop["Run recursive render loop #93-100"]
  FrameLoop --> Deform["Deform both geometries #83-96"]
  Deform --> SurfaceMath["Calculate crater and ripple #84-90"]
  FrameLoop --> ViewTransform["Rotate aim and render #97-99"]
  Motion --> ViewTransform
  FrameLoop --> ResizeEvent["Listen for viewport resize #127"]
  ResizeEvent --> Resize["Refresh camera and renderer #102-108"]`,
    source: {
      javascript: `console.clear();

let viewportWidth = window.innerWidth;
let viewportHeight = window.innerHeight;
const canvas = document.querySelector('#terrain');
const renderer = new THREE.WebGLRenderer({ canvas, antialias: true });
renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
renderer.setSize(viewportWidth, viewportHeight);
renderer.setClearColor(0x08090b);

const scene = new THREE.Scene();
scene.fog = new THREE.Fog(0x08090b, 90, 180);

const camera = new THREE.PerspectiveCamera(45, viewportWidth / viewportHeight, 0.1, 1000);
camera.position.set(0, 32, 108);

const container = new THREE.Object3D();
scene.add(container);

const grid = { width: 120, depth: 120, spacing: 1.35 };
const center = new THREE.Vector3(0, 0, 0);
const maxDistance = new THREE.Vector3(grid.width * 0.5, 0, grid.depth * 0.5).distanceTo(center);
const motion = { crater: 0.25, depth: 1.1, speed: 0.004 };
let dots;
let shadowPlane;

function makeDotTexture() {
  const sprite = document.createElement('canvas');
  sprite.width = 32;
  sprite.height = 32;
  const context = sprite.getContext('2d');
  const gradient = context.createRadialGradient(16, 16, 0, 16, 16, 16);
  gradient.addColorStop(0, 'rgba(255,255,255,1)');
  gradient.addColorStop(0.35, 'rgba(255,255,255,.9)');
  gradient.addColorStop(1, 'rgba(255,255,255,0)');
  context.fillStyle = gradient;
  context.fillRect(0, 0, 32, 32);
  const texture = new THREE.Texture(sprite);
  texture.needsUpdate = true;
  return texture;
}

function buildPointGeometry() {
  const geometry = new THREE.Geometry();
  for (let x = -grid.width * 0.5; x < grid.width * 0.5; x += 1) {
    for (let z = -grid.depth * 0.5; z < grid.depth * 0.5; z += 1) {
      const point = new THREE.Vector3(x * grid.spacing, 0, z * grid.spacing);
      point.distanceFromCenter = point.distanceTo(center);
      point.ratio = (maxDistance - point.distanceFromCenter) / maxDistance;
      geometry.vertices.push(point);
    }
  }
  return geometry;
}

function buildShadowPlane() {
  const geometry = new THREE.PlaneGeometry(grid.width * grid.spacing, grid.depth * grid.spacing, 50, 50);
  geometry.rotateX(-Math.PI * 0.5);
  geometry.vertices.forEach((point) => {
    point.distanceFromCenter = point.distanceTo(center);
    point.ratio = (maxDistance - point.distanceFromCenter) / maxDistance;
  });
  const material = new THREE.MeshBasicMaterial({ color: 0x08090b, side: THREE.DoubleSide });
  shadowPlane = new THREE.Mesh(geometry, material);
  shadowPlane.position.y = -4;
  container.add(shadowPlane);
}

function createTerrain() {
  const pointMaterial = new THREE.PointsMaterial({
    color: 0xffffff,
    map: makeDotTexture(),
    transparent: true,
    alphaTest: 0.08,
    size: 1.8,
    sizeAttenuation: false
  });
  dots = new THREE.Points(buildPointGeometry(), pointMaterial);
  container.add(dots);
  buildShadowPlane();
}

function deformGeometry(geometry, time, multiplier) {
  geometry.vertices.forEach((point) => {
    const ratio = Math.max(point.ratio, 0);
    const crater = Math.pow(ratio, 4) * motion.depth * -90;
    const ripple = Math.sin(-(point.distanceFromCenter * 0.34) + time * motion.speed) * 2.2;
    point.y = Math.max(crater + ripple + motion.crater, -72) * multiplier;
  });
  geometry.verticesNeedUpdate = true;
}

function render(time) {
  requestAnimationFrame(render);
  deformGeometry(dots.geometry, time, 1);
  deformGeometry(shadowPlane.geometry, time, 0.98);
  container.rotation.y += 0.0008;
  camera.lookAt(new THREE.Vector3(0, -18, 0));
  renderer.render(scene, camera);
}

function onResize() {
  viewportWidth = window.innerWidth;
  viewportHeight = window.innerHeight;
  camera.aspect = viewportWidth / viewportHeight;
  camera.updateProjectionMatrix();
  renderer.setSize(viewportWidth, viewportHeight);
}

TweenMax.to(motion, 5, {
  crater: 2,
  depth: 1.7,
  yoyo: true,
  repeat: -1,
  repeatDelay: 0.4,
  ease: Power1.easeInOut
});

TweenMax.to(camera.position, 7, {
  z: 62,
  y: 76,
  yoyo: true,
  repeat: -1,
  ease: Power1.easeInOut
});

window.addEventListener('resize', onResize);
createTerrain();
requestAnimationFrame(render);`,
      html: `<script src="https://cdnjs.cloudflare.com/ajax/libs/three.js/84/three.min.js"></script>
<script src="https://cdnjs.cloudflare.com/ajax/libs/gsap/1.20.0/TweenMax.min.js"></script>
<canvas id="terrain" aria-label="Animated particle terrain"></canvas>
<aside>
  <span>Archived study 01</span>
  <strong>Particle terrain</strong>
</aside>`,
      css: `body {
  margin: 0;
  overflow: hidden;
  color: white;
  background: #08090b;
  font-family: "Maven Pro", sans-serif;
}
canvas { position: fixed; inset: 0; width: 100%; height: 100%; }
aside { position: fixed; left: 32px; bottom: 28px; display: grid; gap: 4px; }
aside span { color: rgba(255,255,255,.5); font-size: 10px; letter-spacing: .14em; text-transform: uppercase; }
aside strong { font-size: 18px; font-weight: 580; }`
    }
  },
  {
    name: 'Kinetic LILI grid',
    category: 'Anime.js · sequencing',
    description: 'From the archived project: a letter system built from indexed cells, target partitioning, parallel timelines, stagger logic, and reversible interaction.',
    flowchart: `flowchart TB
  Coordinates["setGridCoordinates #27-32"]
  Coordinates --> Word["Build word indices #8-17"]
  Word --> Partition["Split letter and field targets #19-25"]
  Partition --> Letters["Resolve letter cells #22"]
  Partition --> Background["Resolve background cells #23"]
  Letters --> Timeline["Build looping timeline #34-69"]
  Background --> Timeline
  Timeline --> LetterPhase["Transform letter cells #41-49"]
  Timeline --> FieldPhase["Transform field cells #51-58"]
  LetterPhase --> ColorPhase["Resolve accent color #60-66"]
  FieldPhase --> ColorPhase
  ColorPhase --> RuntimeListeners["Attach interaction listeners #87-88"]
  RuntimeListeners --> Pointer["Map pointer to grid tilt #71-76"]
  Pointer --> Tilt["Write tilt variables #74-75"]
  RuntimeListeners --> Reverse["Reverse and resume sequence #78-82"]`,
    source: {
      javascript: `const columns = 20;
const rows = 6;
const cells = Array.from(document.querySelectorAll('.cell'));
const letterL = [20, 40, 60, 80, 81, 82];
const letterI = [20, 40, 60, 80];
let direction = 1;

function offset(indices, amount) {
  return indices.map((index) => index + amount);
}

function buildWordIndices() {
  return offset(letterL, 3)
    .concat(offset(letterI, 8))
    .concat(offset(letterL, 11))
    .concat(offset(letterI, 16));
}

function splitTargets(wordIndices) {
  const wordSet = new Set(wordIndices);
  return {
    letters: wordIndices.map((index) => cells[index]).filter(Boolean),
    background: cells.filter((cell, index) => !wordSet.has(index))
  };
}

function setGridCoordinates() {
  cells.forEach((cell, index) => {
    cell.dataset.column = index % columns;
    cell.dataset.row = Math.floor(index / columns);
  });
}

function buildTimeline(targets) {
  const timeline = anime.timeline({
    easing: 'easeInOutExpo',
    direction: 'alternate',
    loop: true
  });

  timeline.add({
    targets: targets.letters,
    backgroundColor: '#f7f5ef',
    borderColor: '#121316',
    scale: [1, 0.62],
    rotateX: 180,
    duration: 720,
    delay: anime.stagger(42, { grid: [columns, rows], from: 'center' })
  });

  timeline.add({
    targets: targets.background,
    rotateX: () => direction * 180,
    scale: [1, 0.82],
    opacity: [1, 0.32],
    duration: 720,
    delay: anime.stagger(18, { grid: [columns, rows], from: 'center' })
  }, 0);

  timeline.add({
    targets: targets.letters,
    backgroundColor: '#ff6b3d',
    borderColor: '#ff6b3d',
    scale: 1,
    duration: 1100
  });

  return timeline;
}

function handlePointerMove(event) {
  const horizontal = event.clientX / window.innerWidth - 0.5;
  const vertical = event.clientY / window.innerHeight - 0.5;
  document.documentElement.style.setProperty('--tilt-x', vertical * -10 + 'deg');
  document.documentElement.style.setProperty('--tilt-y', horizontal * 12 + 'deg');
}

function reverseSequence() {
  direction *= -1;
  timeline.reverse();
  timeline.play();
}

setGridCoordinates();
const targets = splitTargets(buildWordIndices());
const timeline = buildTimeline(targets);
window.addEventListener('pointermove', handlePointerMove);
document.querySelector('.kinetic-grid').addEventListener('click', reverseSequence);`,
      html: [
        '<script src="https://cdnjs.cloudflare.com/ajax/libs/animejs/3.2.1/anime.min.js"></script>',
        '<main>',
        '  <header><span>Archived study 02</span><strong>Click to reverse</strong></header>',
        '  <div class="kinetic-grid" role="img" aria-label="Animated grid spelling LILI">',
        ...Array.from({ length: 120 }, (_, index) => `    <i class="cell" aria-hidden="true" data-index="${index}"></i>`),
        '  </div>',
        '</main>'
      ].join('\n'),
      css: `:root { --tilt-x: 0deg; --tilt-y: 0deg; }
body {
  min-height: 100vh;
  margin: 0;
  display: grid;
  place-items: center;
  overflow: hidden;
  color: #18191b;
  background: #d8d7d2;
  font-family: "Maven Pro", sans-serif;
  perspective: 900px;
}
main { width: min(880px, 92vw); }
header { display: flex; justify-content: space-between; margin-bottom: 18px; font-size: 11px; letter-spacing: .1em; text-transform: uppercase; }
.kinetic-grid {
  display: grid;
  grid-template-columns: repeat(20, minmax(10px, 1fr));
  gap: clamp(3px, .7vw, 10px);
  transform: rotateX(var(--tilt-x)) rotateY(var(--tilt-y));
  transform-style: preserve-3d;
  transition: transform 180ms ease-out;
  cursor: pointer;
}
.cell {
  display: block;
  aspect-ratio: 1;
  border: 2px solid #f7f5ef;
  border-radius: 50%;
  background: #17181a;
  transform-style: preserve-3d;
}`
    }
  },
  {
    name: 'Recursive wind garden',
    category: 'Canvas · recursion',
    description: 'A recursive branching system with depth limits, probabilistic forks, wind forces, seasonal color decisions, and a continuous render loop.',
    flowchart: `flowchart TB
  Setup["Canvas and interaction state #1-4"]
  Setup --> Resize["Scale canvas for the viewport #6-13"]
  Setup --> Pointer["Update pointer position #74-77"]
  Pointer --> Wind["Ease wind and branch spread #65-66"]
  Resize --> Render["Clear and render each frame #63-72"]
  Wind --> Render
  Render --> Branch["Draw recursive branch #28-61"]
  Branch --> LeafCase["Stop recursion at a leaf #29-31"]
  LeafCase --> Leaf["Draw and color the leaf #15-26"]
  Branch --> Stem["Draw the swaying stem #34-40"]
  Stem --> Children["Recurse left and right #42-52"]
  Stem --> ThirdBranch["Add every third branch #54-60"]`,
    source: {
      javascript: `const canvas = document.querySelector('#garden');
const context = canvas.getContext('2d');
const pointer = { x: 0.5, y: 0.5 };
const settings = { depth: 9, spread: 0.54, shrink: 0.73, wind: 0 };

function resizeCanvas() {
  const scale = Math.min(window.devicePixelRatio, 2);
  canvas.width = window.innerWidth * scale;
  canvas.height = window.innerHeight * scale;
  canvas.style.width = window.innerWidth + 'px';
  canvas.style.height = window.innerHeight + 'px';
  context.setTransform(scale, 0, 0, scale, 0, 0);
}

function leafColor(depth, side) {
  if (depth > 3) return 'rgba(32, 40, 34, .82)';
  if (side < 0) return 'rgba(138, 168, 125, .72)';
  return 'rgba(203, 132, 91, .76)';
}

function drawLeaf(length, depth, side) {
  context.beginPath();
  context.ellipse(0, -length, 3 + depth, 7 + depth, side * 0.4, 0, Math.PI * 2);
  context.fillStyle = leafColor(depth, side);
  context.fill();
}

function drawBranch(length, depth, side, time) {
  if (depth <= 0 || length < 2) {
    drawLeaf(length, depth, side);
    return;
  }

  const sway = Math.sin(time * 0.0015 + depth * 0.7) * settings.wind * (10 - depth);
  context.strokeStyle = depth > 5 ? '#262c27' : 'rgba(53, 69, 58, .78)';
  context.lineWidth = Math.max(depth * 0.72, 1);
  context.beginPath();
  context.moveTo(0, 0);
  context.quadraticCurveTo(sway, -length * 0.55, sway * 0.6, -length);
  context.stroke();

  context.save();
  context.translate(sway * 0.6, -length);
  context.rotate(-settings.spread + sway * 0.002);
  drawBranch(length * settings.shrink, depth - 1, -1, time);
  context.restore();

  context.save();
  context.translate(sway * 0.6, -length);
  context.rotate(settings.spread + sway * 0.002);
  drawBranch(length * settings.shrink, depth - 1, 1, time);
  context.restore();

  if (depth % 3 === 0) {
    context.save();
    context.translate(sway * 0.6, -length);
    context.rotate(Math.sin(time * 0.0007 + depth) * 0.18);
    drawBranch(length * 0.58, depth - 2, side, time);
    context.restore();
  }
}

function render(time) {
  context.clearRect(0, 0, window.innerWidth, window.innerHeight);
  settings.wind += ((pointer.x - 0.5) * 1.8 - settings.wind) * 0.035;
  settings.spread += ((0.35 + pointer.y * 0.42) - settings.spread) * 0.025;
  context.save();
  context.translate(window.innerWidth * 0.5, window.innerHeight * 0.94);
  drawBranch(Math.min(window.innerHeight * 0.21, 150), settings.depth, 1, time);
  context.restore();
  requestAnimationFrame(render);
}

window.addEventListener('pointermove', (event) => {
  pointer.x = event.clientX / window.innerWidth;
  pointer.y = event.clientY / window.innerHeight;
});
window.addEventListener('resize', resizeCanvas);
resizeCanvas();
requestAnimationFrame(render);`,
      html: `<canvas id="garden" aria-label="Recursive animated tree"></canvas>
<aside><span>Move your pointer</span><strong>Wind garden</strong></aside>`,
      css: `body {
  margin: 0;
  overflow: hidden;
  color: #273028;
  background: radial-gradient(circle at 50% 76%, #f2ead9, #dfe7dc 54%, #bccbc0);
  font-family: "Maven Pro", sans-serif;
}
canvas { position: fixed; inset: 0; }
aside { position: fixed; top: 28px; left: 32px; display: grid; gap: 3px; }
aside span { opacity: .55; font-size: 10px; letter-spacing: .13em; text-transform: uppercase; }
aside strong { font-size: 19px; font-weight: 600; }`
    }
  },
  {
    name: 'Boid constellation',
    category: 'Canvas · agent system',
    description: 'A multi-agent simulation with neighborhood searches, separation, alignment, cohesion, boundary wrapping, pointer avoidance, and connection rules.',
    flowchart: `flowchart TB
  Canvas["Configure canvas and flock settings #1-14"]
  Canvas --> Initialize["Create flock and start rendering #142-144"]
  Initialize --> Create["Create randomized boids #16-24"]
  Initialize --> Render["Run the animation frame #121-133"]
  Render --> Update["Update every boid #93-104"]
  Update --> Neighbors["Find nearby boids #35-40"]
  Neighbors --> Flock["Combine flocking forces #42-72"]
  Flock --> Avoid["Add pointer avoidance #74-84"]
  Pointer["Track pointer activity #135-140"] --> Avoid
  Avoid --> Motion["Limit force move and wrap #95-103"]
  Render --> Connections["Draw nearby connections #106-119"]
  Render --> Boids["Draw each boid point #126-131"]`,
    source: {
      javascript: `const canvas = document.querySelector('#constellation');
const context = canvas.getContext('2d');
const pointer = { x: -1000, y: -1000, active: false };
const boids = [];
const config = { count: 58, neighborRadius: 76, maxSpeed: 1.9, maxForce: 0.038 };

function resizeCanvas() {
  const ratio = Math.min(window.devicePixelRatio, 2);
  canvas.width = window.innerWidth * ratio;
  canvas.height = window.innerHeight * ratio;
  canvas.style.width = window.innerWidth + 'px';
  canvas.style.height = window.innerHeight + 'px';
  context.setTransform(ratio, 0, 0, ratio, 0, 0);
}

function createBoid() {
  const angle = Math.random() * Math.PI * 2;
  return {
    x: Math.random() * window.innerWidth,
    y: Math.random() * window.innerHeight,
    vx: Math.cos(angle) * config.maxSpeed,
    vy: Math.sin(angle) * config.maxSpeed
  };
}

function limit(vector, maximum) {
  const magnitude = Math.hypot(vector.x, vector.y);
  if (magnitude > maximum) {
    vector.x = vector.x / magnitude * maximum;
    vector.y = vector.y / magnitude * maximum;
  }
  return vector;
}

function findNeighbors(boid) {
  return boids.filter((other) => {
    if (other === boid) return false;
    return Math.hypot(other.x - boid.x, other.y - boid.y) < config.neighborRadius;
  });
}

function calculateFlockForce(boid, neighbors) {
  const alignment = { x: 0, y: 0 };
  const cohesion = { x: 0, y: 0 };
  const separation = { x: 0, y: 0 };

  neighbors.forEach((other) => {
    const dx = other.x - boid.x;
    const dy = other.y - boid.y;
    const distance = Math.max(Math.hypot(dx, dy), 0.001);
    alignment.x += other.vx;
    alignment.y += other.vy;
    cohesion.x += other.x;
    cohesion.y += other.y;
    if (distance < 28) {
      separation.x -= dx / (distance * distance);
      separation.y -= dy / (distance * distance);
    }
  });

  if (neighbors.length > 0) {
    alignment.x = alignment.x / neighbors.length - boid.vx;
    alignment.y = alignment.y / neighbors.length - boid.vy;
    cohesion.x = cohesion.x / neighbors.length - boid.x;
    cohesion.y = cohesion.y / neighbors.length - boid.y;
  }

  return {
    x: alignment.x * 0.018 + cohesion.x * 0.0005 + separation.x * 1.8,
    y: alignment.y * 0.018 + cohesion.y * 0.0005 + separation.y * 1.8
  };
}

function avoidPointer(boid, force) {
  if (!pointer.active) return force;
  const dx = boid.x - pointer.x;
  const dy = boid.y - pointer.y;
  const distance = Math.hypot(dx, dy);
  if (distance < 110 && distance > 0) {
    force.x += dx / distance * 0.12;
    force.y += dy / distance * 0.12;
  }
  return force;
}

function wrap(boid) {
  if (boid.x < -8) boid.x = window.innerWidth + 8;
  if (boid.x > window.innerWidth + 8) boid.x = -8;
  if (boid.y < -8) boid.y = window.innerHeight + 8;
  if (boid.y > window.innerHeight + 8) boid.y = -8;
}

function updateBoid(boid) {
  const neighbors = findNeighbors(boid);
  const force = limit(avoidPointer(boid, calculateFlockForce(boid, neighbors)), config.maxForce);
  boid.vx += force.x;
  boid.vy += force.y;
  const velocity = limit({ x: boid.vx, y: boid.vy }, config.maxSpeed);
  boid.vx = velocity.x;
  boid.vy = velocity.y;
  boid.x += boid.vx;
  boid.y += boid.vy;
  wrap(boid);
}

function drawConnections() {
  boids.forEach((boid, index) => {
    boids.slice(index + 1).forEach((other) => {
      const distance = Math.hypot(other.x - boid.x, other.y - boid.y);
      if (distance < 64) {
        context.strokeStyle = 'rgba(137, 181, 255,' + (1 - distance / 64) * 0.28 + ')';
        context.beginPath();
        context.moveTo(boid.x, boid.y);
        context.lineTo(other.x, other.y);
        context.stroke();
      }
    });
  });
}

function render() {
  context.fillStyle = 'rgba(7, 11, 20, .23)';
  context.fillRect(0, 0, window.innerWidth, window.innerHeight);
  boids.forEach(updateBoid);
  drawConnections();
  boids.forEach((boid) => {
    context.fillStyle = '#dce8ff';
    context.beginPath();
    context.arc(boid.x, boid.y, 1.8, 0, Math.PI * 2);
    context.fill();
  });
  requestAnimationFrame(render);
}

window.addEventListener('pointermove', (event) => {
  pointer.x = event.clientX;
  pointer.y = event.clientY;
  pointer.active = true;
});
window.addEventListener('pointerleave', () => { pointer.active = false; });
window.addEventListener('resize', resizeCanvas);
resizeCanvas();
for (let index = 0; index < config.count; index += 1) boids.push(createBoid());
requestAnimationFrame(render);`,
      html: `<canvas id="constellation" aria-label="Animated flocking constellation"></canvas>
<aside><span>Move through the field</span><strong>Boid constellation</strong></aside>`,
      css: `body {
  margin: 0;
  overflow: hidden;
  color: #dce8ff;
  background: #070b14;
  font-family: "Maven Pro", sans-serif;
}
canvas { position: fixed; inset: 0; }
aside { position: fixed; left: 30px; bottom: 26px; display: grid; gap: 4px; }
aside span { color: rgba(220,232,255,.46); font-size: 10px; letter-spacing: .14em; text-transform: uppercase; }
aside strong { font-size: 18px; font-weight: 580; }`
    }
  }
];
