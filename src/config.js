// Static configuration: data sources, regions, presets and color ramps.

/** Smart Maps Global Elevation Tiles (GEL), hosted by Source Cooperative. */
export const GEL_URL = 'https://data.source.coop/smartmaps/gel/gel.pmtiles';

/** Latitude limit of the Web Mercator square. */
export const MERCATOR_MAX_LAT = 85.0511287798066;

export const IMAGERY = {
  esri: {
    label: 'Esri World Imagery',
    url: 'https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}',
    maxZoom: 19,
    attribution:
      'Imagery © <a href="https://www.esri.com/" target="_blank" rel="noopener">Esri</a>, Maxar, Earthstar Geographics',
  },
  gsi: {
    label: 'GSI Seamless Photo (Japan)',
    url: 'https://cyberjapandata.gsi.go.jp/xyz/seamlessphoto/{z}/{x}/{y}.jpg',
    maxZoom: 18,
    attribution:
      '<a href="https://maps.gsi.go.jp/development/ichiran.html" target="_blank" rel="noopener">地理院タイル (GSI Japan)</a>',
  },
  osm: {
    label: 'OpenStreetMap',
    url: 'https://tile.openstreetmap.org/{z}/{x}/{y}.png',
    maxZoom: 19,
    attribution:
      '© <a href="https://www.openstreetmap.org/copyright" target="_blank" rel="noopener">OpenStreetMap</a> contributors',
  },
};

/*
 * Camera presets. `heading` is the direction the camera looks (degrees clockwise from north),
 * `tilt` is the angle from vertical (0 = straight down), `distance` is ground meters.
 */

/**
 * Regions the viewer can be restricted to. The first one is the default.
 * Selected with `?region=<key>`.
 */
export const REGIONS = {
  world: {
    label: 'World',
    bounds: { west: -180, east: 180, south: -MERCATOR_MAX_LAT, north: MERCATOR_MAX_LAT },
    imagery: 'esri',
    exaggeration: 3,
    maxExaggeration: 50,
    tintMax: 6000,
    maxDistance: 80000000,
    presets: {
      'Whole world': { lon: 20, lat: 10, distance: 52000000, heading: 0, tilt: 15 },
      'Himalaya — Everest': { lon: 86.925, lat: 27.9881, distance: 90000, heading: 0, tilt: 60 },
      Alps: { lon: 7.6, lat: 45.95, distance: 220000, heading: 10, tilt: 55 },
      'Andes — Aconcagua': { lon: -70.0109, lat: -32.6532, distance: 120000, heading: 90, tilt: 60 },
      'Grand Canyon': { lon: -112.11, lat: 36.1, distance: 45000, heading: 20, tilt: 60 },
      Kilimanjaro: { lon: 37.3556, lat: -3.0674, distance: 70000, heading: 330, tilt: 60 },
      Iceland: { lon: -18.6, lat: 64.9, distance: 600000, heading: 0, tilt: 40 },
      Japan: { lon: 137.5, lat: 36.0, distance: 1800000, heading: 0, tilt: 40 },
    },
  },
  japan: {
    label: 'Japan',
    // Ryukyu & Yonaguni to Hokkaido & the southern Kurils.
    bounds: { west: 122, east: 149, south: 24, north: 46 },
    imagery: 'gsi',
    exaggeration: 1.5,
    maxExaggeration: 10,
    tintMax: 3800,
    maxDistance: 7000000,
    presets: {
      'All Japan': { lon: 136.0, lat: 35.0, distance: 3400000, heading: 0, tilt: 35 },
      'Mt. Fuji': { lon: 138.7274, lat: 35.3606, distance: 60000, heading: 330, tilt: 65 },
      'Japanese Alps': { lon: 137.65, lat: 36.3, distance: 160000, heading: 0, tilt: 55 },
      'Aso caldera': { lon: 131.08, lat: 32.88, distance: 55000, heading: 20, tilt: 55 },
      Sakurajima: { lon: 130.66, lat: 31.585, distance: 30000, heading: 300, tilt: 55 },
      Daisetsuzan: { lon: 142.85, lat: 43.66, distance: 70000, heading: 10, tilt: 55 },
      Okinawa: { lon: 127.95, lat: 26.5, distance: 180000, heading: 30, tilt: 50 },
    },
  },
};

/**
 * Hypsometric color ramps as [stop, color] pairs.
 * - relative ramps: stops are positions 0..1 over the current min..max range;
 * - absolute ramps: stops are elevations in meters (so the coastline stays at 0 m
 *   whatever the range).
 */
export const RAMPS = {
  Topo: {
    absolute: true,
    stops: [
      [-50, '#2c6aa0'],
      [0, '#2c6aa0'],
      [1, '#3f7f46'],
      [300, '#6fa35a'],
      [800, '#c9c27a'],
      [1500, '#b98a52'],
      [2500, '#8c6a55'],
      [3500, '#bdb3ad'],
      [5000, '#ffffff'],
    ],
  },
  Viridis: {
    stops: [
      [0.0, '#440154'],
      [0.25, '#3b528b'],
      [0.5, '#21918c'],
      [0.75, '#5ec962'],
      [1.0, '#fde725'],
    ],
  },
  Magma: {
    stops: [
      [0.0, '#000004'],
      [0.25, '#51127c'],
      [0.5, '#b73779'],
      [0.75, '#fc8961'],
      [1.0, '#fcfdbf'],
    ],
  },
  Grayscale: {
    stops: [
      [0.0, '#000000'],
      [1.0, '#ffffff'],
    ],
  },
};
