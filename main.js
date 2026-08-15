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
  for(let i=0;i<n && particles.length < cap;i++){
    particles.push({
      x: emitter.x + (Math.random()-0.5)*60,
      y: emitter.y + (Math.random()-0.5)*6,
      vx: (Math.random()-0.5)*1.2,
      vy: Math.random()*1,
      r: 2 + Math.random()*2,
      life: 1
    });
  }
}

// Grinder definition
const grinder = {
  x: canvas.width/2,
  y: canvas.height/2,
  innerR: 40,
  outerR: 140,
  bladeCount: 5,
  angle: 0,
  speed: 0.03,
  thickness: 18
};

function reset(){
  particles.length = 0;
  grinder.x = canvas.width/2;
  grinder.y = canvas.height/2;
  grinder.angle = 0;
}

reset();

// utility: distance from point to segment
function pointToSegmentDistance(px,py, x1,y1,x2,y2){
  const vx = x2-x1, vy = y2-y1;
  const wx = px-x1, wy = py-y1;
  const c = (wx*vx + wy*vy) / (vx*vx + vy*vy);
  const t = Math.max(0, Math.min(1, c));
  const dx = x1 + vx*t - px;
  const dy = y1 + vy*t - py;
  return Math.sqrt(dx*dx + dy*dy);
}

function update(){
  if(emitter.on) spawn(emitter.rate);

  grinder.angle += grinder.speed;

  for(let i=particles.length-1;i>=0;i--){
    const p = particles[i];
    p.vy += GRAVITY * 0.6;
    p.x += p.vx;
    p.y += p.vy;

    // walls
    if(p.x < 10){ p.x = 10; p.vx *= -0.3 }
    if(p.x > canvas.width-10){ p.x = canvas.width-10; p.vx *= -0.3 }
    if(p.y > canvas.height-10){ p.y = canvas.height-10; p.vy *= -0.35; p.vx *= 0.98 }

    // grinder collision: check against each blade segment
    for(let b=0;b<grinder.bladeCount;b++){
      const a = grinder.angle + (b * Math.PI*2 / grinder.bladeCount);
      const x1 = grinder.x + Math.cos(a) * grinder.innerR;
      const y1 = grinder.y + Math.sin(a) * grinder.innerR;
      const x2 = grinder.x + Math.cos(a) * grinder.outerR;
      const y2 = grinder.y + Math.sin(a) * grinder.outerR;
      const dist = pointToSegmentDistance(p.x,p.y, x1,y1,x2,y2);
      if(dist < grinder.thickness/2 + p.r){
        // simple response: kick particle outwards and reduce life
        const dx = p.x - grinder.x, dy = p.y - grinder.y;
        const mag = Math.sqrt(dx*dx + dy*dy) || 1;
        p.vx = (dx/mag) * (2 + Math.random()*2) + grinder.speed*20;
        p.vy = (dy/mag) * (2 + Math.random()*2) - Math.random()*2;
        p.life -= 0.25;
      }
    }

    if(p.life <= 0) particles.splice(i,1);
  }
}

function draw(){
  ctx.clearRect(0,0,canvas.width,canvas.height);

  // draw container (simple)
  ctx.fillStyle = '#111';
  ctx.fillRect(20,80, canvas.width-40, canvas.height-120);

  // draw water particles
  ctx.globalCompositeOperation = 'source-over';
  for(const p of particles){
    const grad = ctx.createRadialGradient(p.x,p.y,0,p.x,p.y,p.r*3);
    grad.addColorStop(0,'rgba(120,180,255,0.9)');
    grad.addColorStop(1,'rgba(60,110,180,0.3)');
    ctx.fillStyle = grad;
    ctx.beginPath();
    ctx.arc(p.x,p.y,p.r,0,Math.PI*2);
    ctx.fill();
  }

  // draw grinder
  ctx.save();
  ctx.translate(grinder.x, grinder.y);
  ctx.rotate(grinder.angle);

  // inner hub
  ctx.fillStyle = '#666';
  ctx.beginPath();
  ctx.arc(0,0, grinder.innerR-6, 0, Math.PI*2);
  ctx.fill();

  // blades
  for(let b=0;b<grinder.bladeCount;b++){
    const ang = b * Math.PI*2 / grinder.bladeCount;
    ctx.save();
    ctx.rotate(ang);
    ctx.fillStyle = '#888';
    ctx.beginPath();
    ctx.rect(grinder.innerR, -grinder.thickness/2, grinder.outerR-grinder.innerR, grinder.thickness);
    ctx.fill();
    ctx.restore();
  }

  ctx.restore();

  // overlay text
  ctx.fillStyle = '#fff';
  ctx.font = '14px Arial';
  ctx.fillText('Particles: ' + particles.length, 12, canvas.height - 12);
}

let running = true;
function loop(){
  if(running) update();
  draw();
  requestAnimationFrame(loop);
}
requestAnimationFrame(loop);

// controls
window.addEventListener('keydown', (e)=>{
  if(e.code === 'Space'){ emitter.on = !emitter.on; updateToggleButton() }
  if(e.code === 'ArrowLeft'){ grinder.speed = Math.max(-0.5, grinder.speed - 0.01); syncSpeedControl() }
  if(e.code === 'ArrowRight'){ grinder.speed = Math.min(0.8, grinder.speed + 0.01); syncSpeedControl() }
  if(e.key.toLowerCase() === 'r'){ reset() }
});

// UI helper functions
function updateToggleButton(){
  if(UI.toggleEmitter) UI.toggleEmitter.textContent = emitter.on ? 'Pause Emitter' : 'Resume Emitter';
}
function syncSpeedControl(){ if(UI.grinderSpeed) UI.grinderSpeed.value = grinder.speed }

function bindUI(){
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
