const canvas = document.getElementById('game');
const ctx = canvas.getContext('2d');

function resize(){
  canvas.width = innerWidth;
  canvas.height = innerHeight;
}
window.addEventListener('resize', resize);
resize();

// Particles represent water droplets
const particles = [];
const GRAVITY = 0.25;

const emitter = { x: canvas.width*0.5, y: 60, rate: 8, on:true };

// UI bindings (will be populated after DOM ready)
const UI = {};

function spawn(n){
  const cap = Math.max(100, Number(UI.maxParticles?.value || 800));
  // Simplified smoothie blender simulation
  const fruitsCatalog = {
    banana: { name: 'Banana', color: [255,230,128] },
    strawberry: { name: 'Strawberry', color: [255,107,137] },
    blueberry: { name: 'Blueberry', color: [91,124,255] },
    spinach: { name: 'Spinach', color: [95,184,95] },
    mango: { name: 'Mango', color: [255,184,77] }
  };

  const blender = {
    x: canvas.width/2,
    y: canvas.height*0.58,
    width: 260,
    height: 260,
    waterLevel: 0.25, // fraction
    waterColor: [180,220,255],
    contents: [] // list of fruit keys
  };

  let blending = false;
  let blendProgress = 0;
  let blendDuration = 2.0; // seconds

  function reset(){
    blender.contents.length = 0;
    blender.waterColor = [180,220,255];
    blending = false; blendProgress = 0;
  }

  reset();

  // Drag handling for fruit DOM elements
  let dragState = null;
  function makeFruitsDraggable(){
    const fruitEls = document.querySelectorAll('.fruit');
    fruitEls.forEach(el=>{
      el.addEventListener('pointerdown', (ev)=>{
        ev.preventDefault();
        el.setPointerCapture(ev.pointerId);
        el.classList.add('dragging');
        dragState = { el, id: ev.pointerId, startX: ev.clientX, startY: ev.clientY };
        el.style.position = 'fixed';
        el.style.zIndex = 9999;
        moveDraggedElement(ev.clientX, ev.clientY);
      });
      el.addEventListener('pointermove', (ev)=>{ if(dragState && dragState.el===el) moveDraggedElement(ev.clientX, ev.clientY) });
      el.addEventListener('pointerup', (ev)=>{ if(dragState && dragState.el===el) finishDrag(ev.clientX, ev.clientY); });
      el.addEventListener('lostpointercapture', ()=>{ if(dragState && dragState.el===el) finishDrag(); });
    });
  }

  function moveDraggedElement(cx, cy){
    if(!dragState) return;
    const el = dragState.el;
    el.style.left = (cx - el.offsetWidth/2) + 'px';
    el.style.top = (cy - el.offsetHeight/2) + 'px';
  }

  function finishDrag(cx, cy){
    if(!dragState) return;
    const el = dragState.el;
    el.classList.remove('dragging');
    el.style.position = '';
    el.style.left = '';
    el.style.top = '';
    el.style.zIndex = '';

    // If dropped over blender area, add to contents (and remove element)
    if(typeof cx === 'number' && typeof cy === 'number'){
      const rect = canvas.getBoundingClientRect();
      const x = cx - rect.left;
      const y = cy - rect.top;
      if(pointInBlender(x,y)){
        const key = el.dataset.fruit;
        blender.contents.push(key);
        // mark removed visually
        el.style.opacity = 0.4; el.style.pointerEvents = 'none';
      }
    }

    dragState = null;
  }

  function pointInBlender(px,py){
    const left = blender.x - blender.width/2;
    const top = blender.y - blender.height/2;
    return px >= left && px <= left + blender.width && py >= top && py <= top + blender.height;
  }

  function lerp(a,b,t){ return a + (b-a)*t }

  function mixColors(list){
    if(list.length===0) return blender.waterColor;
    // start with base water color weighted as 1
    let r=blender.waterColor[0], g=blender.waterColor[1], b=blender.waterColor[2];
    let weight = 1;
    for(const k of list){ const c = fruitsCatalog[k].color; r += c[0]; g += c[1]; b += c[2]; weight += 1 }
    return [Math.round(r/weight), Math.round(g/weight), Math.round(b/weight)];
  }

  function update(dt){
    if(blending){
      blendProgress += dt;
      const t = Math.min(1, blendProgress / blendDuration);
      const target = mixColors(blender.contents);
      blender.waterColor = [ Math.round(lerp(blender.waterColor[0], target[0], t)), Math.round(lerp(blender.waterColor[1], target[1], t)), Math.round(lerp(blender.waterColor[2], target[2], t)) ];
      if(t>=1){ blending = false; /* keep contents but mark blended */ }
    }
  }

  function draw(){
    ctx.clearRect(0,0,canvas.width,canvas.height);

    // draw counter background/container
    const left = blender.x - blender.width/2;
    const top = blender.y - blender.height/2;
    ctx.fillStyle = '#222';
    ctx.fillRect(left-6, top-6, blender.width+12, blender.height+12);

    // glass
    ctx.fillStyle = 'rgba(255,255,255,0.04)';
    ctx.fillRect(left, top, blender.width, blender.height);
    ctx.strokeStyle = '#888'; ctx.lineWidth = 2; ctx.strokeRect(left, top, blender.width, blender.height);

    // water / smoothie inside
    const waterH = blender.height * blender.waterLevel;
    const waterTop = top + blender.height - waterH;
    const c = blender.waterColor;
    ctx.fillStyle = `rgba(${c[0]},${c[1]},${c[2]},0.95)`;
    ctx.fillRect(left+4, waterTop+4, blender.width-8, waterH-8);

    // draw blender lid / blades indicator
    ctx.save();
    ctx.translate(blender.x, top+12);
    if(blending) ctx.rotate((performance.now()/1000) * 10);
    ctx.fillStyle = '#444';
    ctx.fillRect(-40, -8, 80, 12);
    ctx.restore();

    // draw list of added fruits inside (small icons)
    ctx.fillStyle = '#fff'; ctx.font='13px Arial';
    for(let i=0;i<blender.contents.length;i++){
      const key = blender.contents[i];
      const fx = left + 12 + (i%4)*56;
      const fy = top + 8 + Math.floor(i/4)*28;
      const col = fruitsCatalog[key].color;
      ctx.fillStyle = `rgb(${col[0]},${col[1]},${col[2]})`;
      ctx.fillRect(fx, fy, 48, 20);
      ctx.fillStyle = '#111'; ctx.fillText(fruitsCatalog[key].name, fx+6, fy+14);
    }

    // instructions overlay
    ctx.fillStyle = '#fff'; ctx.font='14px Arial';
    ctx.fillText('Drag fruits here', left+12, top + blender.height + 22);
  }

  let lastTime = performance.now();
  function loop(){
    const now = performance.now();
    const dt = (now - lastTime)/1000;
    lastTime = now;
    update(dt);
    draw();
    requestAnimationFrame(loop);
  }
  requestAnimationFrame(loop);

  // bind UI
  function bindUI(){
    const blendBtn = document.getElementById('blendBtn');
    const resetBtn = document.getElementById('resetBtn');
    const blendTimeEl = document.getElementById('blendTime');
    const maxFruitsEl = document.getElementById('maxFruits');

    blendBtn.addEventListener('click', ()=>{
      if(blender.contents.length===0) return;
      blending = true; blendProgress = 0; blendDuration = Number(blendTimeEl.value);
    });
    resetBtn.addEventListener('click', ()=>{ reset(); // restore fruit panel
      document.querySelectorAll('.fruit').forEach(el=>{ el.style.opacity=''; el.style.pointerEvents=''; });
    });
  }

  window.addEventListener('load', ()=>{ bindUI(); makeFruitsDraggable(); });
  UI.toggleEmitter = document.getElementById('toggleEmitter');
  UI.resetBtn = document.getElementById('resetBtn');
  UI.emitterRate = document.getElementById('emitterRate');
  UI.grinderSpeed = document.getElementById('grinderSpeed');
  UI.maxParticles = document.getElementById('maxParticles');

  if(UI.toggleEmitter) UI.toggleEmitter.addEventListener('click', ()=>{ emitter.on = !emitter.on; updateToggleButton() });
  if(UI.resetBtn) UI.resetBtn.addEventListener('click', reset);
  if(UI.emitterRate) UI.emitterRate.addEventListener('input', (e)=>{ emitter.rate = Number(e.target.value) });
  if(UI.grinderSpeed) UI.grinderSpeed.addEventListener('input', (e)=>{ grinder.speed = Number(e.target.value) });
  if(UI.maxParticles) UI.maxParticles.addEventListener('input', ()=>{});

  // initialize UI values
  if(UI.emitterRate) UI.emitterRate.value = emitter.rate;
  if(UI.grinderSpeed) UI.grinderSpeed.value = grinder.speed;
  updateToggleButton();
}

window.addEventListener('load', ()=>{
  bindUI();
});

// mouse to move grinder
let dragging = false;
canvas.addEventListener('mousedown', (ev)=>{ dragging = true; moveGrinder(ev) });
canvas.addEventListener('mousemove', (ev)=>{ if(dragging) moveGrinder(ev) });
canvas.addEventListener('mouseup', ()=>{ dragging = false });
canvas.addEventListener('mouseleave', ()=>{ dragging = false });

function moveGrinder(ev){
  const rect = canvas.getBoundingClientRect();
  grinder.x = ev.clientX - rect.left;
  grinder.y = ev.clientY - rect.top;
}
