# dream sand

A prototype of a 2D pixel-art game about exploring procedurally generated dream worlds, built on a Noita-style falling-sand simulation. Vanilla HTML/CSS/JS, no libraries, no build step.

Open `index.html` to run it, or deploy it as a GitHub Pages site.

## Deploy to GitHub Pages
1. Create a repository and push these files to the root of the `main` branch.
2. In the repository, open Settings, then Pages.
3. Under Build and deployment, choose "Deploy from a branch", select `main` and `/ (root)`, and save.
4. After a minute the site is live at `https://<your-username>.github.io/<repo-name>/`.

Worlds are shareable by link: the seed is stored in the URL hash (for example `.../#moss`).

## Controls
a/d or arrow keys move, w/space/up jump. Left click uses the selected tool, right click digs.
1 stone, 2 sand, 3 water, 4 oil, 5 wood, 6 fire, 7 lava, 8 plant, 9 fog, 0 dig. `[` and `]` change brush size.

## Where things live
- `js/materials.js`: material table (add a material by adding an entry)
- `js/world.js`: seed to world rules (`makeConfig`) and terrain (`generate`)
- `js/sim.js`: the cellular automaton
- `js/player.js`: the walker
- `js/main.js`: rendering, input, UI
