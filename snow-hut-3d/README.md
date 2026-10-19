# snow hut (3D)

A quiet side game in the dream-ray engine: a first-person, Doom-like raycaster. You live in a small hut built into a cliff above a snowy valley. Keep the stove fed, keep warm, and fetch wood from the log stacks on the slope. Snow falls, the weather drifts between clear skies and blizzards, and day turns to night with stars and an aurora. Vanilla HTML/CSS/JS, no libraries, no build step.

Open `index.html` to run it, or deploy it as a GitHub Pages site (push to a repo, then Settings, Pages, deploy from the `main` branch root).

## Controls
w a s d move. Click the canvas to look with the mouse (esc releases it). Arrow keys turn and tilt. E gathers wood from a nearby stack, or feeds the stove when you stand next to it.

Add `#anything` to the URL for a different valley.

## Where things live
- `js/world.js`: seed to valley, hut, stove, pines and wood stacks
- `js/render.js`: the raycaster, lamp light, ambient light, stars and aurora, billboards
- `js/main.js`: time of day, weather, snowfall, warmth, input and drawing
