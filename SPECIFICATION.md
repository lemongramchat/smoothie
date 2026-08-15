# Smoothie Blender Game — Specification

Overview
- A small HTML5 web game where the player drags fruit into a blender, presses Blend, and watches the fruit turn into a colorful smoothie.
- Target: browser-based interactive prototype, published on GitHub Pages as a static site.

Goals
- Present a realistic blender silhouette with a glass jar and bottom blade.
- Keep the fruit icons visible until the player presses Blend.
- Show chopped fruit pieces as colorful fragments swirling inside the smoothie after blending begins.
- Keep the interactions simple, responsive, and easy to iterate in a static HTML/CSS/JS project.

Core Features
- Fruit tray with draggable fruit icons.
- Blender jar drawn on HTML5 Canvas with water and smoothie color.
- Fruit drag-and-drop interaction into the blender body.
- Blend button that triggers a chop and swirl animation.
- Reset button that clears the blender and returns the fruit tray to its initial state.
- Deployment as a static site on GitHub Pages.

Functional Requirements
- FR1: The user can drag fruit icons from the side panel into the blender.
- FR2: Fruit remains visible in its original form until Blend is pressed.
- FR3: Once blending starts, fruit pieces are transformed into chopped bits that move inside the smoothie.
- FR4: The smoothie color changes based on the fruit colors added to the blender.
- FR5: The blender is visually shaped like a blender with a tall jar and a bottom blade.
- FR6: Reset clears the fruit and returns the blender to its empty state.
- FR7: The app runs smoothly in modern browsers without a backend runtime.

Non-Functional Requirements
- NFR1: Use only client-side technologies: HTML, CSS, and JavaScript.
- NFR2: Keep the implementation lightweight and static so it works on GitHub Pages without build tooling.
- NFR3: Code should remain easy to edit and extend for additional fruit types, animation polish, or sound effects.

Gameplay Mechanics
- Fruit is represented by simple icon tiles with distinct colors.
- Dragging a fruit into the blender container adds that fruit to the blender state.
- Blend begins only when the player presses the Blend button and at least one fruit has been added.
- Chopped fruit pieces rotate and swirl through the liquid during the blend cycle.
- After the blend cycle completes, the pieces remain in the smoothie while the jar stays ready for another reset.

UI / Controls
- Fruit tray on the side of the screen.
- Blend button for starting the blend.
- Reset button for clearing the blender.
- Optional blending time input or timing control for polish.
- Mouse drag with pointer events for fruit placement.

Assets
- Fruit icons are generated as simple canvas/drawing primitives and color-coded UI tiles.
- No external binary assets are required for the core gameplay.

Tech Design
- Rendering: HTML5 Canvas 2D for the blender and smoothie.
- Interaction: pointer events for drag-and-drop fruit placement.
- Animation: chopped fruit bits are stored separately from the original fruit list and rendered once blending starts.
- Styling: CSS for the page layout, side tray, controls, and blender presentation.

Project Structure
- `index.html` — UI shell and fruit tray.
- `style.css` — page and blender styling.
- `main.js` — canvas drawing, state, blending logic, and drag/drop handling.
- `README.md` — local run and GitHub Pages notes.
- `deploy.sh` — optional deployment helper.
- `SPECIFICATION.md` — this file.

Deployment (GitHub Pages)
- Static site is served from the GitHub Pages branch.
- Project site URL: https://lemongramchat.github.io/smoothie/

Testing & Validation
- Manual verification: drag fruit into blender, blend, confirm chopped fruit appears, reset to empty state.
- Visual check: blender shape, blade placement, and smoothie color match the intended design.
- Browser check: confirm the page works from a static server or GitHub Pages without build steps.

Future Enhancements
- Add richer swirl physics and audio.
- Add more fruit types and layered smoothie recipes.
- Add a score, timer, or recipe challenge mode.
- Improve responsive mobile layout and touch handling.

Acceptance Criteria
- AC1: The player can drag fruit from the tray into the blender.
- AC2: Fruit stays as fruit until Blend is pressed.
- AC3: The blender has a realistic bottle-like body and bottom blade.
- AC4: Blending creates chopped fruit fragments that swirl in the smoothie.
- AC5: The app can be served as a static site on GitHub Pages.
