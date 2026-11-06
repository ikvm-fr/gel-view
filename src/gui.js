import GUI from 'lil-gui';
import { IMAGERY, RAMPS, REGIONS } from './config.js';

/**
 * Builds the settings panel. All controls act on live Giro3D objects;
 * `instance.notifyChange(map)` asks Giro3D to re-render.
 */
export function createGui(ctx) {
  const {
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
  } = ctx;

  const redraw = () => instance.notifyChange(map);
  const gui = new GUI({ title: `GEL 3D Viewer — ${region.label}`, width: 300 });
  if (window.innerWidth < 700) gui.close();

  // --- View --------------------------------------------------------------
  const regionOptions = Object.fromEntries(Object.entries(REGIONS).map(([k, r]) => [r.label, k]));
  const view = { region: regionKey, preset: Object.keys(region.presets)[0] };
  const fView = gui.addFolder('View');
  fView.add(view, 'region', regionOptions).name('Region').onChange(setRegion);
  fView
    .add(view, 'preset', Object.keys(region.presets))
    .name('Go to')
    .onChange((name) => goTo(region.presets[name]));
  const exaggerationCtrl = fView
    .add(state, 'exaggeration', 0.5, region.maxExaggeration, 0.1)
    .name('Exaggeration ×')
    .onChange(applyExaggeration);

  // --- Hillshade -----------------------------------------------------------
  const setLighting = (patch) => {
    map.lighting = { ...map.lighting, ...patch };
    redraw();
  };
  const light = { ...map.lighting };
  const fShade = gui.addFolder('Hillshade');
  fShade.add(light, 'enabled').name('Enabled').onChange((v) => setLighting({ enabled: v }));
  fShade
    .add(light, 'hillshadeAzimuth', 0, 360, 1)
    .name('Sun azimuth °')
    .onChange((v) => setLighting({ hillshadeAzimuth: v }));
  fShade
    .add(light, 'hillshadeZenith', 5, 90, 1)
    .name('Sun altitude °')
    .onChange((v) => setLighting({ hillshadeZenith: v }));
  fShade
    .add(light, 'hillshadeIntensity', 0, 1, 0.01)
    .name('Intensity')
    .onChange((v) => setLighting({ hillshadeIntensity: v }));
  fShade
    .add(light, 'zFactor', 0.5, 10, 0.1)
    .name('Z-factor')
    .onChange((v) => setLighting({ zFactor: v }));
  fShade
    .add(light, 'elevationLayersOnly')
    .name('Tint only (not imagery)')
    .onChange((v) => setLighting({ elevationLayersOnly: v }));

  // --- Imagery -------------------------------------------------------------
  const imagery = {
    source: region.imagery,
    opacity: 1,
    brightness: 0,
    contrast: 1,
    saturation: 1,
  };
  const forEachImagery = (fn) => Object.values(imageryLayers).forEach(fn);
  const fImg = gui.addFolder('Imagery');
  const sourceOptions = { None: 'none' };
  for (const [k, v] of Object.entries(IMAGERY)) sourceOptions[v.label] = k;
  fImg.add(imagery, 'source', sourceOptions).name('Source').onChange(setImagery);
  fImg
    .add(imagery, 'opacity', 0, 1, 0.01)
    .name('Opacity')
    .onChange((v) => {
      forEachImagery((l) => (l.opacity = v));
      redraw();
    });
  fImg
    .add(imagery, 'brightness', -1, 1, 0.01)
    .name('Brightness')
    .onChange((v) => {
      forEachImagery((l) => (l.brightness = v));
      redraw();
    });
  fImg
    .add(imagery, 'contrast', 0, 3, 0.01)
    .name('Contrast')
    .onChange((v) => {
      forEachImagery((l) => (l.contrast = v));
      redraw();
    });
  fImg
    .add(imagery, 'saturation', 0, 3, 0.01)
    .name('Saturation')
    .onChange((v) => {
      forEachImagery((l) => (l.saturation = v));
      redraw();
    });

  // --- Hypsometric tint ----------------------------------------------------
  const tint = { enabled: false, ramp: 'Topo', min: colorMap.min, max: colorMap.max };
  const updateRamp = () => {
    colorMap.colors = rampColors(RAMPS[tint.ramp], colorMap.min, colorMap.max);
    redraw();
  };
  const fTint = gui.addFolder('Hypsometric tint');
  fTint
    .add(tint, 'enabled')
    .name('Enabled')
    .onChange((v) => {
      colorMap.active = v;
      // The tint is drawn below the imagery: fade the imagery so it shows.
      if (v && imagery.source !== 'none' && imagery.opacity > 0.5) {
        imagery.opacity = 0.35;
        forEachImagery((l) => (l.opacity = imagery.opacity));
        fImg.controllers.forEach((c) => c.updateDisplay());
      }
      redraw();
    });
  fTint
    .add(tint, 'ramp', Object.keys(RAMPS))
    .name('Color ramp')
    .onChange((v) => {
      updateRamp();
    });
  fTint
    .add(tint, 'min', -500, 3000, 10)
    .name('Min elevation (m)')
    .onChange((v) => {
      colorMap.min = v;
      updateRamp();
    });
  fTint
    .add(tint, 'max', 100, 9000, 10)
    .name('Max elevation (m)')
    .onChange((v) => {
      colorMap.max = v;
      updateRamp();
    });
  fTint.close();

  // --- Contour lines -------------------------------------------------------
  const contours = { ...map.contourLines };
  const setContours = (patch) => {
    map.contourLines = { ...map.contourLines, ...patch };
    redraw();
  };
  const fCont = gui.addFolder('Contour lines');
  fCont.add(contours, 'enabled').name('Enabled').onChange((v) => setContours({ enabled: v }));
  fCont
    .add(contours, 'interval', 50, 1000, 50)
    .name('Major interval (m)')
    .onChange((v) => setContours({ interval: v }));
  fCont
    .add(contours, 'secondaryInterval', 0, 500, 10)
    .name('Minor interval (m)')
    .onChange((v) => setContours({ secondaryInterval: v }));
  fCont
    .add(contours, 'opacity', 0, 1, 0.01)
    .name('Opacity')
    .onChange((v) => setContours({ opacity: v }));
  fCont
    .add(contours, 'thickness', 0.5, 4, 0.1)
    .name('Thickness')
    .onChange((v) => setContours({ thickness: v }));
  fCont.addColor(contours, 'color').name('Color').onChange((v) => setContours({ color: v }));
  fCont.close();

  // --- Advanced ------------------------------------------------------------
  const adv = { wireframe: false, tileOutlines: false, sse: map.subdivisionThreshold };
  const fAdv = gui.addFolder('Advanced');
  fAdv
    .add(adv, 'sse', 0.5, 3, 0.1)
    .name('Detail (lower = finer)')
    .onChange((v) => {
      map.subdivisionThreshold = v;
      redraw();
    });
  fAdv
    .add(adv, 'wireframe')
    .name('Wireframe')
    .onChange((v) => {
      map.wireframe = v;
      redraw();
    });
  fAdv
    .add(adv, 'tileOutlines')
    .name('Tile outlines')
    .onChange((v) => {
      map.showTileOutlines = v;
      redraw();
    });
  fAdv.close();

  if (!elevationLayer) {
    exaggerationCtrl.disable();
  }

  return gui;
}
