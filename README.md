# Grinder with Water - Prototype

Simple HTML5 Canvas prototype showing a rotating grinder interacting with water particles.

Run: open `index.html` in a browser (double-click or serve with a simple static server).

Controls:
- Space: toggle emitter
- Left/Right arrows: change grinder rotation speed
- R: reset
- Drag the grinder with mouse to move it

Blender script
- A Blender helper script is included: [blender_setup.py](blender_setup.py)
- To run inside Blender: open it in Text Editor and Run Script.
- Or from terminal: `blender --background --python blender_setup.py`

Mantaflow helper
- A Mantaflow convenience script is included: [blender_mantaflow_setup.py](blender_mantaflow_setup.py)
- Run it inside Blender or headless; it will create a domain and inflow and print manual steps.

Deploy to GitHub Pages
- To publish this folder as a GitHub Pages site, you can create a repository and push the files.
- For a user site (username.github.io): name the repository `username.github.io` and push to `main`.
- For a project site: push the site to the `gh-pages` branch and enable Pages from that branch.

I included a helper script `deploy.sh` that attempts to create the repo with the `gh` CLI
and push the site. Usage:

```bash
cd /path/to/smoothie
./deploy.sh <github-username> <repo-name>
```

If you prefer manual steps, here they are:

1) Create a new repository on GitHub (either `username.github.io` for a user site or any name for a project site).
2) In the project folder:

```bash
git init
git add -A
git commit -m "Initial site"
git remote add origin git@github.com:USERNAME/REPO.git
```

3a) For a user site:
```bash
git push -u origin main
# Then visit https://USERNAME.github.io/
```

3b) For a project site:
```bash
git checkout --orphan gh-pages
git add -A
git commit -m "Deploy to gh-pages"
git push -f origin gh-pages
git checkout main
git branch -D gh-pages
# Then visit https://USERNAME.github.io/REPO/
```



