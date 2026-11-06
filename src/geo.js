// Small Web Mercator helpers (EPSG:3857 <-> WGS84 lon/lat).

const R = 6378137;

export function lonLatToMercator(lon, lat) {
  const x = (R * lon * Math.PI) / 180;
  const y = R * Math.log(Math.tan(Math.PI / 4 + (lat * Math.PI) / 360));
  return { x, y };
}

export function mercatorToLonLat(x, y) {
  const lon = (x / R) * (180 / Math.PI);
  const lat = (2 * Math.atan(Math.exp(y / R)) - Math.PI / 2) * (180 / Math.PI);
  return { lon, lat };
}

/**
 * Web Mercator inflates horizontal distances by 1/cos(latitude). To keep the relief
 * in true proportion at a given latitude, elevations must be scaled by the same factor.
 */
export function mercatorScaleFactor(lat) {
  return 1 / Math.cos((lat * Math.PI) / 180);
}
