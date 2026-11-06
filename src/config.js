// Static configuration: data sources, extent, presets and color ramps.

/** Smart Maps Global Elevation Tiles (GEL), hosted by Source Cooperative. */
export const GEL_URL = 'https://data.source.coop/smartmaps/gel/gel.pmtiles';

/** Japan bounding box (WGS84): Ryukyu & Yonaguni to Hokkaido & southern Kurils. */
export const JAPAN_BOUNDS = { west: 122, east: 149, south: 24, north: 46 };

export const IMAGERY = {
  gsi: {
    label: 'GSI Seamless Photo',
    url: 'https://cyberjapandata.gsi.go.jp/xyz/seamlessphoto/{z}/{x}/{y}.jpg',
    maxZoom: 18,
    attribution:
      '<a href="https://maps.gsi.go.jp/development/ichiran.html" target="_blank" rel="noopener">地理院タイル (GSI Japan)</a>',
  },
  esri: {
    label: 'Esri World Imagery',
    url: 'https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}',
    maxZoom: 19,
    attribution:
      'Imagery © <a href="https://www.esri.com/" target="_blank" rel="noopener">Esri</a>, Maxar, Earthstar Geographics',
  },
  osm: {
    label: 'OpenStreetMap',
    url: 'https://tile.openstreetmap.org/{z}/{x}/{y}.png',
    maxZoom: 19,
    attribution:
      '© <a href="https://www.openstreetmap.org/copyright" target="_blank" rel="noopener">OpenStreetMap</a> contributors',
  },
};

/**
 * Camera presets. `heading` is the direction the camera looks (degrees clockwise from north),
 * `tilt` is the angle from vertical (0 = straight down), `distance` is in meters.
 */
export const PRESETS = {
  'All Japan': { lon: 136.0, lat: 35.0, distance: 4200000, heading: 0, tilt: 35 },
  'Mt. Fuji': { lon: 138.7274, lat: 35.3606, distance: 60000, heading: 330, tilt: 65 },
  'Japanese Alps': { lon: 137.65, lat: 36.3, distance: 160000, heading: 0, tilt: 55 },
  'Aso caldera': { lon: 131.08, lat: 32.88, distance: 55000, heading: 20, tilt: 55 },
  Sakurajima: { lon: 130.66, lat: 31.585, distance: 30000, heading: 300, tilt: 55 },
  Daisetsuzan: { lon: 142.85, lat: 43.66, distance: 70000, heading: 10, tilt: 55 },
  Okinawa: { lon: 127.95, lat: 26.5, distance: 220000, heading: 30, tilt: 50 },
};

/**
 * Hypsometric color ramps, as [position 0..1, color] stops over the colormap range.
 * The "Topo" ramp keeps values <= 0 m blue so the sea reads as water.
 */
export const RAMPS = {
  Topo: [
    [0.0, '#2c6aa0'],
    [0.012, '#2c6aa0'],
    [0.014, '#3f7f46'],
    [0.08, '#6fa35a'],
    [0.2, '#c9c27a'],
    [0.38, '#b98a52'],
    [0.6, '#8c6a55'],
    [0.8, '#bdb3ad'],
    [1.0, '#ffffff'],
  ],
  Viridis: [
    [0.0, '#440154'],
    [0.25, '#3b528b'],
    [0.5, '#21918c'],
    [0.75, '#5ec962'],
    [1.0, '#fde725'],
  ],
  Magma: [
    [0.0, '#000004'],
    [0.25, '#51127c'],
    [0.5, '#b73779'],
    [0.75, '#fc8961'],
    [1.0, '#fcfdbf'],
  ],
  Grayscale: [
    [0.0, '#000000'],
    [1.0, '#ffffff'],
  ],
};
