# dream ray

A prototype of a dream-world explorer with a Doom-like look: a low-resolution grid raycaster where every cell has its own floor and ceiling height, flat sprites that always face you, and distance fog. Levels are generated from a seed. Vanilla HTML/CSS/JS, no libraries, no build step.

Open `index.html` to run it, or deploy it as a GitHub Pages site.

## Deploy to GitHub Pages
1. Create a repository and push these files to the root of the `main` branch.
2. In the repository, open Settings, then Pages.
3. Under Build and deployment, choose "Deploy from a branch", select `main` and `/ (root)`, and save.
4. After a minute the site is live at `https://<your-username>.github.io/<repo-name>/`.

The seed is stored in the URL hash, so a link like `.../#moss` opens that exact level.

## Controls
w a s d move, e picks up or sets down a lamp. Click the canvas to look with the mouse (esc releases it). Arrow keys turn and tilt.

## Where things live
- `js/gen.js`: seed to mood, layout, heights, colors and sprites
- `js/render.js`: the raycaster, lamp light and billboard sprites
- `js/npc.js`: lamps, figures (light-seeking, personal distance, curiosity, idling) and their movement
- `js/main.js`: input, movement, UI
