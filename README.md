# gel-view

3D visualization of [Smart Maps Global Elevation Tiles (GEL)](https://source.coop/smartmaps/gel), worldwide or restricted to Japan, rendered with [Giro3D](https://giro3d.org).

**Live:** https://ikvm-fr.github.io/gel-view/

## What it does

- Streams elevation straight from the public `gel.pmtiles` archive on Source Cooperative
  (`https://data.source.coop/smartmaps/gel/gel.pmtiles`, ~182 GB, CC0). HTTP range requests
  fetch only the tiles in view.
- Decodes the WebP Terrain-RGB tiles (`h = -10000 + (R·65536 + G·256 + B)·0.1`) into a Giro3D
  elevation layer on a flat Web Mercator 3D map.
- Two regions, switchable in the panel or with `?region=`:
  - **World** (default): the whole Web Mercator square (±85°), Esri World Imagery, presets for
    Everest, the Alps, Aconcagua, the Grand Canyon, Kilimanjaro, Iceland and Japan.
  - **Japan** (`?region=japan`): 122°–149°E, 24°–46°N, GSI Seamless Photo aerial imagery,
    Japanese presets.
- Imagery can be switched between Esri World Imagery, GSI Seamless Photo (Japan) and OpenStreetMap.
- Settings panel:
  - vertical exaggeration
  - hillshade: sun azimuth and altitude, intensity, z-factor
  - imagery: opacity, brightness, contrast, saturation
  - hypsometric tint with color ramps
  - contour lines
  - camera presets for the selected region

"Exaggeration 1×" means true proportions at the latitude the camera looks at. Web Mercator
stretches horizontal distances by 1/cos(latitude), so elevations are scaled by the same factor.
The factor is recomputed as the camera moves.

GEL detail: NASADEM (zoom 6–12, ~30 m) covers 60°N–56°S. Elsewhere only the coarse Global Map
levels (zoom 2–5) exist.

## Development

```bash
npm install
npm run dev      # http://localhost:5173
npm run build    # outputs dist/
```

Another PMTiles archive in the same encoding can be loaded with `?pmtiles=<url>`.
The server must allow CORS and range requests.

## Code

| File | Purpose |
|---|---|
| `src/PMTilesElevationSource.js` | Giro3D `TiledImageSource` that reads tiles from a PMTiles archive instead of URLs |
| `src/main.js` | Scene, layers, camera and constraints |
| `src/gui.js` | lil-gui settings panel |
| `src/config.js` | Data URLs, regions with their presets, color ramps |

## Deployment

`.github/workflows/pages.yml` builds with Vite and deploys `dist/` to GitHub Pages on every push to `main`.

## Data credits

- Elevation: Smart Maps Global Elevation Tiles, UN Smart Maps Group (CC0), derived from NASADEM and Global Map
- Imagery: 地理院タイル (Geospatial Information Authority of Japan); Esri World Imagery; © OpenStreetMap contributors
