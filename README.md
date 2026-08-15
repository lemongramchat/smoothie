# Smoothie Blender Game

A small HTML5 game where the player drags fruit icons into a blender, presses Blend, and watches the fruits turn into chopped smoothie pieces.

Run locally:
- open `index.html` directly in the browser, or
- serve the folder with a static server such as `python3 -m http.server 8000`

Gameplay:
- Drag fruit cards from the side panel into the blender jar.
- The fruit icons stay visible until Blend is pressed.
- Press Blend to trigger chopping and swirling.
- Chopped fruit pieces stay inside the smoothie and the liquid color shifts toward the fruit colors.
- Press Reset to clear the blender.

Project notes:
- This is a static site; no server runtime is required for gameplay.
- This version is designed for GitHub Pages deployment.

Deployment:
- This repo is published to GitHub Pages through the `gh-pages` branch.
- The live site is available at: https://lemongramchat.github.io/smoothie/

Artifacts:
- `index.html` — page structure and UI
- `style.css` — layout and blender styling
- `main.js` — canvas rendering and game logic
- `SPECIFICATION.md` — game requirements and acceptance criteria
- `deploy.sh` — optional GitHub Pages helper



