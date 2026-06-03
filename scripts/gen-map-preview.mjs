// ---------------------------------------------------------------------------
// gen-map-preview.mjs — emit a self-contained HTML preview of the baked geo
// maps, so framing can be eyeballed in a browser WITHOUT publishing the
// package or deploying. Reads the generated data modules and inlines them.
//
//   node scripts/gen-map-preview.mjs [output.html]
//
// Renders the world + europe choropleths with the same heat-fill logic as
// SdGeoMap.vue, against a couple of sample datasets (incl. a sparse
// gleis56-like one) plus a topology / dataset toggle. Pure HTML+SVG, no deps.
// ---------------------------------------------------------------------------

import { readFileSync, writeFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, resolve } from 'node:path';

const __dirname = dirname(fileURLToPath(import.meta.url));
const DATA = resolve(__dirname, '../src/data');
const OUT = process.argv[2] || resolve(__dirname, '../map-preview.html');

function load(file, prefix) {
  const txt = readFileSync(resolve(DATA, file), 'utf8');
  const viewBox = txt.match(new RegExp(`${prefix}_VIEWBOX = '([^']+)'`))[1];
  const arr = txt.match(/_COUNTRIES[^=]*=\s*(\[[\s\S]*\n\]);/)[1];
  return { viewBox, countries: JSON.parse(arr) };
}

const world = load('world-countries.ts', 'WORLD');
const europe = load('europe-countries.ts', 'EUROPE');

// Sample datasets keyed by ISO alpha-2 (as Umami's country metric reports).
const datasets = {
  'gleis56 (sparse — CH/DE/ES)': { CH: 61, DE: 4, ES: 1 },
  'spread across Europe': { CH: 61, DE: 40, ES: 22, FR: 35, IT: 18, GB: 28, AT: 14, NL: 9, PL: 6, SE: 5, GR: 4, PT: 3 },
  'worldwide': { CH: 61, DE: 40, US: 80, BR: 22, IN: 30, JP: 12, AU: 9, ZA: 7, FR: 25, GB: 28, CN: 15 },
};

const payload = { world, europe, datasets };

const html = `<!doctype html>
<html lang="en">
<head>
<meta charset="utf-8" />
<meta name="viewport" content="width=device-width, initial-scale=1" />
<title>SdGeoMap framing preview</title>
<style>
  :root { --orange:#FF8C42; --stroke:#d6d8e0; --base:#eef0f4; --muted:#6b7280; }
  * { box-sizing: border-box; }
  body { margin:0; font-family: system-ui, -apple-system, Segoe UI, Roboto, sans-serif; color:#1f2430; background:#fafbfc; }
  header { padding:18px 24px; border-bottom:1px solid #e7e9ee; }
  h1 { font-size:18px; margin:0 0 4px; }
  p.sub { margin:0; color:var(--muted); font-size:13px; }
  .controls { display:flex; gap:10px; flex-wrap:wrap; padding:16px 24px; align-items:center; }
  .controls .group { display:flex; gap:6px; align-items:center; }
  .controls label { font-size:12px; color:var(--muted); margin-right:4px; }
  button, select { font:inherit; font-size:13px; padding:6px 12px; border:1px solid var(--stroke); border-radius:8px; background:#fff; cursor:pointer; }
  button.active { background:var(--orange); color:#fff; border-color:var(--orange); }
  .stage { padding:8px 24px 32px; }
  .card { background:#fff; border:1px solid #e7e9ee; border-radius:12px; padding:16px; max-width:1000px; }
  .maprow { display:grid; grid-template-columns: 2fr 1fr; gap:20px; }
  .mapwrap { position:relative; width:100%; }
  svg { width:100%; height:auto; display:block; }
  .side h3 { font-size:12px; text-transform:uppercase; letter-spacing:.04em; color:var(--muted); margin:0 0 10px; }
  .side .row { display:flex; justify-content:space-between; font-size:14px; padding:3px 0; }
  .legend { position:absolute; bottom:8px; left:8px; display:flex; gap:6px; align-items:center; font-size:10px; color:var(--muted); }
  .legend .bar { width:64px; height:6px; border-radius:3px; background:linear-gradient(to right, rgba(255,140,66,.3), rgba(255,140,66,.95)); }
  .attr { position:absolute; bottom:4px; right:6px; font-size:10px; color:#aab; }
  .meta { font-size:12px; color:var(--muted); margin-top:10px; }
  path { stroke:var(--stroke); stroke-width:0.5; stroke-linejoin:round; }
  path.data { stroke:#e8761f; stroke-width:0.6; cursor:pointer; }
</style>
</head>
<body>
<header>
  <h1>SdGeoMap framing preview</h1>
  <p class="sub">Static preview of the baked Natural Earth choropleth — no build, no deploy. Switch topology and sample data to check the frame.</p>
</header>
<div class="controls">
  <div class="group"><label>Map</label>
    <button data-topo="europe" class="active">Europe</button>
    <button data-topo="world">World</button>
  </div>
  <div class="group"><label>Sample data</label>
    <select id="dataset"></select>
  </div>
</div>
<div class="stage">
  <div class="card">
    <div class="maprow">
      <div class="mapwrap">
        <div id="map"></div>
        <div class="legend"><span>−</span><span class="bar"></span><span>+</span></div>
        <div class="attr">Natural Earth</div>
      </div>
      <div class="side">
        <h3 id="side-title">Top countries</h3>
        <div id="side-list"></div>
      </div>
    </div>
    <div class="meta" id="meta"></div>
  </div>
</div>
<script>
const DATA = ${JSON.stringify(payload)};
let topo = 'europe';
let dsName = Object.keys(DATA.datasets)[0];

const names = (() => { try { return new Intl.DisplayNames(['en'], { type:'region' }); } catch { return null; } })();
function countryName(code){ try { return names ? (names.of(code) || code) : code; } catch { return code; } }

function heat(v, max){ return Math.min(0.9, 0.35 + Math.sqrt(v/max)*0.55); }

function render(){
  const t = DATA[topo];
  const ds = DATA.datasets[dsName];
  const max = Math.max(1, ...Object.values(ds));
  const [, , w, h] = t.viewBox.split(' ').map(Number);
  let paths = '';
  for (const c of t.countries){
    const v = ds[c.code] || 0;
    const fill = v>0 ? 'var(--orange)' : 'var(--base)';
    const op = v>0 ? heat(v, max) : 1;
    const cls = v>0 ? 'data' : '';
    const title = v>0 ? '<title>'+c.name+': '+v+'</title>' : '';
    paths += '<path class="'+cls+'" d="'+c.path+'" fill="'+fill+'" fill-opacity="'+op+'">'+title+'</path>';
  }
  document.getElementById('map').innerHTML =
    '<svg viewBox="'+t.viewBox+'" role="img" aria-label="map">'+paths+'</svg>';

  const rows = Object.entries(ds).sort((a,b)=>b[1]-a[1]);
  document.getElementById('side-list').innerHTML =
    rows.map(([code,v])=>'<div class="row"><span>'+countryName(code)+'</span><span>'+v+'</span></div>').join('');
  document.getElementById('meta').textContent =
    'viewBox '+t.viewBox+'  ·  '+t.countries.length+' countries baked  ·  '+rows.length+' with sample traffic';
}

document.querySelectorAll('[data-topo]').forEach(b=>b.onclick=()=>{
  topo=b.dataset.topo;
  document.querySelectorAll('[data-topo]').forEach(x=>x.classList.toggle('active', x===b));
  render();
});
const sel = document.getElementById('dataset');
Object.keys(DATA.datasets).forEach(k=>{ const o=document.createElement('option'); o.value=k; o.textContent=k; sel.appendChild(o); });
sel.onchange=()=>{ dsName=sel.value; render(); };
render();
</script>
</body>
</html>`;

writeFileSync(OUT, html);
console.log(`Wrote ${OUT} (${(html.length / 1024).toFixed(0)} KB)`);
