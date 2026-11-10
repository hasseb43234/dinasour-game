// Bundles src/* + three.js (+GLTFLoader) + assets/*.glb into one self-contained index.html
const fs = require('fs'), path = require('path');
const src = f => fs.readFileSync(path.join(__dirname, 'src', f), 'utf8');
const adir = path.join(__dirname, 'assets');
const assets = {}; if (fs.existsSync(adir)) for (const f of fs.readdirSync(adir)) if (f.endsWith('.glb')) assets[f.slice(0, -4)] = fs.readFileSync(path.join(adir, f)).toString('base64');
const imgs = {}; if (fs.existsSync(adir)) for (const f of fs.readdirSync(adir)) if (f.endsWith('.jpg')) imgs[f.slice(0, -4)] = fs.readFileSync(path.join(adir, f)).toString('base64');
const game = ['core.js', 'assets.js', 'models.js', 'game.js', 'world2.js', 'ui.js'].map(src).join('\n');
const wrapped = `(()=>{\nconst ASSET_DATA=${JSON.stringify(assets)};const ASSET_IMG=${JSON.stringify(imgs)};\n${game}\nwindow.__af={get S(){return S},P,renderer,gate,EV,GLB,dinos,humans,K,get mode(){return mode},fns:{startCharge,releaseCharge,craft,openMenu,openCraft,closeOverlay,setBuild,placePiece,tame,mountDino,startEvent,damage,spawnDino,enterCreator,startPlay,wheelOpen,wheelMove,wheelClose,openCrate}};\nboot();\n})();`;
const esc = s => s.replace(/<\/script/gi, '<\\/script');
const html = src('template.html').replace('/*THREE*/', () => esc(fs.readFileSync(path.join(__dirname, 'vendor/three-bundle.js'), 'utf8'))).replace('/*GAME*/', () => esc(wrapped));
fs.writeFileSync(path.join(__dirname, 'index.html'), html);
console.log('index.html', (html.length / 1048576).toFixed(2) + ' MB', Object.keys(assets).join(','));
