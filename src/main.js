import { Color, MathUtils, Vector3 } from 'three';
import { MapControls } from 'three/examples/jsm/controls/MapControls.js';
import XYZ from 'ol/source/XYZ.js';

import Instance from '@giro3d/giro3d/core/Instance.js';
import CoordinateSystem from '@giro3d/giro3d/core/geographic/CoordinateSystem.js';
import Extent from '@giro3d/giro3d/core/geographic/Extent.js';
import ColorMap from '@giro3d/giro3d/core/ColorMap.js';
import ColorLayer from '@giro3d/giro3d/core/layer/ColorLayer.js';
import ElevationLayer from '@giro3d/giro3d/core/layer/ElevationLayer.js';
import Map from '@giro3d/giro3d/entities/Map.js';
import { MapLightingMode } from '@giro3d/giro3d/entities/MapLightingOptions.js';
import TiledImageSource from '@giro3d/giro3d/sources/TiledImageSource.js';

import PMTilesElevationSource from './PMTilesElevationSource.js';
import { GEL_URL, IMAGERY, RAMPS, REGIONS } from './config.js';
import { lonLatToMercator, mercatorScaleFactor, mercatorToLonLat } from './geo.js';
import { createGui } from './gui.js';

import './style.css';

const statusEl = document.getElementById('status');
const progressEl = document.getElementById('progress');
const readoutEl = document.getElementById('readout');
const attributionEl = document.getElementById('imagery-attribution');

function setStatus(text, isError = false) {
  statusEl.textContent = text;
  statusEl.classList.toggle('error', isError);
  statusEl.hidden = !text;
}

// ---------------------------------------------------------------------------
// Region (from ?region=, World by default)
// ---------------------------------------------------------------------------

const params = new URLSearchParams(window.location.search);
const regionKey = params.get('region') in REGIONS ? params.get('region') : Object.keys(REGIONS)[0];
const region = REGIONS[regionKey];

/** Reloads the page on another region, keeping the other URL parameters. */
function setRegion(key) {
  const next = new URLSearchParams(window.location.search);
  next.set('region', key);
  window.location.search = next.toString();
}

// ---------------------------------------------------------------------------
// Scene
// ---------------------------------------------------------------------------

const crs = CoordinateSystem.epsg3857;

const sw = lonLatToMercator(region.bounds.west, region.bounds.south);
const ne = lonLatToMercator(region.bounds.east, region.bounds.north);
const extent = new Extent(crs, sw.x, ne.x, sw.y, ne.y);

const instance = new Instance({
  target: 'view',
  crs,
  backgroundColor: '#0b1220',
});

const map = new Map({
  extent,
  backgroundColor: '#1d3b5a',
  terrain: { segments: 64 },
  lighting: {
    enabled: true,
    mode: MapLightingMode.Hillshade,
    hillshadeAzimuth: 315,
    hillshadeZenith: 45,
    hillshadeIntensity: 0.6,
    zFactor: 1,
    elevationLayersOnly: false,
  },
  contourLines: {
    enabled: false,
    interval: 500,
    secondaryInterval: 100,
    color: '#ffffff',
    opacity: 0.6,
    thickness: 1,
  },
});
await instance.add(map);

const camera = instance.view.camera;
const controls = new MapControls(camera, instance.domElement);

// ---------------------------------------------------------------------------
// Vertical exaggeration
//
// The map is flat (Z up), so exaggeration is a scale on its Z axis. Web Mercator
// stretches horizontal distances by 1/cos(latitude), so elevations get the same
// factor, evaluated at the latitude the camera looks at: "1×" then means true
// proportions wherever you are.
// ---------------------------------------------------------------------------

const state = { exaggeration: region.exaggeration };
let mercatorZ = 1;

function applyExaggeration() {
  map.object3d.scale.z = state.exaggeration * mercatorZ;
  map.object3d.updateMatrixWorld(true);
  instance.notifyChange(map);
}

/** Recomputes the Mercator compensation for the current camera target. */
function updateMercatorZ() {
  const { lat } = mercatorToLonLat(controls.target.x, controls.target.y);
  const factor = mercatorScaleFactor(MathUtils.clamp(lat, -80, 80));
  if (Math.abs(factor / mercatorZ - 1) > 0.005) {
    mercatorZ = factor;
    applyExaggeration();
  }
}

// ---------------------------------------------------------------------------
// Imagery (color) layers
// ---------------------------------------------------------------------------

const imageryLayers = {};
for (const [key, def] of Object.entries(IMAGERY)) {
  const layer = new ColorLayer({
    name: key,
    extent,
    source: new TiledImageSource({
      source: new XYZ({ url: def.url, crossOrigin: 'anonymous', maxZoom: def.maxZoom }),
    }),
  });
  layer.visible = false;
  imageryLayers[key] = layer;
  map.addLayer(layer).catch((e) => console.error(`Imagery layer "${key}" failed`, e));
}

function setImagery(key) {
  for (const [k, layer] of Object.entries(imageryLayers)) {
    layer.visible = k === key;
  }
  attributionEl.innerHTML = key in IMAGERY ? IMAGERY[key].attribution : '';
  instance.notifyChange(map);
}

// ---------------------------------------------------------------------------
// Hypsometric tint
// ---------------------------------------------------------------------------

/** Samples a ramp (see RAMPS in config.js) into `count` colors over [min, max]. */
function rampColors(ramp, min, max, count = 256) {
  const stops = ramp.absolute
    ? ramp.stops.map(([m, c]) => [(m - min) / (max - min), c])
    : ramp.stops;
  const colors = [];
  const b = new Color();
  for (let i = 0; i < count; i++) {
    const t = i / (count - 1);
    let k = 0;
    while (k < stops.length - 2 && t > stops[k + 1][0]) k++;
    const [t0, c0] = stops[k];
    const [t1, c1] = stops[k + 1];
    const f = t1 > t0 ? MathUtils.clamp((t - t0) / (t1 - t0), 0, 1) : 0;
    colors.push(new Color(c0).lerp(b.set(c1), f));
  }
  return colors;
}

const tintMin = -50;
const colorMap = new ColorMap({
  colors: rampColors(RAMPS.Topo, tintMin, region.tintMax),
  min: tintMin,
  max: region.tintMax,
});
colorMap.active = false;

// ---------------------------------------------------------------------------
// Elevation layer (GEL PMTiles)
// ---------------------------------------------------------------------------

const pmtilesUrl = params.get('pmtiles') ?? GEL_URL;

let elevationLayer = null;
setStatus('Opening GEL PMTiles archive…');
try {
  const source = await PMTilesElevationSource.open(pmtilesUrl);
  elevationLayer = new ElevationLayer({
    name: 'gel',
    extent,
    source,
    colorMap,
    minmax: { min: tintMin, max: region.tintMax },
    preloadImages: true,
  });
  await map.addLayer(elevationLayer);
  setStatus('');
} catch (e) {
  console.error(e);
  setStatus(`Could not load elevation data from ${pmtilesUrl}: ${e.message ?? e}`, true);
}

// ---------------------------------------------------------------------------
// Camera & controls
// ---------------------------------------------------------------------------

controls.enableDamping = true;
controls.dampingFactor = 0.15;
controls.screenSpacePanning = false;
controls.maxPolarAngle = MathUtils.degToRad(85);
controls.minDistance = 1500;
controls.maxDistance = region.maxDistance;
controls.zoomToCursor = true;
instance.view.setControls(controls);

const tmp = new Vector3();

/** Keeps the orbit target inside the region and the camera above the terrain. */
function constrainCamera() {
  const t = controls.target;
  const cx = MathUtils.clamp(t.x, extent.west, extent.east);
  const cy = MathUtils.clamp(t.y, extent.south, extent.north);
  if (cx !== t.x || cy !== t.y) {
    tmp.set(cx - t.x, cy - t.y, 0);
    t.add(tmp);
    camera.position.add(tmp);
  }
  const sample = map.getElevationFast(camera.position.x, camera.position.y);
  const ground = (sample?.elevation ?? 0) * map.object3d.scale.z;
  const minAltitude = ground + 300;
  if (camera.position.z < minAltitude) {
    camera.position.z = minAltitude;
  }
}

controls.addEventListener('change', () => {
  constrainCamera();
  updateMercatorZ();
  instance.notifyChange(camera);
});

function goTo(preset) {
  const { x, y } = lonLatToMercator(preset.lon, preset.lat);
  controls.target.set(x, y, 0);
  updateMercatorZ();
  const sample = map.getElevationFast(x, y);
  const z = (sample?.elevation ?? 0) * map.object3d.scale.z;
  // Mercator meters are larger than ground meters by 1/cos(lat); scale the distance so
  // presets frame the same ground area regardless of latitude.
  const d = preset.distance * mercatorScaleFactor(MathUtils.clamp(preset.lat, -80, 80));
  const heading = MathUtils.degToRad(preset.heading);
  const tilt = MathUtils.degToRad(preset.tilt);
  controls.target.set(x, y, z);
  camera.position.set(
    x - Math.sin(heading) * Math.sin(tilt) * d,
    y - Math.cos(heading) * Math.sin(tilt) * d,
    z + Math.cos(tilt) * d,
  );
  camera.up.set(0, 0, 1);
  controls.update();
  instance.notifyChange(camera);
}

goTo(Object.values(region.presets)[0]);

// Damping needs a per-frame update.
instance.addEventListener('before-camera-update', () => {
  if (controls.update()) instance.notifyChange(camera);
});

// ---------------------------------------------------------------------------
// Loading progress & cursor readout
// ---------------------------------------------------------------------------

// Polled rather than event-driven: the last update can end before loading flags clear.
setInterval(() => {
  const loading = instance.loading;
  progressEl.style.opacity = loading ? '1' : '0';
  progressEl.style.width = loading ? `${Math.round(instance.progress * 100)}%` : '100%';
}, 250);

const fmt = (v, pos, neg) => `${Math.abs(v).toFixed(4)}°${v >= 0 ? pos : neg}`;

let pickPending = false;
instance.domElement.addEventListener('pointermove', (ev) => {
  if (pickPending) return;
  pickPending = true;
  requestAnimationFrame(() => {
    pickPending = false;
    const picked = instance.pickObjectsAt(ev, { limit: 1, where: [map], sortByDistance: true });
    if (!picked.length) {
      readoutEl.textContent = '';
      return;
    }
    const p = picked[0].point;
    const { lon, lat } = mercatorToLonLat(p.x, p.y);
    const sample = map.getElevationFast(p.x, p.y);
    const elev = sample ? `${Math.round(sample.elevation)} m` : '—';
    readoutEl.textContent = `${fmt(lat, 'N', 'S')}  ${fmt(lon, 'E', 'W')}  ·  ${elev}`;
  });
});

// ---------------------------------------------------------------------------
// GUI
// ---------------------------------------------------------------------------

setImagery(region.imagery);

createGui({
  instance,
  map,
  state,
  regionKey,
  region,
  imageryLayers,
  elevationLayer,
  colorMap,
  rampColors,
  applyExaggeration,
  setImagery,
  setRegion,
  goTo,
});

// Exposed for debugging from the browser console.
window.gelView = { instance, map, controls, elevationLayer, imageryLayers, goTo, region };
