const canvas = document.getElementById('game');
const ctx = canvas.getContext('2d');

const fruitCatalog = {
  banana: { name: 'Banana', color: '#ffe680' },
  strawberry: { name: 'Strawberry', color: '#ff6b89' },
  blueberry: { name: 'Blueberry', color: '#6f8cff' },
  spinach: { name: 'Spinach', color: '#6cc66c' },
  mango: { name: 'Mango', color: '#ffba4d' }
};

const blender = {
  x: 0,
  y: 0,
  width: 300,
  height: 370,
  waterLevel: 0.32,
  waterColor: [168, 224, 255],
  fruits: [],
  choppedBits: [],
  isBlending: false,
  blendProgress: 0,
  blendDuration: 2,
  swirlPhase: 0
};

// particle-based water and fruit particles
const waterParticles = [];
const MAX_WATER_PARTICLES = 220;

function initWaterParticles() {
  waterParticles.length = 0;
  const fillRatio = blender.waterLevel;
  const left = blender.x - blender.width / 2 + 20;
  const right = blender.x + blender.width / 2 - 20;
  const top = blender.y - blender.height / 2;
  const jarHeight = blender.height;
  const waterTop = top + jarHeight - jarHeight * fillRatio + 10;

  for (let i = 0; i < MAX_WATER_PARTICLES; i++) {
    const x = lerp(left, right, Math.random());
    const y = lerp(waterTop + 4, top + jarHeight - 24, Math.random());
    waterParticles.push({ x, y, vx: (Math.random() - 0.5) * 0.3, vy: Math.random() * 0.3, r: 3 + Math.random() * 2, color: `rgba(${blender.waterColor[0]}, ${blender.waterColor[1]}, ${blender.waterColor[2]}, 0.9)`, sticky: 0.92 });
  }
}

const dragState = {
  active: false,
  element: null,
  pointerId: null,
  x: 0,
  y: 0,
  targetX: 0,
  targetY: 0,
  offsetX: 0,
  offsetY: 0,
  lastX: 0,
  lastY: 0
};

function resize() {
  canvas.width = window.innerWidth;
  canvas.height = window.innerHeight;
  blender.x = canvas.width * 0.52;
  blender.y = canvas.height * 0.6;
}
window.addEventListener('resize', resize);
resize();

function resetBlender() {
  blender.fruits = [];
  blender.choppedBits = [];
  blender.waterColor = [168, 224, 255];
  blender.isBlending = false;
  blender.blendProgress = 0;
  blender.swirlPhase = 0;
  document.querySelectorAll('.fruit').forEach((el) => {
    el.style.opacity = '1';
    el.style.pointerEvents = 'auto';
    el.style.display = 'block';
  });
  initWaterParticles();
}

function clamp(value, min, max) {
  return Math.min(Math.max(value, min), max);
}

function lerp(a, b, t) {
  return a + (b - a) * t;
}

function mixColors(colorA, colorB, amount) {
  const r = Math.round(lerp(colorA[0], colorB[0], amount));
  const g = Math.round(lerp(colorA[1], colorB[1], amount));
  const b = Math.round(lerp(colorA[2], colorB[2], amount));
  return [r, g, b];
}

function computeBlendColor() {
  const base = [168, 224, 255];
  if (blender.fruits.length === 0) return base;

  let r = base[0];
  let g = base[1];
  let b = base[2];

  blender.fruits.forEach((fruit) => {
    const color = hexToRgb(fruitCatalog[fruit].color);
    r += color.r;
    g += color.g;
    b += color.b;
  });

  const total = blender.fruits.length + 1;
  return [Math.round(r / total), Math.round(g / total), Math.round(b / total)];
}

function hexToRgb(hex) {
  const clean = hex.replace('#', '');
  const bigint = parseInt(clean, 16);
  return {
    r: (bigint >> 16) & 255,
    g: (bigint >> 8) & 255,
    b: bigint & 255
  };
}

function createFruitImages() {
  const elements = document.querySelectorAll('.fruit');
  elements.forEach((el) => {
    const name = el.dataset.fruit;
    const localPath = `assets/fruits/${name}.png`;
    // check for previously uploaded image in localStorage
    const saved = localStorage.getItem(`fruit-img-${name}`);
    if (saved) {
      el.style.backgroundImage = `url(${saved})`;
      el.style.backgroundSize = '56px 56px';
      el.style.backgroundRepeat = 'no-repeat';
      el.style.backgroundPosition = 'center';
      el.textContent = '';
    } else {
      // attempt to use downloaded fruit image, fallback to color circle
      fetch(localPath, { method: 'HEAD' }).then((res) => {
        if (res.ok) {
          el.style.backgroundImage = `url(${localPath})`;
          el.style.backgroundSize = '56px 56px';
          el.style.backgroundRepeat = 'no-repeat';
          el.style.backgroundPosition = 'center';
          el.textContent = '';
        } else {
          // fallback: simple colored circle
          const color = fruitCatalog[name] ? fruitCatalog[name].color : '#ffffff';
          el.style.backgroundImage = '';
          el.style.backgroundColor = color;
          el.textContent = name.charAt(0).toUpperCase();
        }
      }).catch(() => {
        const color = fruitCatalog[name] ? fruitCatalog[name].color : '#ffffff';
        el.style.backgroundImage = '';
        el.style.backgroundColor = color;
        el.textContent = name.charAt(0).toUpperCase();
      });
    }

    // enable dropping an image onto the fruit tile to replace it (stored in localStorage)
    el.addEventListener('dragover', (ev) => { ev.preventDefault(); });
    el.addEventListener('drop', (ev) => {
      ev.preventDefault();
      const f = ev.dataTransfer.files && ev.dataTransfer.files[0];
      if (!f) return;
      const reader = new FileReader();
      reader.onload = () => {
        const dataUrl = reader.result;
        el.style.backgroundImage = `url(${dataUrl})`;
        el.style.backgroundSize = '56px 56px';
        el.style.backgroundRepeat = 'no-repeat';
        el.style.backgroundPosition = 'center';
        el.textContent = '';
        try { localStorage.setItem(`fruit-img-${name}`, dataUrl); } catch (e) {}
      };
      reader.readAsDataURL(f);
    });
  });
}

function getCanvasPoint(clientX, clientY) {
  const rect = canvas.getBoundingClientRect();
  return {
    x: clientX - rect.left,
    y: clientY - rect.top
  };
}

function isInsideBlender(x, y) {
  const left = blender.x - blender.width / 2;
  const top = blender.y - blender.height / 2;
  const right = left + blender.width;
  const bottom = top + blender.height;
  return x >= left && x <= right && y >= top && y <= bottom;
}

function addFruitToBlender(fruitName) {
  const maxFruits = Number(document.getElementById('maxFruits').value || 5);
  if (blender.fruits.length >= maxFruits) return;
  blender.fruits.push(fruitName);
}

function drawBackground() {
  const sky = ctx.createLinearGradient(0, 0, 0, canvas.height);
  sky.addColorStop(0, '#dff3ff');
  sky.addColorStop(0.7, '#a8d0ff');
  sky.addColorStop(1, '#dfeaff');
  ctx.fillStyle = sky;
  ctx.fillRect(0, 0, canvas.width, canvas.height);

  ctx.fillStyle = 'rgba(255,255,255,0.2)';
  ctx.fillRect(0, canvas.height - 120, canvas.width, 120);
}

function spawnChoppedBits() {
  blender.choppedBits = [];
  blender.fruits.forEach((fruitName, index) => {
    const color = hexToRgb(fruitCatalog[fruitName].color);
    const cx = blender.x;
    const cy = blender.y + 25;

    for (let i = 0; i < 10; i++) {
      const angle = (Math.PI * 2 * i) / 10 + index * 0.7;
      const radius = 18 + Math.random() * 44;
      blender.choppedBits.push({
        x: cx + Math.cos(angle) * radius,
        y: cy + Math.sin(angle) * radius,
        w: 10 + Math.random() * 12,
        h: 7 + Math.random() * 10,
        color: `rgba(${color.r}, ${color.g}, ${color.b}, 0.95)`,
        angle: Math.random() * Math.PI * 2,
        spin: (Math.random() - 0.5) * 0.45,
        driftX: (Math.random() - 0.5) * 0.9,
        driftY: (Math.random() - 0.5) * 0.9
      });
    }
  });
  // also inject small colored particles into the water to simulate chopped fruit mixing
  blender.choppedBits.forEach((bit) => {
    for (let k = 0; k < 4; k++) {
      waterParticles.push({
        x: bit.x + (Math.random() - 0.5) * 8,
        y: bit.y + (Math.random() - 0.5) * 8,
        vx: (Math.random() - 0.5) * 1.2,
        vy: (Math.random() - 0.5) * 1.2,
        r: 2 + Math.random() * 2,
        color: bit.color.replace('0.9', '0.98'),
        sticky: 0.85
      });
    }
  });
}

function drawBlender() {
  const left = blender.x - blender.width / 2;
  const top = blender.y - blender.height / 2;
  const jarWidth = blender.width;
  const jarHeight = blender.height;
  // blender jar: narrow at bottom, wider at top
  ctx.fillStyle = '#d9eaf2';
  ctx.beginPath();
  ctx.moveTo(left + 40, top + 8);
  ctx.bezierCurveTo(left + 20, top + 30, left + 18, top + jarHeight - 24, left + 36, top + jarHeight + 6);
  ctx.lineTo(left + jarWidth - 36, top + jarHeight + 6);
  ctx.bezierCurveTo(left + jarWidth - 18, top + jarHeight - 24, left + jarWidth - 20, top + 30, left + jarWidth - 40, top + 8);
  ctx.closePath();
  ctx.fill();

  // glass shine and lid
  ctx.fillStyle = 'rgba(255,255,255,0.22)';
  ctx.fillRect(left + 18, top + 20, 16, jarHeight - 70);
  ctx.fillStyle = '#2d3037';
  ctx.fillRect(left + 35, top - 30, jarWidth - 70, 26);
  ctx.fillStyle = '#3d4046';
  ctx.fillRect(left + 58, top - 46, jarWidth - 116, 18);

  // base stand
  ctx.fillStyle = '#444a52';
  ctx.fillRect(left - 34, top + jarHeight + 10, jarWidth + 68, 34);
  ctx.fillStyle = '#5d646f';
  ctx.fillRect(left - 10, top + jarHeight + 18, jarWidth + 20, 10);

  // water fill (soft background)
  const fillHeight = jarHeight * blender.waterLevel;
  const waterTop = top + jarHeight - fillHeight;
  ctx.fillStyle = `rgba(${blender.waterColor[0]}, ${blender.waterColor[1]}, ${blender.waterColor[2]}, 0.12)`;
  ctx.fillRect(left + 18, waterTop + 10, jarWidth - 36, fillHeight - 18);

  // smooth juice-like liquid body instead of visible particle dots
  ctx.save();
  ctx.beginPath();
  ctx.moveTo(left + 40, top + 8);
  ctx.bezierCurveTo(left + 20, top + 30, left + 18, top + jarHeight - 24, left + 36, top + jarHeight + 6);
  ctx.lineTo(left + jarWidth - 36, top + jarHeight + 6);
  ctx.bezierCurveTo(left + jarWidth - 18, top + jarHeight - 24, left + jarWidth - 20, top + 30, left + jarWidth - 40, top + 8);
  ctx.closePath();
  ctx.clip();

  const juiceOpacity = blender.isBlending ? 0.99 : 0.92;
  const juiceGradient = ctx.createLinearGradient(left, waterTop, left, top + jarHeight);
  juiceGradient.addColorStop(0, `rgba(${blender.waterColor[0]}, ${blender.waterColor[1]}, ${blender.waterColor[2]}, ${juiceOpacity})`);
  juiceGradient.addColorStop(0.36, `rgba(${blender.waterColor[0]}, ${blender.waterColor[1]}, ${blender.waterColor[2]}, ${Math.max(0.8, juiceOpacity - 0.06)})`);
  juiceGradient.addColorStop(0.7, `rgba(${blender.waterColor[0]}, ${blender.waterColor[1]}, ${blender.waterColor[2]}, ${Math.max(0.72, juiceOpacity - 0.16)})`);
  juiceGradient.addColorStop(1, `rgba(${Math.max(10, blender.waterColor[0] - 24)}, ${Math.max(12, blender.waterColor[1] - 18)}, ${Math.max(15, blender.waterColor[2] - 16)}, 0.82)`);
  ctx.fillStyle = juiceGradient;
  ctx.fillRect(left + 18, waterTop + 4, jarWidth - 36, jarHeight - 24);

  const thicknessBoost = blender.isBlending ? 1.6 : 1.2;
  for (let i = 0; i < 14; i++) {
    const x = left + 54 + i * ((jarWidth - 108) / 13);
    const wave = Math.sin((i * 2.1) + blender.swirlPhase * 3.1) * (14 * thicknessBoost);
    const blobY = waterTop + 20 + i * 8 + wave;
    const blobWidth = 22 + (i % 3) * 12;
    const blobHeight = 18 + (i % 4) * 10;
    ctx.fillStyle = `rgba(${blender.waterColor[0]}, ${blender.waterColor[1]}, ${blender.waterColor[2]}, ${0.16 + (i / 26)})`;
    ctx.beginPath();
    ctx.ellipse(x, blobY, blobWidth, blobHeight, 0, 0, Math.PI * 2);
    ctx.fill();
  }

  ctx.fillStyle = 'rgba(255,255,255,0.28)';
  ctx.beginPath();
  ctx.ellipse(blender.x - 30, waterTop + 30, 58, 24, -0.46, 0, Math.PI * 2);
  ctx.fill();
  ctx.fillStyle = 'rgba(255,255,255,0.12)';
  ctx.beginPath();
  ctx.ellipse(blender.x + 22, waterTop + 54, 48, 18, 0.28, 0, Math.PI * 2);
  ctx.fill();
  ctx.fillStyle = 'rgba(20,20,20,0.08)';
  ctx.beginPath();
  ctx.ellipse(blender.x, waterTop + 90, 68, 16, 0, 0, Math.PI * 2);
  ctx.fill();
  ctx.restore();

  // foam overlay
  const foamToggleEl = document.getElementById('foamToggle');
  if ((foamToggleEl && foamToggleEl.checked) && blender.isBlending) {
    ctx.fillStyle = 'rgba(255,255,255,0.12)';
    for (let i = 0; i < 180; i++) {
      const fx = blender.x - 90 + Math.random() * 180;
      const fy = waterTop + 4 + Math.random() * 20;
      ctx.beginPath();
      ctx.arc(fx, fy, 1 + Math.random() * 3, 0, Math.PI * 2);
      ctx.fill();
    }
  }

  // swirling motion lines while blending
  if (blender.isBlending) {
    ctx.strokeStyle = 'rgba(255,255,255,0.25)';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.arc(blender.x, blender.y + 12, 70 + Math.sin(blender.swirlPhase) * 10, 0.7, Math.PI * 1.7);
    ctx.stroke();
    ctx.beginPath();
    ctx.arc(blender.x, blender.y + 10, 50 + Math.cos(blender.swirlPhase) * 9, Math.PI * 1.2, Math.PI * 2.3);
    ctx.stroke();
  }

  // rotating blade at bottom (visual)
  const bladeCenterX = blender.x;
  const bladeCenterY = top + jarHeight - 20;
  const bladeLen = jarWidth * 0.5;
  const bladeSpeed = blender.isBlending ? 0.45 + blender.blendDuration * 0.15 : 0.0;
  blender.bladeAngle = (blender.bladeAngle || 0) + bladeSpeed;
  ctx.save();
  ctx.translate(bladeCenterX, bladeCenterY);
  ctx.rotate(blender.bladeAngle);
  ctx.fillStyle = '#bfc9d6';
  ctx.fillRect(-bladeLen / 2, -6, bladeLen, 12);
  ctx.fillStyle = '#dfe7f3';
  ctx.fillRect(-14, -18, 28, 12);
  ctx.restore();

  // chopped fruit pieces: rotate and swirl in the smoothie
  if (blender.isBlending || blender.choppedBits.length > 0) {
    for (let i = 0; i < blender.choppedBits.length; i++) {
      const bit = blender.choppedBits[i];
      ctx.save();
      ctx.translate(bit.x, bit.y);
      ctx.rotate(bit.angle);
      ctx.fillStyle = bit.color;
      ctx.fillRect(-bit.w / 2, -bit.h / 2, bit.w, bit.h);
      ctx.restore();
    }
  }

  // original fruit markers disappear as soon as blending starts; only chopped particles remain
  if (!blender.isBlending && blender.choppedBits.length === 0) {
    for (let i = 0; i < blender.fruits.length; i++) {
      const fruitName = blender.fruits[i];
      const color = fruitCatalog[fruitName].color;
      const x = left + 56 + (i % 3) * 70;
      const y = waterTop + 26 + Math.floor(i / 3) * 44;
      ctx.fillStyle = color;
      ctx.beginPath();
      ctx.arc(x, y, 16, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillStyle = '#1d1d1d';
      ctx.font = '10px Arial';
      ctx.fillText(fruitName.charAt(0).toUpperCase(), x - 4, y + 3);
    }
  }

  // status below blender
  ctx.fillStyle = '#11263f';
  ctx.font = 'bold 18px Arial';
  ctx.fillText(blender.isBlending ? 'Blending...' : (blender.fruits.length ? 'Ready to blend' : 'Empty blender'), left - 10, top + jarHeight + 85);
}

function drawFruitFloatingIcons() {
  const elements = document.querySelectorAll('.fruit');
  elements.forEach((el) => {
    if (el.dataset.fruit && dragState.active && dragState.element === el) return;
    el.style.position = 'static';
    el.style.left = '';
    el.style.top = '';
    el.style.zIndex = '';
  });
}

// collision of particle with rotating blade — if close to blade line, apply impulse
function handleBladeCollision(p) {
  const top = blender.y - blender.height / 2;
  const jarHeight = blender.height;
  const bladeCenterX = blender.x;
  const bladeCenterY = top + jarHeight - 20;
  const bladeLen = blender.width * 0.5;
  const angle = blender.bladeAngle || 0;

  const cos = Math.cos(angle);
  const sin = Math.sin(angle);
  const dx = p.x - bladeCenterX;
  const dy = p.y - bladeCenterY;
  const proj = dx * cos + dy * sin;
  const clamped = Math.max(-bladeLen / 2, Math.min(bladeLen / 2, proj));
  const closestX = bladeCenterX + clamped * cos;
  const closestY = bladeCenterY + clamped * sin;
  const dist = Math.hypot(p.x - closestX, p.y - closestY);
  if (dist < p.r + 4) {
    const nx = (p.x - closestX) / (dist || 1);
    const ny = (p.y - closestY) / (dist || 1);
    const dot = p.vx * nx + p.vy * ny;
    p.vx = p.vx - 1.9 * dot * nx + (sin * 0.6);
    p.vy = p.vy - 1.9 * dot * ny - (cos * 0.6);
    p.vx *= 0.9;
    p.vy *= 0.9;
  }
}

// UI helpers: save/load recipe
function saveRecipe() {
  const data = {
    fruits: blender.fruits.slice(),
    blendTime: blender.blendDuration,
    waterColor: blender.waterColor,
    waterLevel: blender.waterLevel
  };
  const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = 'smoothie_recipe.json';
  a.click();
  URL.revokeObjectURL(url);
}

function loadRecipeFile(file) {
  const reader = new FileReader();
  reader.onload = () => {
    try {
      const data = JSON.parse(reader.result);
      if (Array.isArray(data.fruits)) {
        blender.fruits = data.fruits.slice();
        document.querySelectorAll('.fruit').forEach((el) => {
          if (blender.fruits.includes(el.dataset.fruit)) {
            el.dataset.added = 'true';
            el.style.opacity = '0.6';
            el.style.pointerEvents = 'none';
          } else {
            el.dataset.added = '';
            el.style.opacity = '1';
            el.style.pointerEvents = 'auto';
          }
        });
      }
      if (data.blendTime) blender.blendDuration = Number(data.blendTime);
      if (data.waterColor) blender.waterColor = data.waterColor;
      if (typeof data.waterLevel === 'number') blender.waterLevel = data.waterLevel;
    } catch (e) {
      console.error('Failed to load recipe', e);
    }
  };
  reader.readAsText(file);
}

function update() {
  // update water particle physics
  const left = blender.x - blender.width / 2 + 18;
  const right = blender.x + blender.width / 2 - 18;
  const top = blender.y - blender.height / 2 + 8;
  const bottom = blender.y + blender.height / 2 + 6;
  // SPH-like density & forces (naive O(n^2), fine for small particle counts)
  const h = 22; // interaction radius
  const restDensity = 12.0;
  const stiffness = 1.7;
  const viscosity = 0.2;
  const dt = 0.016 * (document.getElementById('slowMotion')?.checked ? 0.5 : 1.0);

  const densities = new Array(waterParticles.length).fill(0);
  for (let i = 0; i < waterParticles.length; i++) {
    const pi = waterParticles[i];
    let dens = 0;
    for (let j = 0; j < waterParticles.length; j++) {
      const pj = waterParticles[j];
      const dx = pi.x - pj.x;
      const dy = pi.y - pj.y;
      const r = Math.hypot(dx, dy);
      if (r < h) dens += (h - r);
    }
    densities[i] = dens;
  }

  const pressures = densities.map(d => stiffness * Math.max(0, d - restDensity));

  for (let i = 0; i < waterParticles.length; i++) {
    const p = waterParticles[i];
    let fx = 0;
    let fy = 0;

    for (let j = 0; j < waterParticles.length; j++) {
      if (i === j) continue;
      const q = waterParticles[j];
      const dx = p.x - q.x;
      const dy = p.y - q.y;
      const r = Math.hypot(dx, dy) || 0.001;
      if (r < h) {
        const diff = (h - r);
        // pressure force (simple)
        const press = - (pressures[i] + pressures[j]) * 0.5;
        fx += (press * (dx / r)) * (diff * 0.002);
        fy += (press * (dy / r)) * (diff * 0.002);
        // viscosity-like velocity blending
        fx += viscosity * (q.vx - p.vx) * (diff * 0.02);
        fy += viscosity * (q.vy - p.vy) * (diff * 0.02);
      }
    }

    // gravity
    const gravity = 0.12;
    fy += gravity * (blender.isBlending ? 0.36 : 1.0);

    // integrate
    p.vx += fx * dt;
    p.vy += fy * dt;
    // damping
    p.vx *= blender.isBlending ? 0.986 : 0.995;
    p.vy *= blender.isBlending ? 0.986 : 0.995;

    p.x += p.vx * (1.0);
    p.y += p.vy * (1.0);

    // boundary - keep particles inside jar rectangle approximation
    if (p.x < left + p.r) {
      p.x = left + p.r;
      p.vx *= -0.3;
    }
    if (p.x > right - p.r) {
      p.x = right - p.r;
      p.vx *= -0.3;
    }
    if (p.y < top + p.r) {
      p.y = top + p.r;
      p.vy *= -0.3;
    }
    if (p.y > bottom - p.r) {
      p.y = bottom - p.r;
      p.vy *= -0.4;
      p.vx *= 0.9;
    }

    // blade collision
    handleBladeCollision(p);
  }

  if (blender.isBlending) {
    blender.blendProgress += 0.016;
    blender.swirlPhase += 0.12;
    const t = clamp(blender.blendProgress / blender.blendDuration, 0, 1);
    const targetColor = computeBlendColor();
    blender.waterColor = mixColors([168, 224, 255], targetColor, t);

    if (blender.choppedBits.length === 0 && blender.fruits.length > 0) {
      spawnChoppedBits();
    }

    if (blender.choppedBits.length > 0) {
      const centerX = blender.x;
      const centerY = blender.y + 25;

      blender.choppedBits.forEach((bit) => {
        const dx = bit.x - centerX;
        const dy = bit.y - centerY;
        const distance = Math.hypot(dx, dy) || 1;
        const swirlX = Math.cos(bit.angle + blender.swirlPhase) * 1.2;
        const swirlY = Math.sin(bit.angle + blender.swirlPhase) * 1.1;

        bit.x += swirlX + (dx / distance) * 0.35 + bit.driftX;
        bit.y += swirlY + (dy / distance) * 0.25 + bit.driftY;
        bit.angle += bit.spin + 0.04;

        bit.x = clamp(bit.x, centerX - 105, centerX + 105);
        bit.y = clamp(bit.y, centerY - 100, centerY + 90);
      });
    }

    if (t >= 1) {
      blender.isBlending = false;
      blender.blendProgress = 0;
      blender.swirlPhase = 0;
      // stop sound
      stopBlendSound();
    }
  }
}

function render() {
  drawBackground();
  drawBlender();
}

function animate() {
  updateDragPosition();
  update();
  render();
  requestAnimationFrame(animate);
}

function attachFruitDragHandlers() {
  const fruitEls = document.querySelectorAll('.fruit');

  window.addEventListener('pointermove', (event) => {
    if (!dragState.active || !dragState.element) return;
    if (dragState.pointerId !== null && event.pointerId !== dragState.pointerId) return;
    event.preventDefault();
    moveFruitToPointer(event.clientX, event.clientY);
  });

  window.addEventListener('pointerup', (event) => {
    if (!dragState.active || !dragState.element) return;
    if (dragState.pointerId !== null && event.pointerId !== dragState.pointerId) return;
    const point = getCanvasPoint(event.clientX, event.clientY);
    const el = dragState.element;
    if (isInsideBlender(point.x, point.y)) {
      const fruitName = el.dataset.fruit;
      addFruitToBlender(fruitName);
      // mark as added but keep visible until Blend is pressed
      el.dataset.added = 'true';
      el.style.opacity = '0.6';
      el.style.pointerEvents = 'none';
    }
    cleanupDrag(el);
  });

  window.addEventListener('pointercancel', () => {
    if (dragState.element) cleanupDrag(dragState.element);
  });

  fruitEls.forEach((el) => {
    el.addEventListener('pointerdown', (event) => {
      event.preventDefault();
      dragState.active = true;
      dragState.element = el;
      dragState.pointerId = event.pointerId;
      dragState.offsetX = 0;
      dragState.offsetY = 0;
      dragState.targetX = el.getBoundingClientRect().left;
      dragState.targetY = el.getBoundingClientRect().top;
      el.classList.add('dragging');
      moveFruitToPointer(event.clientX, event.clientY);
    });
  });
}

function cleanupDrag(el) {
  dragState.active = false;
  dragState.element = null;
  dragState.pointerId = null;
  dragState.offsetX = 0;
  dragState.offsetY = 0;
  dragState.lastX = 0;
  dragState.lastY = 0;
  if (el) {
    el.classList.remove('dragging');
    el.style.position = 'static';
    el.style.left = '';
    el.style.top = '';
    el.style.zIndex = '';
    el.style.transform = '';
  }
}

function moveFruitToPointer(clientX, clientY) {
  const el = dragState.element;
  if (!el) return;

  const rect = el.getBoundingClientRect();
  if (dragState.offsetX === 0 && dragState.offsetY === 0) {
    dragState.offsetX = clientX - rect.left;
    dragState.offsetY = clientY - rect.top;
  }

  dragState.targetX = clientX - dragState.offsetX;
  dragState.targetY = clientY - dragState.offsetY;
  dragState.lastX = clientX;
  dragState.lastY = clientY;

  el.style.position = 'fixed';
  el.style.left = `${dragState.targetX}px`;
  el.style.top = `${dragState.targetY}px`;
  el.style.zIndex = '99';
}

function updateDragPosition() {
  const el = dragState.element;
  if (!dragState.active || !el) return;

  const currentX = parseFloat(el.style.left || '0');
  const currentY = parseFloat(el.style.top || '0');
  const smoothX = lerp(currentX, dragState.targetX, 0.28);
  const smoothY = lerp(currentY, dragState.targetY, 0.28);

  el.style.left = `${smoothX}px`;
  el.style.top = `${smoothY}px`;
}

function bindButtons() {
  const blendButton = document.getElementById('blendBtn');
  const resetButton = document.getElementById('resetBtn');
  const saveRecipeBtn = document.getElementById('saveRecipeBtn');
  const loadRecipeBtn = document.getElementById('loadRecipeBtn');
  const loadRecipeInput = document.getElementById('loadRecipe');
  const foamToggle = document.getElementById('foamToggle');
  const slowMotion = document.getElementById('slowMotion');
  const blendTimeInput = document.getElementById('blendTime');

  blendButton.addEventListener('click', () => {
    if (blender.fruits.length === 0) return;
    blender.isBlending = true;
    blender.blendProgress = 0;
    blender.blendDuration = Number(blendTimeInput.value);
    blender.swirlPhase = 0;
    blender.choppedBits = [];
    // thicken the smoothie: increase particle density and reduce mobility
    for (let p of waterParticles) {
      p.sticky = 0.92;
      p.r = Math.max(2, p.r - 0.6);
    }
    // spawn extra colored particles slowly when blending
    // start blend sound
    playBlendSound();
  });

  resetButton.addEventListener('click', () => {
    resetBlender();
    document.querySelectorAll('.fruit').forEach((el) => {
      el.style.display = 'block';
    });
  });

  saveRecipeBtn.addEventListener('click', () => saveRecipe());
  loadRecipeBtn.addEventListener('click', () => loadRecipeInput.click());
  loadRecipeInput.addEventListener('change', (ev) => {
    const f = ev.target.files && ev.target.files[0];
    if (f) loadRecipeFile(f);
    ev.target.value = '';
  });

  // foam toggle and slow motion simply read their state from the DOM
  // expose to render/update via DOM checks when needed
}

window.addEventListener('load', () => {
  attachFruitDragHandlers();
  bindButtons();
  createFruitImages();
  initWaterParticles();
  animate();
});

// Simple WebAudio-based blend sound (no external file)
let audioCtx = null;
let blendNode = null;
function setupAudio() {
  if (audioCtx) return;
  try {
    audioCtx = new (window.AudioContext || window.webkitAudioContext)();
  } catch (e) {
    audioCtx = null;
  }
}

function playBlendSound() {
  setupAudio();
  if (!audioCtx) return;
  // create white-noise-like buffer
  const bufferSize = 2 * audioCtx.sampleRate;
  const noiseBuffer = audioCtx.createBuffer(1, bufferSize, audioCtx.sampleRate);
  const output = noiseBuffer.getChannelData(0);
  for (let i = 0; i < bufferSize; i++) output[i] = (Math.random() * 2 - 1) * 0.25;
  const noise = audioCtx.createBufferSource();
  noise.buffer = noiseBuffer;
  const band = audioCtx.createBiquadFilter();
  band.type = 'lowpass';
  band.frequency.value = 1200;
  noise.connect(band);
  band.connect(audioCtx.destination);
  noise.loop = true;
  noise.start();
  blendNode = { noise, band };
}

function stopBlendSound() {
  if (!blendNode) return;
  try { blendNode.noise.stop(); } catch (e) {}
  blendNode = null;
}
