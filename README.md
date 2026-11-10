# Amberfall

A playable 3D dinosaur-survival game that runs in the browser: gather, craft, hunt, tame and ride dinosaurs, build a base, and break a rival tribe's outpost.

## Play

Open `index.html` in a desktop browser (keyboard + mouse). It is one self-contained file.

To serve it locally instead:

```bash
python3 -m http.server 8080
```

Then open `http://localhost:8080/index.html`.

## Rebuild

`index.html` is generated from `src/`, `vendor/three-bundle.js` and `assets/`:

```bash
node build.js
```

## Layout

- `src/` — game code (terrain, models, gameplay, UI) and the HTML/CSS template
- `assets/` — 3D models (`.glb`) and ground texture generated with Higgsfield
- `vendor/` — three.js bundled with its GLB loader
