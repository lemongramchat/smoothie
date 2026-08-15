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
  blendDuration: 2
};

const dragState = {
  active: false,
  element: null,
  pointerId: null,
  x: 0,
  y: 0
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
  document.querySelectorAll('.fruit').forEach((el) => {
    el.style.opacity = '1';
    el.style.pointerEvents = 'auto';
    el.style.display = 'block';
  });
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

function drawBlender() {
  const left = blender.x - blender.width / 2;
  const top = blender.y - blender.height / 2;
  const jarWidth = blender.width;
  const jarHeight = blender.height;

  // realistic tall bottle shape
  ctx.fillStyle = '#d9e2ed';
  ctx.beginPath();
  ctx.moveTo(left + 30, top + 10);
  ctx.lineTo(left + 30, top + 32);
  ctx.quadraticCurveTo(left + 10, top + 48, left + 10, top + 82);
  ctx.lineTo(left + 10, top + jarHeight - 28);
  ctx.quadraticCurveTo(left + 10, top + jarHeight + 8, left + 36, top + jarHeight + 8);
  ctx.lineTo(left + jarWidth - 36, top + jarHeight + 8);
  ctx.quadraticCurveTo(left + jarWidth - 10, top + jarHeight + 8, left + jarWidth - 10, top + jarHeight - 28);
  ctx.lineTo(left + jarWidth - 10, top + 82);
  ctx.quadraticCurveTo(left + jarWidth - 10, top + 48, left + jarWidth - 30, top + 32);
  ctx.lineTo(left + jarWidth - 30, top + 10);
  ctx.closePath();
  ctx.fill();

  // shading and lid
  ctx.fillStyle = 'rgba(255,255,255,0.20)';
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

  // water fill
  const fillHeight = jarHeight * blender.waterLevel;
  const waterTop = top + jarHeight - fillHeight;
  ctx.fillStyle = `rgba(${blender.waterColor[0]}, ${blender.waterColor[1]}, ${blender.waterColor[2]}, 0.95)`;
  ctx.fillRect(left + 18, waterTop + 10, jarWidth - 36, fillHeight - 18);

  // bottom blade (realistic)
  ctx.fillStyle = '#dfe7f3';
  ctx.fillRect(left + 58, top + jarHeight - 18, jarWidth - 116, 12);
  ctx.fillStyle = '#b5c0d1';
  for (let i = 0; i < 5; i++) {
    const bx = left + 42 + i * 42;
    ctx.fillRect(bx, top + jarHeight - 30, 14, 26);
  }

  // chopped fruit remains in smoothie after blend starts
  if (blender.isBlending || blender.choppedBits.length > 0) {
    for (let i = 0; i < blender.choppedBits.length; i++) {
      const bit = blender.choppedBits[i];
      ctx.fillStyle = bit.color;
      ctx.fillRect(bit.x, bit.y, bit.w, bit.h);
    }
  }

  // fruit icons remain visible until the Blend button is pressed
  if (!blender.isBlending) {
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

function update() {
  if (blender.isBlending) {
    blender.blendProgress += 0.016;
    const t = clamp(blender.blendProgress / blender.blendDuration, 0, 1);
    const targetColor = computeBlendColor();
    blender.waterColor = mixColors([168, 224, 255], targetColor, t);

    if (blender.choppedBits.length === 0 && blender.fruits.length > 0) {
      blender.choppedBits = [];
      blender.fruits.forEach((fruitName, idx) => {
        const color = hexToRgb(fruitCatalog[fruitName].color);
        const baseX = blender.x - 100 + (idx % 3) * 70;
        const baseY = blender.y + 20 + Math.floor(idx / 3) * 40;
        for (let i = 0; i < 8; i++) {
          blender.choppedBits.push({
            x: baseX + (Math.random() - 0.5) * 60,
            y: baseY + (Math.random() - 0.5) * 50,
            w: 6 + Math.random() * 8,
            h: 4 + Math.random() * 8,
            color: `rgba(${color.r}, ${color.g}, ${color.b}, 0.9)`
          });
        }
      });
    }

    if (t >= 1) {
      blender.isBlending = false;
      blender.blendProgress = 0;
    }
  }
}

function render() {
  drawBackground();
  drawBlender();
}

function animate() {
  update();
  render();
  requestAnimationFrame(animate);
}

function attachFruitDragHandlers() {
  const fruitEls = document.querySelectorAll('.fruit');
  fruitEls.forEach((el) => {
    el.addEventListener('pointerdown', (event) => {
      event.preventDefault();
      dragState.active = true;
      dragState.element = el;
      dragState.pointerId = event.pointerId;
      el.classList.add('dragging');
      el.setPointerCapture(event.pointerId);
      moveFruitToPointer(event.clientX, event.clientY);
    });

    el.addEventListener('pointermove', (event) => {
      if (!dragState.active || dragState.element !== el) return;
      moveFruitToPointer(event.clientX, event.clientY);
    });

    el.addEventListener('pointerup', (event) => {
      if (!dragState.active || dragState.element !== el) return;
      const point = getCanvasPoint(event.clientX, event.clientY);
      if (isInsideBlender(point.x, point.y)) {
        const fruitName = el.dataset.fruit;
        addFruitToBlender(fruitName);
        el.style.display = 'none';
      }
      cleanupDrag(el);
    });

    el.addEventListener('pointercancel', () => cleanupDrag(el));
    el.addEventListener('lostpointercapture', () => cleanupDrag(el));
  });
}

function cleanupDrag(el) {
  dragState.active = false;
  dragState.element = null;
  dragState.pointerId = null;
  if (el) {
    el.classList.remove('dragging');
    el.style.position = 'static';
    el.style.left = '';
    el.style.top = '';
    el.style.zIndex = '';
  }
}

function moveFruitToPointer(clientX, clientY) {
  const el = dragState.element;
  if (!el) return;
  el.style.position = 'fixed';
  el.style.left = `${clientX - el.offsetWidth / 2}px`;
  el.style.top = `${clientY - el.offsetHeight / 2}px`;
  el.style.zIndex = '99';
}

function bindButtons() {
  const blendButton = document.getElementById('blendBtn');
  const resetButton = document.getElementById('resetBtn');
  const blendTimeInput = document.getElementById('blendTime');

  blendButton.addEventListener('click', () => {
    if (blender.fruits.length === 0) return;
    blender.isBlending = true;
    blender.blendProgress = 0;
    blender.blendDuration = Number(blendTimeInput.value);
    blender.choppedBits = [];
  });

  resetButton.addEventListener('click', () => {
    resetBlender();
    document.querySelectorAll('.fruit').forEach((el) => {
      el.style.display = 'block';
    });
  });
}

window.addEventListener('load', () => {
  attachFruitDragHandlers();
  bindButtons();
  animate();
});
