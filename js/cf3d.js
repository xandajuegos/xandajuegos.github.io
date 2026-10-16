// Modelos 3D de Casino Fortuna dentro del sitio. Reutiliza tal cual el motor del juego (js/game3d/).
import { createCharacterViewer } from './game3d/character3d.js';

// Sin .glb: todos los personajes se construyen en código (modelos de cubos), así no hace falta copiar archivos.
const MODELS = {};
const ACCENT = { oveja: '#35c6ff', perro: '#ffd23f', gato: '#b266ff', borrego: '#ff4b63', vaca: '#4be06a', zorro: '#ff8a2a', jirafa: '#ffc93d' };
const RARITY = { crupier: '#4be06a', chef: '#4be06a', pirata: '#35a8ff', cumple: '#35a8ff', real: '#b266ff', astronauta: '#b266ff', mago: '#ff4b63', fortuna: '#ffd23f' };

window.XA = window.XA || {};

/* Pone un visor 3D dentro de `el`. Si está lejos de la pantalla espera a que se vea, y lo libera al salir
   (los navegadores limitan los contextos WebGL, y un perfil puede tener decenas de skins). */
function mount(el, charId, skin, opts) {
  opts = opts || {};
  var accent = opts.accent || (skin ? RARITY[skin] : ACCENT[charId]) || ACCENT[charId] || '#35c6ff';
  var viewer = null, token = 0;
  function on() {
    if (viewer || token) return;
    var my = ++token;
    createCharacterViewer(el, { modelUrl: MODELS[charId] || '', accent: accent, charId: charId, skin: skin || null, platform: opts.platform !== false, zoom: opts.zoom || 1 })
      .then(function (v) { if (my !== token || !el.isConnected) { v.dispose(); return; } viewer = v; })
      .catch(function () { token = 0; });
  }
  function off() { token = 0; if (viewer) { viewer.dispose(); viewer = null; } el.querySelectorAll('canvas').forEach(function (c) { c.remove(); }); }
  if ('IntersectionObserver' in window) {
    var io = new IntersectionObserver(function (es) { es.forEach(function (e) { e.isIntersecting ? on() : off(); }); }, { rootMargin: '120px' });
    io.observe(el);
    return function () { io.disconnect(); off(); };
  }
  on();
  return off;
}

XA.cf3d = { mount: mount, accent: ACCENT, rarity: RARITY };
window.dispatchEvent(new Event('cf3d-ready'));
