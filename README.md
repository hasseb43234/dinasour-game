# Amberfall

A playable 3D dinosaur-survival game that runs in the browser: gather, craft, hunt, tame and ride dinosaurs, build a base, and break a rival tribe's outpost.

## Play

Open `index.html` in a desktop browser (keyboard + mouse). It is one self-contained file.

To serve it locally instead:

```bash
python3 -m http.server 8080
```

Then open `http://localhost:8080/index.html`.

## Controls

WASD move · mouse look · Shift sprint · Space jump / fly up · hold LMB to charge an attack · E interact / tame · F ride · Q weapon wheel · G emote wheel · Tab craft · B build · V first / third person · T rally your tribe · P menu.

## Rebuild

`index.html` is generated from `src/`, `vendor/three-bundle.js` and `assets/`:

```bash
node build.js
```

## Layout

- `src/` — game code (terrain, models, gameplay, UI) and the HTML/CSS template
- `assets/` — 3D models (`.glb`, including the rigged male and female characters) and ground texture generated with Higgsfield
- `vendor/` — three.js bundled with its GLB loader
