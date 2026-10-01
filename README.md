# Astrocartography Reader

Maps your planetary lines from your birth details. A static, client-side site built with Vite and deployed to Cloudflare at https://astrocart.brianagude.com/.

## Commands

```sh
npm install
npm run dev      # local dev server
npm run build    # production build into dist/
npm run preview  # serve the production build locally
npm run deploy   # build and deploy by hand (normally not needed)
```

Pushing to `main` on GitHub deploys automatically through Cloudflare's Git integration.

## Layout

```
index.html          page markup
src/
  main.js           entry point: wires the modules, runs the calculation
  state.js          shared UI state
  time.js           birth time and time zone handling
  lines.js          the astronomy: where each planet's lines fall
  map.js            world map, zoom, planet tabs
  key.js            map legend and "how to read the lines" diagrams
  planets.js        planet grid and the record that opens beneath it
  planet-art.js     halftone planet drawings
  place.js          city picker and place check
  storage.js        saves the form to localStorage
  util.js           small shared helpers
  data/             planets, angles, readings, cities, world map outlines
  styles/           CSS, one file per section (index.css sets the order)
public/             favicons, social image, robots.txt, sitemap.xml
wrangler.jsonc      Cloudflare config (serves dist/ on the custom domain)
```
