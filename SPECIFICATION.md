# Grinder With Water — Specification

Overview
- A small HTML5 web game where a rotating grinder interacts with water inside a container.
- Target: playable prototype for browser (desktop-first), published on GitHub Pages.

Goals
- Demonstrate believable water behavior using a particle-based approximation (Canvas2D).
- Provide interactive grinder mechanics (rotation, collisions) that affect water droplets.
- Simple, responsive UI and basic performance controls so it runs smoothly across machines.

Core Features
- Water particle system: spawn, gravity, basic viscosity-like damping, pooling at container bottom.
- Grinder: central hub + multiple blades; blades rotate and deflect droplets on collision.
- Controls: start/stop emitter, adjust emitter rate, grinder rotation speed, reset scene, drag grinder.
- UI: HUD showing particle count and simple control panel (sliders/buttons).
- Deployment: one-folder static site served via GitHub Pages.

Functional Requirements
- FR1: The emitter spawns particles at adjustable rate (0–~4000 cap).
- FR2: Particles respond to gravity, collide with container bounds and grinder, and eventually remove when life expires.
- FR3: Grinder rotation is user-adjustable (including reversing direction) and continuous when active.
- FR4: Player can drag the grinder to reposition it inside the container.
- FR5: Game must run at interactive frame rates (>30 FPS) on typical laptop browsers by default.

Non-Functional Requirements
- NFR1: Use only client-side tech: HTML, CSS, JavaScript (no server runtime required for gameplay).
- NFR2: Graceful degradation on low-end devices — provide particle caps and lower default particle counts.
- NFR3: Code should be modular and well-documented; easy to extend with better fluid sims later.

Gameplay Mechanics
- Emitter spawns droplets with random offset and initial velocity.
- Particles have simple life value and reduce on strong collisions with grinder blades.
- On blade collision, particles gain outward velocity (deflection) and may be removed after multiple hits.
- Particles accumulate at bottom and can be dispersed by active grinder motion.

UI / Controls
- Buttons: Toggle Emitter, Reset.
- Sliders: Emitter Rate, Grinder Speed, Max Particles.
- Keyboard: Space (toggle emitter), Left/Right arrows (modify speed), R (reset).
- Mouse: Click+drag to move grinder hub.

Assets
- No external binary assets required for prototype — grinder and particles are drawn with Canvas primitives.
- Optional: small UI icons and sound effects (ogg/mp3) for collisions and UI clicks for later polish.

Tech Design
- Rendering: HTML5 Canvas 2D. Draw particles as filled circles or radial gradients for nicer visuals.
- Simulation loop: fixed timestep update + render per animation frame. Limit total particles for performance.
- Collision: approximate blade geometry as line segments (innerR→outerR) and test point-to-segment distance.
- Optimization: spatial hashing/grid if particle count grows large; particle pooling to avoid GC churn.

Project Structure
- `index.html` — entry and UI layout.
- `style.css` — styles for UI and canvas.
- `main.js` — core simulation and UI bindings.
- `README.md` — instructions and deployment notes.
- `deploy.sh` — helper for GitHub Pages deployment.
- `SPECIFICATION.md` — this file.

Deployment (GitHub Pages)
- Option A — User site: push to `username.github.io` repository `main` branch.
- Option B — Project site: push site files to `gh-pages` branch; enable Pages from that branch.
- Use `deploy.sh` helper or follow manual steps in `README.md`.

Testing & Validation
- Manual tests: verify start/stop emitter, slider changes reflect immediately, drag works, grinder affects particles.
- Performance tests: confirm 30+ FPS at default particle settings; test high particle cap with device fallback.

Future Enhancements
- Replace particle approximation with SPH or WebGL-based GPGPU fluid for more realistic water.
- Add splash particles and sounds on strong collisions.
- Save/Load presets and shareable links for configurations.
- Mobile touchscreen support and responsive layout improvements.

Acceptance Criteria
- AC1: Game runs from `index.html` in modern Chrome/Firefox/Edge and the main controls function.
- AC2: Grinder collides with and deflects particles visibly.
- AC3: Repo includes `deploy.sh` and README with GitHub Pages instructions.

Contact / Notes
- Files are in this folder; to iterate, update `main.js` and test locally via `python3 -m http.server 8000`.
