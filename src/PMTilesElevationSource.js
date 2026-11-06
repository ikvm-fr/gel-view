/**
 * Giro3D image source that reads Terrain-RGB (Mapbox pixel packing) elevation tiles
 * straight from a remote PMTiles archive, using HTTP range requests.
 *
 * Giro3D has no native PMTiles support, but its TiledImageSource already handles
 * the XYZ tile grid, zoom-level selection and decoding. We only replace the
 * "download a tile by URL" step with a PMTiles lookup: the OpenLayers XYZ source
 * produces placeholder URLs like `pmtiles://{z}/{x}/{y}`, and `fetchData()`
 * resolves them through the PMTiles directory instead of a plain fetch().
 */
import { PMTiles } from 'pmtiles';
import XYZ from 'ol/source/XYZ.js';
import TiledImageSource from '@giro3d/giro3d/sources/TiledImageSource.js';
import MapboxTerrainFormat from '@giro3d/giro3d/formats/MapboxTerrainFormat.js';

const URL_PREFIX = 'pmtiles://';

/** Pixel size of the tiles in the archive, read from the first available tile. */
async function detectTileSize(archive, header) {
  const z = header.minZoom;
  const n = 2 ** z;
  // Use the tile at the center of the archive bounds, which is the most likely to exist.
  const lon = (header.minLon + header.maxLon) / 2;
  const lat = (header.minLat + header.maxLat) / 2;
  const x = Math.floor(((lon + 180) / 360) * n);
  const latRad = (lat * Math.PI) / 180;
  const y = Math.floor(((1 - Math.log(Math.tan(latRad) + 1 / Math.cos(latRad)) / Math.PI) / 2) * n);
  const tile = await archive.getZxy(z, x, y);
  if (!tile) {
    return 256;
  }
  const bitmap = await createImageBitmap(new Blob([tile.data]));
  const size = bitmap.width;
  bitmap.close();
  return size;
}

export default class PMTilesElevationSource extends TiledImageSource {
  /**
   * Opens the archive, reads its header and builds the source.
   *
   * @param {string} url - URL of the .pmtiles file (must allow CORS and range requests).
   * @param {object} [options]
   * @param {number} [options.maxZoom] - Optional cap on the zoom level used.
   */
  static async open(url, options = {}) {
    const archive = new PMTiles(url);
    const header = await archive.getHeader();
    const tileSize = await detectTileSize(archive, header);
    const maxZoom = Math.min(header.maxZoom, options.maxZoom ?? header.maxZoom);
    return new PMTilesElevationSource(archive, header, tileSize, header.minZoom, maxZoom);
  }

  constructor(archive, header, tileSize, minZoom, maxZoom) {
    super({
      source: new XYZ({
        url: `${URL_PREFIX}{z}/{x}/{y}`,
        projection: 'EPSG:3857',
        tileSize,
        minZoom,
        maxZoom,
      }),
      // Giro3D's decoding worker labels every blob as image/png, which makes
      // Chrome refuse WebP tiles; decoding on the main thread keeps our MIME type.
      format: new MapboxTerrainFormat({ enableWorkers: false }),
    });
    this.archive = archive;
    this.header = header;
    this.tileSize = tileSize;
  }

  /**
   * Replaces TiledImageSource's HTTP download: resolves the placeholder URL
   * through the PMTiles archive. Returns `null` when the tile is absent,
   * which Giro3D renders as "no data".
   */
  async fetchData(url, signal) {
    const [z, x, y] = url.slice(URL_PREFIX.length).split('/').map(Number);
    try {
      const tile = await this.archive.getZxy(z, x, y, signal);
      if (!tile) {
        return null;
      }
      return new Blob([tile.data], { type: 'image/webp' });
    } catch (e) {
      if (e instanceof Error && e.name === 'AbortError') {
        throw e;
      }
      console.error(`PMTiles: failed to read tile ${z}/${x}/${y}`, e);
      return null;
    }
  }
}
