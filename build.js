// Bundles src/* + three.js (+GLTFLoader) + assets/*.glb into one self-contained index.html
const fs = require('fs'), path = require('path');
const src = f => fs.readFileSync(path.join(__dirname, 'src', f), 'utf8');
const adir = path.join(__dirname, 'assets');
const assets = {}; if (fs.existsSync(adir)) for (const f of fs.readdirSync(adir)) if (f.endsWith('.glb')) assets[f.slice(0, -4)] = fs.readFileSync(path.join(adir, f)).toString('base64');
const imgs = {}; if (fs.existsSync(adir)) for (const f of fs.readdirSync(adir)) if (f.endsWith('.jpg')) imgs[f.slice(0, -4)] = fs.readFileSync(path.join(adir, f)).toString('base64');
const game = ['core.js', 'assets.js', 'models.js', 'game.js', 'world2.js', 'ui.js', 'net.js'].map(src).join('\n');
const wrapped = `(()=>{\nconst ASSET_DATA=${JSON.stringify(assets)};const ASSET_IMG=${JSON.stringify(imgs)};\n${game}\nwindow.__af={get S(){return S},P,scene,camera,renderer,gate,EV,GLB,dinos,humans,K,get mode(){return mode},RIGS,NET,fns:{startCharge,releaseCharge,craft,openMenu,openCraft,closeOverlay,setBuild,placePiece,tame,mountDino,startEvent,damage,spawnDino,enterCreator,startPlay,wheelOpen,wheelMove,wheelClose,openCrate}};\nboot();\n})();`;
const esc = s => s.replace(/<\/script/gi, '<\\/script');
const cover = fs.existsSync(path.join(adir, 'cover-url.txt')) ? fs.readFileSync(path.join(adir, 'cover-url.txt'), 'utf8').trim() : '';
const html = src('template.html').replace('/*OGIMG*/', () => cover).replace('/*THREE*/', () => esc(fs.readFileSync(path.join(__dirname, 'vendor/three-bundle.js'), 'utf8'))).replace('/*GAME*/', () => esc(wrapped));
fs.writeFileSync(path.join(__dirname, 'index.html'), html);
console.log('index.html', (html.length / 1048576).toFixed(2) + ' MB', Object.keys(assets).join(','));

// Hosted build: small page + separate script and model files (for hosts that cap single-file size)
const site = path.join(__dirname, 'site'); fs.rmSync(site, { recursive: true, force: true }); fs.mkdirSync(path.join(site, 'assets'), { recursive: true });
for (const f of fs.readdirSync(adir)) if (f.endsWith('.glb') || f.endsWith('.jpg')) fs.copyFileSync(path.join(adir, f), path.join(site, 'assets', f));
fs.copyFileSync(path.join(__dirname, 'vendor/three-bundle.js'), path.join(site, 'three-bundle.js'));
fs.writeFileSync(path.join(site, 'game.js'), wrapped.replace(/const ASSET_DATA=.*?;const ASSET_IMG=.*?;\n/s, () => `const ASSET_LIST=${JSON.stringify(Object.keys(assets))};const ASSET_IMG=${JSON.stringify(Object.fromEntries(Object.keys(imgs).map(k => [k, 'assets/' + k + '.jpg'])))};\n`));
fs.writeFileSync(path.join(site, 'index.html'), src('template.html').replace('/*OGIMG*/', () => cover).replace('<script>/*THREE*/</script>', '<script src="three-bundle.js"></script>').replace('<script>/*GAME*/</script>', '<script src="game.js"></script>'));
console.log('site/', fs.readdirSync(site).join(','), (fs.statSync(path.join(site, 'game.js')).size / 1024).toFixed(0) + ' KB game.js');
