// ---------------------------------------------------------------------------
// gen-geo.mjs — bake country-level choropleth geometry for SdGeoMap.
//
// Produces two committed data modules consumed (lazily) by SdGeoMap.vue:
//   src/data/world-countries.ts   — whole world, Natural Earth projection
//   src/data/europe-countries.ts  — European subset, LAEA-Europe projection
//
// Source: Natural Earth (public domain) via the `world-atlas` TopoJSON
// redistribution. Country polygons are projected to flat SVG paths at build
// time so the runtime ships zero geo/projection dependencies — the component
// only imports the baked path strings (same approach as the Swiss map).
//
// Keys are ISO 3166-1 alpha-2 (CH, DE, US, …) to match exactly what Umami's
// `country` metric returns, so the dashboard fills by code with no remapping.
//
// Run:  node scripts/gen-geo.mjs   (from the package root, after pnpm install)
// Dev-only: world-atlas, topojson-client, d3-geo, i18n-iso-countries are
// devDependencies and never enter the published dist.
// ---------------------------------------------------------------------------

import { readFileSync, writeFileSync, mkdirSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, resolve } from 'node:path';
import { feature } from 'topojson-client';
import { geoNaturalEarth1, geoAzimuthalEqualArea, geoPath } from 'd3-geo';
import countries from 'i18n-iso-countries';

const __dirname = dirname(fileURLToPath(import.meta.url));
const ROOT = resolve(__dirname, '..');
const DATA_DIR = resolve(ROOT, 'src/data');
const ATLAS = resolve(ROOT, 'node_modules/world-atlas');

// Geographic Europe for the EU lens — MUST stay identical to EUROPE_CC in
// the API's geo-scope.ts, so the map and the scoped numbers agree on what
// "Europe" means.
const EUROPE_CC = new Set([
  'AL', 'AD', 'AT', 'BA', 'BE', 'BG', 'BY', 'CH', 'CY', 'CZ', 'DE', 'DK', 'EE',
  'ES', 'FI', 'FO', 'FR', 'GB', 'GE', 'GG', 'GI', 'GR', 'HR', 'HU', 'IE', 'IM',
  'IS', 'IT', 'JE', 'LI', 'LT', 'LU', 'LV', 'MC', 'MD', 'ME', 'MK', 'MT', 'NL',
  'NO', 'PL', 'PT', 'RO', 'RS', 'RU', 'SE', 'SI', 'SK', 'SM', 'UA', 'VA', 'XK',
]);

// Europe display window as four CORNER anchor points (not a polygon: a polygon's
// projected geodesic edges bow outward and over-size the frame). lon -25..41,
// lat 33..72 covers Iberia→Scandinavia and Iceland→Ukraine, with the south
// edge at 33° so the Mediterranean rim (southern Spain, Sicily, Crete, Cyprus)
// is fully in-frame rather than clipped. Members that spill past it — Russia's
// Asian sprawl, Norway's Svalbard, Portugal's Azores — are trimmed by the
// projection clipExtent so the frame stays tight on the populated continent
// while still colouring every in-window member.
const EUROPE_ANCHORS = {
  type: 'MultiPoint',
  coordinates: [[-25, 33], [41, 33], [-25, 72], [41, 72]],
};

/** Round every number in an SVG path 'd' string to 1 decimal to shrink output. */
function roundPath(d) {
  return d.replace(/-?\d+\.?\d*/g, (n) => {
    const v = Math.round(parseFloat(n) * 10) / 10;
    return String(v);
  });
}

/** Load a world-atlas resolution as a GeoJSON FeatureCollection of countries. */
function loadCountries(resolutionFile) {
  const topo = JSON.parse(readFileSync(resolve(ATLAS, resolutionFile), 'utf8'));
  return feature(topo, topo.objects.countries).features;
}

/** Map a world-atlas numeric id to ISO alpha-2; null when unmappable. */
function alpha2Of(f) {
  const a2 = countries.numericToAlpha2(String(f.id));
  return a2 ? a2.toUpperCase() : null;
}

/**
 * Project a set of features into an SVG-path table.
 *
 * Framing:
 *   - fitTo omitted → fitSize the projection to the picked geometry, into the
 *     given width × height (world: show every country).
 *   - fitTo given (a GeoJSON object of anchor points) → fit the projection to
 *     those anchors, derive height from the projected bounds so there's no
 *     wasted margin, and clipExtent the output to the box so out-of-window
 *     geometry trims at the edge instead of sprawling.
 *
 * @returns { viewBox, rows: [{code,name,path}] }
 */
function bake(features, projectionFactory, { width, height, keep, fitTo, pad = 8 }) {
  const picked = features
    .map((f) => ({ f, code: alpha2Of(f) }))
    .filter((x) => x.code && (!keep || keep.has(x.code)));

  const fc = { type: 'FeatureCollection', features: picked.map((x) => x.f) };
  const proj = projectionFactory();
  let h = height;

  if (fitTo) {
    // Derive height from the anchor aspect so the box hugs the content.
    proj.fitWidth(width - 2 * pad, fitTo);
    const b = geoPath(proj).bounds(fitTo);
    h = Math.ceil(b[1][1] - b[0][1]) + 2 * pad;
    proj.fitExtent([[pad, pad], [width - pad, h - pad]], fitTo);
    proj.clipExtent([[0, 0], [width, h]]);
  } else {
    proj.fitSize([width, height], fc);
  }

  const path = geoPath(proj);
  const rows = [];
  for (const { f, code } of picked) {
    const d = path(f);
    if (!d) continue; // fully clipped / off-projection — skip empty paths
    rows.push({
      code,
      name: countries.getName(code, 'en') ?? f.properties.name ?? code,
      path: roundPath(d),
    });
  }
  rows.sort((a, b) => a.code.localeCompare(b.code));
  return { viewBox: `0 0 ${width} ${h}`, rows };
}

function emit(file, constPrefix, viewBox, rows) {
  const body = rows.map((r) => JSON.stringify(r)).join(',\n  ');
  const ts = `// AUTO-GENERATED by scripts/gen-geo.mjs — do not edit by hand.
// Country geometry — Natural Earth (public domain) via world-atlas.
export interface GeoCountry { code: string; name: string; path: string; }
export const ${constPrefix}_VIEWBOX = '${viewBox}';
export const ${constPrefix}_COUNTRIES: GeoCountry[] = [
  ${body}
];
`;
  mkdirSync(DATA_DIR, { recursive: true });
  writeFileSync(resolve(DATA_DIR, file), ts);
  console.log(`  ${file}: ${rows.length} countries, viewBox ${viewBox}`);
}

console.log('Baking geo data from Natural Earth (world-atlas)…');

// World — 110m is plenty at world scale and keeps the chunk light.
// Natural Earth projection: the canonical, low-distortion choropleth look.
const world = loadCountries('countries-110m.json');
const w = bake(world, geoNaturalEarth1, { width: 1000, height: 500 });
emit('world-countries.ts', 'WORLD', w.viewBox, w.rows);

// Europe — 50m for crisper borders at the zoomed-in scale. LAEA-Europe
// (EPSG:3035 parameters: lon_0=10, lat_0=52) is the standard equal-area
// projection for European thematic maps. Framed + clipped to EUROPE_ANCHORS.
const europe50 = loadCountries('countries-50m.json');
const e = bake(europe50, () => geoAzimuthalEqualArea().rotate([-10, -52]), {
  width: 820,
  keep: EUROPE_CC,
  fitTo: EUROPE_ANCHORS,
});
emit('europe-countries.ts', 'EUROPE', e.viewBox, e.rows);

console.log('Done.');
