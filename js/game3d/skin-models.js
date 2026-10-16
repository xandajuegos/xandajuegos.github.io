// Modelos 3D de las skins. Hoy: visor "crupier" (visera verde translúcida con banda blanca).
import { THREE } from './three-lib.js';

const solid = (color) => new THREE.MeshLambertMaterial({ color });
const glass = () => new THREE.MeshLambertMaterial({ color: '#2fd66b', emissive: '#0c5a2a', transparent: true, opacity: 0.74, depthWrite: false, side: THREE.DoubleSide });

function box(parent, w, h, d, x, y, z, m) {
  const mesh = new THREE.Mesh(new THREE.BoxGeometry(w, h, d), m);
  mesh.position.set(x, y, z);
  parent.add(mesh);
  return mesh;
}

/** Ajuste por personaje, en coordenadas locales de la cabeza (vóxel):
 *  y = altura de la banda, w/d = ancho/fondo de la cabeza a rodear, cz = centro en z, h = grosor de la banda. */
export const HEAD_FIT = {
  oveja:   { y: 0.78, w: 1.68, d: 1.58, cz: 0.05, h: 0.26 },
  perro:   { y: 0.58, w: 1.72, d: 1.62, cz: 0.10, h: 0.26 },
  gato:    { y: 0.45, w: 1.82, d: 1.50, cz: 0.05, h: 0.24 },
  borrego: { y: 0.80, w: 1.70, d: 1.40, cz: 0.00, h: 0.26 },
  vaca:    { y: 0.66, w: 1.64, d: 1.46, cz: 0.00, h: 0.26 },
  zorro:   { y: 0.72, w: 1.98, d: 1.78, cz: 0.15, h: 0.26 },
  jirafa:  { y: 0.4, w: 1.3, d: 1.24, cz: 0.15, h: 0.24 },
};

/** Visor crupier: banda blanca alrededor de la frente + visera verde translúcida con borde blanco. */
export function buildVisor(fit) {
  const g = new THREE.Group();
  const { y, w, d, cz, h } = fit;
  const white = solid('#f6f5ef'), shade = solid('#dcdad0');
  const t = 0.16;
  box(g, w, h, t, 0, y, cz + d / 2, white);                 // frente
  box(g, w, h, t, 0, y, cz - d / 2, shade);                 // nuca
  box(g, t, h, d, -w / 2, y, cz, shade);                    // lados
  box(g, t, h, d, w / 2, y, cz, shade);
  box(g, w - 0.1, 0.07, t * 0.8, 0, y + h / 2 + 0.03, cz + d / 2, white); // ribete superior
  // Visera: filas escalonadas que se estrechan para dar forma redondeada
  const brim = new THREE.Group();
  brim.position.set(0, y - h / 2 + 0.04, cz + d / 2 + t / 2);
  brim.rotation.x = 0.3;
  g.add(brim);
  const rows = [[w + 0.2, 0.35], [w + 0.2, 0.35], [w - 0.15, 0.3], [w - 0.7, 0.25]];
  let z = 0;
  rows.forEach(([rw, rd], i) => {
    const cz2 = z + rd / 2;
    box(brim, rw, 0.07, rd, 0, 0, cz2, glass());
    box(brim, 0.1, 0.11, rd, -rw / 2, 0, cz2, white);      // ribete lateral
    box(brim, 0.1, 0.11, rd, rw / 2, 0, cz2, white);
    z += rd;
  });
  const last = rows[rows.length - 1];
  box(brim, last[0] + 0.1, 0.11, 0.1, 0, 0, z, white);       // ribete frontal
  box(brim, (rows[0][0]), 0.11, 0.08, 0, 0, 0.02, white);    // unión con la banda
  g.userData.skin = 'crupier';
  return g;
}

export function buildSkin(skinId, charId, headBox = null) {
  if (skinId === 'crupier') return buildVisor(HEAD_FIT[charId] || HEAD_FIT.oveja);
  if (skinId === 'real') return buildCrown(HEAD_FIT[charId] || HEAD_FIT.oveja);
  if (skinId === 'chef') return buildChefHat(HEAD_FIT[charId] || HEAD_FIT.oveja);
  if (skinId === 'pirata') return buildPirateHead(HEAD_FIT[charId] || HEAD_FIT.oveja, charId);
  if (skinId === 'mago') return buildWizardHat(HEAD_FIT[charId] || HEAD_FIT.oveja);
  if (skinId === 'fortuna') return buildHalo(HEAD_FIT[charId] || HEAD_FIT.oveja);
  if (skinId === 'astronauta') return buildHelmet(HEAD_FIT[charId] || HEAD_FIT.oveja, headBox);
  if (skinId === 'cumple') return buildPartyHead(HEAD_FIT[charId] || HEAD_FIT.oveja, charId);
  return null;
}

/** Piezas de cuerpo de la skin (capa, cetro), en coordenadas del modelo vóxel. Null si la skin solo lleva cabeza. */
export function buildSkinBody(skinId, charId) {
  if (skinId === 'real') return buildRoyalBody(charId);
  if (skinId === 'pirata') return buildPirateBody(charId);
  if (skinId === 'mago') return buildWizardBody(charId);
  if (skinId === 'fortuna') return buildFortuneBody(charId);
  if (skinId === 'astronauta') return buildAstronautBody(charId);
  return null;
}

/* ======================= Skin "real" (Épica): corona, cetro y capa ======================= */
const GOLD = '#ffc928', GOLD2 = '#d99a0b', RED = '#c4122f', RED2 = '#8f0c22', ERMINE = '#f6f5ef', SPOT = '#1a1a26';
const goldMat = (c = GOLD) => new THREE.MeshLambertMaterial({ color: c, emissive: '#5a3a00' });

/** Palos de la baraja como vóxeles (filas de una cuadrícula 6×N). */
const SUITS = {
  heart:   { c: '#ff3b5c', rows: ['XX..XX', 'XXXXXX', 'XXXXXX', '.XXXX.', '..XX..'] },
  diamond: { c: '#ff9a1f', rows: ['..XX..', '.XXXX.', 'XXXXXX', 'XXXXXX', '.XXXX.', '..XX..'] },
  club:    { c: '#2ee07a', rows: ['..XX..', '..XX..', 'XXXXXX', 'XXXXXX', '..XX..', '.XXXX.'] },
  spade:   { c: '#5aa8ff', rows: ['..XX..', '.XXXX.', 'XXXXXX', 'XXXXXX', '..XX..', '.XXXX.'] },
};
function suitJewel(kind, size, depth = 0.1) {
  const { c, rows } = SUITS[kind];
  const g = new THREE.Group();
  const m = new THREE.MeshLambertMaterial({ color: c, emissive: c, emissiveIntensity: 0.35 });
  const cell = size / 6;
  rows.forEach((row, r) => {
    let x = 0;
    while (x < row.length) {
      if (row[x] !== 'X') { x++; continue; }
      let e = x; while (e < row.length && row[e] === 'X') e++;
      box(g, (e - x) * cell, cell, depth, ((x + e) / 2 - 3) * cell, (rows.length / 2 - r - 0.5) * cell, 0, m);
      x = e;
    }
  });
  return g;
}

/** Corona dorada rodeando la cabeza; las joyas del frente son los cuatro palos. */
export function buildCrown(fit) {
  const g = new THREE.Group();
  const { w, d, cz } = fit;
  const y = fit.y + 0.12, bh = 0.26, t = 0.16;
  const W = w + 0.12, D = d + 0.12;
  const gold = goldMat(), gold2 = goldMat(GOLD2);
  box(g, W, bh, t, 0, y, cz + D / 2, gold);
  box(g, W, bh, t, 0, y, cz - D / 2, gold2);
  box(g, t, bh, D, -W / 2, y, cz, gold2);
  box(g, t, bh, D, W / 2, y, cz, gold2);
  box(g, W - 0.2, 0.12, D - 0.2, 0, y + bh / 2 - 0.02, cz, solid(RED));          // cojín rojo
  box(g, W + 0.06, 0.06, t + 0.04, 0, y - bh / 2 + 0.02, cz + D / 2, gold2);      // ribete
  // Puntas escalonadas
  const tooth = (x, z, big, rotY = 0) => {
    const tg = new THREE.Group();
    tg.position.set(x, y + bh / 2, z);
    tg.rotation.y = rotY;
    box(tg, 0.4, 0.14, t, 0, 0.07, 0, gold);
    box(tg, 0.26, 0.14 * big, t, 0, 0.14 + 0.07 * big, 0, gold);
    box(tg, 0.1, 0.1, 0.1, 0, 0.3 + 0.14 * big - 0.02, 0, solid('#ffffff'));
    g.add(tg);
  };
  const fz = cz + D / 2, bz = cz - D / 2;
  tooth(-W / 2 + 0.25, fz, 1); tooth(0, fz, 1.5); tooth(W / 2 - 0.25, fz, 1);
  tooth(0, bz, 1.3);
  tooth(-W / 2, cz, 1.1, Math.PI / 2); tooth(W / 2, cz, 1.1, Math.PI / 2);
  // Palos al frente
  ['heart', 'diamond', 'club', 'spade'].forEach((k, i) => {
    const j = suitJewel(k, 0.3, 0.1);
    j.position.set((i - 1.5) * (W - 0.3) / 3, y, fz + t / 2 + 0.03);
    g.add(j);
  });
  g.userData.skin = 'real';
  return g;
}

/** Dado con puntos, apoyado sobre una esquina. */
function buildDie(size) {
  const g = new THREE.Group();
  box(g, size, size, size, 0, 0, 0, solid('#fbfaf5'));
  const pm = solid('#c4122f'), k = size * 0.26, ps = size * 0.17, o = size / 2 + 0.01;
  const L = { 1: [[0, 0]], 2: [[-1, 1], [1, -1]], 3: [[-1, 1], [0, 0], [1, -1]], 4: [[-1, 1], [1, 1], [-1, -1], [1, -1]], 5: [[-1, 1], [1, 1], [0, 0], [-1, -1], [1, -1]], 6: [[-1, 1], [1, 1], [-1, 0], [1, 0], [-1, -1], [1, -1]] };
  const faces = [[1, 'z', 1], [6, 'z', -1], [2, 'x', 1], [5, 'x', -1], [3, 'y', 1], [4, 'y', -1]];
  for (const [n, ax, sg] of faces) {
    for (const [a, b] of L[n]) {
      const dim = { x: [0.04, ps, ps], y: [ps, 0.04, ps], z: [ps, ps, 0.04] }[ax];
      const pos = { x: [sg * o, b * k, a * k], y: [a * k, sg * o, b * k], z: [a * k, b * k, sg * o] }[ax];
      box(g, dim[0], dim[1], dim[2], pos[0], pos[1], pos[2], pm);
    }
  }
  return g;
}

/** Cetro dorado con anillos y un dado en la punta en lugar de esfera. */
function buildScepter(x, z, top) {
  const g = new THREE.Group();
  g.position.set(x, 0, z);
  const gold = goldMat(), gold2 = goldMat(GOLD2);
  box(g, 0.2, top, 0.2, 0, top / 2, 0, gold);
  [0.25, top * 0.5, top - 0.45].forEach((yy) => box(g, 0.34, 0.14, 0.34, 0, yy, 0, gold2));
  box(g, 0.5, 0.16, 0.5, 0, top - 0.1, 0, gold2);
  // Garras que sujetan el dado
  for (const [sx, sz] of [[-1, -1], [1, -1], [-1, 1], [1, 1]]) box(g, 0.1, 0.34, 0.1, sx * 0.24, top + 0.1, sz * 0.24, gold);
  const die = new THREE.Group();
  die.position.set(0, top + 0.55, 0);
  die.rotation.set(Math.PI / 5, Math.PI / 4, 0, 'YXZ');
  die.add(buildDie(0.62));
  g.add(die);
  return g;
}

/* ======================= Skin "chef" (Rara): gorro de cocinero ======================= */
export function buildChefHat(fit) {
  const g = new THREE.Group();
  const { w, d, cz } = fit;
  const y = fit.y + 0.1;
  const lit = (c) => new THREE.MeshLambertMaterial({ color: c, emissive: '#7a8094' });
  const white = lit('#ffffff'), shade = lit('#e4e8f2'), line = lit('#cfd5e6');
  const bw = w + 0.05, bd = d + 0.05;
  box(g, bw, 0.4, bd, 0, y, cz, shade);                                   // banda
  box(g, bw + 0.04, 0.06, bd + 0.04, 0, y - 0.18, cz, line);
  // Cuerpo plisado
  box(g, bw - 0.1, 0.5, bd - 0.1, 0, y + 0.43, cz, white);
  for (const sx of [-0.5, -0.17, 0.17, 0.5]) box(g, 0.05, 0.5, bd - 0.06, sx * (bw - 0.1), y + 0.43, cz, line);
  // Hongo superior (más ancho que la banda)
  box(g, bw + 0.3, 0.55, bd + 0.3, 0, y + 0.95, cz, white);
  for (const [sx, sz] of [[-1, -1], [1, -1], [-1, 1], [1, 1]]) box(g, 0.34, 0.5, 0.34, sx * (bw + 0.2) / 2, y + 1.02, cz + sz * (bd + 0.2) / 2, shade);
  box(g, bw - 0.1, 0.3, bd - 0.1, 0, y + 1.35, cz, white);
  box(g, 0.5, 0.2, 0.5, 0.1, y + 1.55, cz - 0.1, shade);
  g.userData.skin = 'chef';
  return g;
}

/* ======================= Skin "pirata" (Ultra rara): sombrero, parche, loro y sable ======================= */
// Ojo (en coordenadas de la cabeza) y caja de la cabeza a la altura de los ojos, por personaje.
const EYE = {
  oveja:   { x: 0.38, y: 0.12, z: 0.88, front: true,  w: 1.36, d: 1.3, cz: 0.25 },
  perro:   { x: 0.42, y: 0.22, z: 0.86, front: true,  w: 1.66, d: 1.56, cz: 0.1 },
  gato:    { x: 0.44, y: 0.14, z: 0.76, front: true,  w: 1.56, d: 1.4, cz: 0.1 },
  borrego: { x: 0.76, y: 0.1,  z: 0.4,  front: false, w: 1.5, d: 1.6, cz: 0.25 },
  vaca:    { x: 0.76, y: 0.18, z: 0.35, front: false, w: 1.5, d: 1.6, cz: 0.25 },
  zorro:   { x: 0.55, y: 0.26, z: 1.01, front: true,  w: 1.9, d: 1.7, cz: 0.15 },
  jirafa:  { x: 0.5, y: 0.16, z: 0.76, front: true,  w: 1.25, d: 1.2, cz: 0.15 },
};
const SKULL = ['.XXX.', 'XXXXX', 'X.X.X', 'XXXXX', '.X.X.'];

function buildPirateHead(fit, charId) {
  const g = new THREE.Group();
  const e = EYE[charId] || EYE.oveja;
  const black = solid('#17171f'), black2 = solid('#2a2a36'), gold = goldMat(), white = solid('#f6f5ef');
  // Parche en el ojo del lado visible (+x) con su tira inclinada
  const px = e.front ? e.x : e.x + 0.06;
  if (e.front) box(g, 0.56, 0.52, 0.16, px, e.y, e.z + 0.08, black);
  else box(g, 0.16, 0.52, 0.52, px, e.y, e.z, black);
  const strap = new THREE.Group();
  strap.position.set(0, e.y + 0.1, e.cz);
  strap.rotation.z = 0.32;
  const sw = e.w + 0.1, sd = e.d + 0.1, st = 0.1, sh = 0.1;
  box(strap, sw, sh, st, 0, 0, sd / 2, black);
  box(strap, sw, sh, st, 0, 0, -sd / 2, black);
  box(strap, st, sh, sd, -sw / 2, 0, 0, black);
  box(strap, st, sh, sd, sw / 2, 0, 0, black);
  g.add(strap);
  // Sombrero bicornio: media luna de rebanadas que suben hacia las puntas
  const { w, d, cz } = fit;
  const y0 = fit.y + 0.14;
  const W2 = w + 1.3, D2 = d + 0.5, n = 7, slw = W2 / (2 * n + 1);
  for (let i = -n; i <= n; i++) {
    const t = Math.abs(i) / n;
    const dep = D2 * (1 - 0.45 * Math.pow(t, 1.4));
    const yy = y0 + 0.1 + t * t * 0.62;
    box(g, slw + 0.01, 0.28, dep, i * slw, yy, cz, i % 2 ? black : black2);
    box(g, slw + 0.01, 0.1, 0.07, i * slw, yy + 0.04, cz + dep / 2, gold);      // ribete frontal
  }
  box(g, w + 0.05, 0.7, d + 0.05, 0, y0 + 0.4, cz, black);                        // copa
  box(g, w - 0.2, 0.1, d - 0.2, 0, y0 + 0.78, cz, black2);
  // Placa con la calavera, al frente de la copa
  const fz = cz + D2 / 2 - 0.08;
  box(g, 0.95, 0.75, 0.12, 0, y0 + 0.52, fz, black2);
  box(g, 1.03, 0.06, 0.14, 0, y0 + 0.92, fz, gold);
  const cell = 0.13;
  SKULL.forEach((row, r) => {
    for (let c = 0; c < row.length; c++) if (row[c] === 'X') box(g, cell, cell, 0.07, (c - 2) * cell, y0 + 0.72 - r * cell, fz + 0.08, white);
  });
  g.userData.skin = 'pirata';
  return g;
}

function buildParrot() {
  const g = new THREE.Group();
  const red = solid('#e8283c'), blue = solid('#2f7bff'), yel = solid('#ffd23f'), wht = solid('#ffffff'), beak = solid('#2a2a36'), eye = solid('#0a0a10');
  box(g, 0.5, 0.6, 0.45, 0, 0, 0, red);                    // cuerpo
  box(g, 0.44, 0.44, 0.44, 0, 0.45, 0.06, red);            // cabeza
  box(g, 0.14, 0.2, 0.1, 0.18, 0.5, 0.3, wht);             // mejilla
  box(g, 0.1, 0.1, 0.1, 0.2, 0.55, 0.3, eye);
  box(g, 0.16, 0.2, 0.28, 0, 0.4, 0.35, beak);             // pico
  box(g, 0.1, 0.32, 0.36, 0.3, -0.02, -0.04, blue);        // ala
  box(g, 0.1, 0.12, 0.36, 0.3, 0.16, -0.04, yel);
  box(g, 0.16, 0.7, 0.2, 0, -0.5, -0.32, blue);            // cola
  box(g, 0.1, 0.5, 0.14, 0.1, -0.7, -0.4, red);
  return g;
}

function buildCutlass(x, z) {
  const g = new THREE.Group();
  g.position.set(x, 0, z);
  const gold = goldMat(), steel = solid('#d8e0ee'), steel2 = solid('#aeb9cf'), wood = solid('#5a3418');
  // Clavada con la punta en el suelo, empuñadura arriba; la hoja se curva un poco
  [[0.08, 0.5, 0.0], [0.2, 0.5, 0.04], [0.32, 0.5, 0.1], [0.44, 0.5, 0.18]].forEach(([w, h, o], i) => {
    box(g, 0.16, h, 0.3 - i * 0.04, 0, 0.25 + i * h * 0.98, o * 0.6, i % 2 ? steel2 : steel);
  });
  box(g, 0.16, 0.5, 0.18, 0, 2.5, 0.2, wood);               // empuñadura
  box(g, 0.2, 0.12, 0.8, 0, 2.2, 0.15, gold);                // guarda
  box(g, 0.22, 0.2, 0.22, 0, 2.82, 0.2, gold);               // pomo
  return g;
}

function buildPirateBody(charId) {
  const c = ROYAL[charId] || ROYAL.oveja;
  const g = new THREE.Group();
  const [sx, sz] = c.scepter;
  g.add(buildCutlass(-sx, sz - 0.6));
  const parrot = buildParrot();
  if (c.mode === 'drape') parrot.position.set(0.55, c.top + 0.5, -0.5);
  else parrot.position.set(c.tw + 0.45, c.neck - 0.2, c.cz - 0.1);
  parrot.rotation.y = 0.3;
  g.add(parrot);
  g.userData.skin = 'pirata';
  return g;
}

/* Medidas de cada modelo vóxel: mode 'drape' (cuadrúpedos: capa sobre el lomo) o 'hang' (erguidos: capa a la espalda). */
const ROYAL = {
  oveja:   { mode: 'drape', top: 3.55, hw: 1.8, z0: -1.6, z1: 1.0, drop: 1.4, scepter: [2.2, 1.2, 3.3] },
  borrego: { mode: 'drape', top: 3.93, hw: 1.12, z0: -1.95, z1: 1.0, drop: 1.7, scepter: [1.65, 2.0, 3.7] },
  vaca:    { mode: 'drape', top: 3.9, hw: 1.12, z0: -1.95, z1: 1.0, drop: 1.6, scepter: [1.65, 2.0, 3.7] },
  perro:   { mode: 'hang', neck: 2.95, tw: 0.78, cz: -0.1, back: -0.82, hips: -1.9, bottom: 0.75, scepter: [-1.45, 1.3, 3.3] },
  gato:    { mode: 'hang', neck: 2.9, tw: 0.64, cz: -0.15, back: -0.74, hips: -1.75, bottom: 0.75, scepter: [-1.35, 1.3, 3.2] },
  zorro:   { mode: 'drape', top: 2.38, hw: 1.0, z0: -1.35, z1: 0.2, drop: 1.1, scepter: [1.55, 0.9, 3.0] },
  jirafa:  { mode: 'drape', top: 2.53, hw: 1.0, z0: -1.35, z1: 0.3, drop: 1.1, scepter: [1.55, 0.9, 3.2] },
};

function capeInto(g, c, pal) {
  if (c.mode === 'drape') {
    const len = c.z1 - c.z0, cz = (c.z0 + c.z1) / 2;
    box(g, c.hw * 2, 0.16, len, 0, c.top, cz, pal.main);                           // sobre el lomo
    // Faldones laterales escalonados (se acortan hacia atrás)
    const rows = 4, step = c.drop / rows;
    for (const sx of [-1, 1]) {
      for (let i = 0; i < rows; i++) {
        const l = len - i * 0.28;
        box(g, 0.16, step, l, sx * c.hw, c.top - 0.08 - step * (i + 0.5), c.z1 - l / 2, i % 2 ? pal.dark : pal.main);
      }
      box(g, 0.2, 0.12, len - rows * 0.28 + 0.1, sx * c.hw, c.top - 0.08 - c.drop, c.z1 - (len - rows * 0.28) / 2 - 0.05, pal.gold); // ribete dorado
    }
    pal.collar(g, c.hw * 2 + 0.3, 0.36, 0.42, 0, c.top + 0.06, c.z1);              // cuello de armiño
    for (const sx of [-1, 1]) pal.collar(g, 0.42, c.drop * 0.8, 0.42, sx * c.hw, c.top - c.drop * 0.4, c.z1);
  } else {
    // Capa colgando por la espalda: panel escalonado que se abre hacia abajo
    pal.collar(g, c.tw * 2 + 0.3, 0.34, c.tw * 2 + 0.2, 0, c.neck, c.cz);          // cuello de armiño
    const rows = 6, H = c.neck - c.bottom, step = H / rows;
    for (let i = 0; i < rows; i++) {
      const k = i / (rows - 1);
      const w = c.tw * 2 + 0.25 + k * 0.7;
      const z = c.back + (c.hips - c.back) * k * k - 0.1;
      box(g, w, step + 0.02, 0.18, 0, c.neck - 0.17 - step * (i + 0.5), z, i % 2 ? pal.dark : pal.main);
    }
    box(g, c.tw * 2 + 0.95, 0.14, 0.22, 0, c.bottom - 0.02, c.hips - 0.1, pal.gold);  // ribete inferior
    for (const sx of [-1, 1]) {                                                  // hombreras
      box(g, 0.3, 0.3, c.tw * 2 - 0.1, sx * (c.tw + 0.1), c.neck - 0.05, c.cz, pal.main);
      box(g, 0.18, 0.16, c.tw * 2, sx * (c.tw + 0.24), c.neck - 0.22, c.cz, pal.gold);
    }
  }
}

const ROYAL_PAL = () => {
  const er = solid(ERMINE), sp = solid(SPOT);
  return {
    main: solid(RED), dark: solid(RED2), gold: goldMat(),
    collar: (parent, w, h, d, x, y, z) => {
      box(parent, w, h, d, x, y, z, er);
      const n = Math.max(2, Math.round(w / 0.7));
      for (let i = 0; i < n; i++) box(parent, 0.12, 0.12, d + 0.02, x - w / 2 + (i + 0.5) * (w / n), y, z, sp);
    },
  };
};

function buildRoyalBody(charId) {
  const c = ROYAL[charId] || ROYAL.oveja;
  const g = new THREE.Group();
  capeInto(g, c, ROYAL_PAL());
  g.add(buildScepter(...c.scepter));
  g.userData.skin = 'real';
  return g;
}


/* ======================= Skin "mago" (Mítica): sombrero, túnica estrellada, bastón con cristal, círculo rúnico ======================= */
const glow = (c, op = 1) => new THREE.MeshBasicMaterial({ color: c, transparent: op < 1, opacity: op, depthWrite: false, blending: op < 1 ? THREE.AdditiveBlending : THREE.NormalBlending });
const lilac = (c) => new THREE.MeshLambertMaterial({ color: c, emissive: '#1d0a4a' });

export function buildWizardHat(fit) {
  const g = new THREE.Group();
  const { w, d, cz } = fit;
  const y0 = fit.y + 0.12;
  const A = lilac('#5b2bb8'), B = lilac('#4a21a0'), brimM = lilac('#3b1a86'), gold = goldMat();
  box(g, w + 1.15, 0.14, d + 1.15, 0, y0, cz, brimM);                       // ala ancha
  box(g, w + 0.8, 0.12, d + 0.8, 0, y0 + 0.1, cz, B);
  box(g, w + 0.12, 0.3, d + 0.12, 0, y0 + 0.3, cz, gold);                   // cinta dorada
  const fz = cz + (d + 0.12) / 2;
  box(g, 0.42, 0.4, 0.08, 0, y0 + 0.3, fz + 0.03, gold);                    // hebilla
  box(g, 0.24, 0.22, 0.1, 0, y0 + 0.3, fz + 0.06, solid('#2a1458'));
  // Cono alto y curvado hacia atrás
  const n = 6;
  let tipY = 0, tipZ = 0;
  for (let i = 0; i < n; i++) {
    const k = i / (n - 1);
    const sw = (w - 0.05) * (1 - k * 0.82), sd = (d - 0.05) * (1 - k * 0.82);
    const yy = y0 + 0.62 + i * 0.34 - (i > 3 ? (i - 3) * 0.04 : 0);
    const zz = cz - i * i * 0.04;
    box(g, sw, 0.36, sd, 0, yy, zz, i % 2 ? B : A);
    if (i === 1) box(g, 0.2, 0.2, 0.05, -0.28, yy, zz + sd / 2 + 0.03, gold);              // estrellas doradas
    if (i === 2) { box(g, 0.36, 0.12, 0.05, 0.1, yy, zz + sd / 2 + 0.03, gold); box(g, 0.12, 0.36, 0.05, 0.1, yy, zz + sd / 2 + 0.03, gold); } // estrella grande
    if (i === 3) box(g, 0.16, 0.16, 0.05, -0.12, yy, zz + sd / 2 + 0.03, gold);
    if (i === 4) box(g, 0.14, 0.14, 0.05, 0.1, yy, zz + sd / 2 + 0.03, gold);
    tipY = yy; tipZ = zz;
  }
  const star = new THREE.Mesh(new THREE.OctahedronGeometry(0.2), glow('#ffe98a'));
  star.position.set(0, tipY + 0.32, tipZ);
  g.add(star);
  g.userData.tick = (t) => { star.rotation.y = t * 2; star.scale.setScalar(1 + Math.sin(t * 4) * 0.15); };
  g.userData.skin = 'mago';
  return g;
}

function buildWizardStaff(x, z, top) {
  const g = new THREE.Group();
  g.position.set(x, 0, z);
  const wood = solid('#6b3f1c'), wood2 = solid('#4f2c12'), gold = goldMat();
  const H = top + 0.2;
  for (let i = 0; i < 8; i++) box(g, 0.22, H / 8 + 0.02, 0.22, Math.sin(i * 1.7) * 0.05, (i + 0.5) * H / 8, Math.cos(i * 1.7) * 0.05, i % 2 ? wood : wood2);
  box(g, 0.38, 0.12, 0.38, 0, H * 0.45, 0, gold);
  for (const [sx, sz] of [[-1, -1], [1, -1], [-1, 1], [1, 1]]) {              // garras que sostienen el cristal
    box(g, 0.1, 0.55, 0.1, sx * 0.22, H + 0.2, sz * 0.22, gold);
    box(g, 0.1, 0.1, 0.1, sx * 0.16, H + 0.52, sz * 0.16, gold);
  }
  box(g, 0.5, 0.14, 0.5, 0, H, 0, gold);
  const orb = new THREE.Group();
  orb.position.set(0, H + 0.75, 0);
  const crystal = new THREE.Mesh(new THREE.OctahedronGeometry(0.42), glow('#9a6bff'));
  crystal.scale.y = 1.4;
  const core = new THREE.Mesh(new THREE.OctahedronGeometry(0.22), glow('#ffffff'));
  core.scale.y = 1.4;
  const halo = new THREE.Mesh(new THREE.SphereGeometry(0.85, 12, 10), glow('#b58cff', 0.22));
  orb.add(crystal, core, halo);
  g.add(orb);
  g.userData.tick = (t) => {
    orb.position.y = H + 0.75 + Math.sin(t * 2) * 0.1;
    crystal.rotation.y = t * 1.6; core.rotation.y = -t * 2.2;
    halo.scale.setScalar(1 + Math.sin(t * 3) * 0.12);
  };
  return g;
}

function buildWizardBody(charId) {
  const c = ROYAL[charId] || ROYAL.oveja;
  const g = new THREE.Group();
  const gold = goldMat();
  const dots = solid('#ffffff');
  const pal = {
    main: lilac('#5b2bb8'), dark: lilac('#3b1a86'), gold,
    collar: (parent, w, h, d, x, y, z) => {
      box(parent, w, h, d, x, y, z, gold);
      const n = Math.max(2, Math.round(w / 0.6));
      for (let i = 0; i < n; i++) box(parent, 0.12, 0.12, d + 0.02, x - w / 2 + (i + 0.5) * (w / n), y, z, solid('#fff3b8'));
    },
  };
  capeInto(g, c, pal);
  // Estrellas bordadas en la capa
  const star = (x, y, z, sx, sy, sz) => box(g, sx, sy, sz, x, y, z, solid('#ffe27a'));
  if (c.mode === 'drape') {
    [[-0.5, -0.8], [0.4, -0.2], [-0.2, 0.4], [0.5, -1.2], [-0.6, -1.5]].forEach(([fx, fz]) => star(fx * c.hw, c.top + 0.1, fz, 0.2, 0.05, 0.2));
  } else {
    const H = c.neck - c.bottom, rows = 6, step = H / rows;
    [[1, -0.22], [3, 0.2], [4, -0.12], [5, 0.26]].forEach(([i, fx]) => {
      const k = i / (rows - 1);
      star(fx, c.neck - 0.17 - step * (i + 0.5), c.back + (c.hips - c.back) * k * k - 0.2, 0.18, 0.18, 0.05);
    });
  }
  const [sx, sz, top] = c.scepter;
  g.add(buildWizardStaff(sx, sz, top - 0.2));
  // Círculo rúnico bajo los pies
  const ring = new THREE.Group();
  const R = c.mode === 'drape' ? 3.3 : 2.5;
  const rm = glow('#b58cff', 0.85), rm2 = glow('#7fe4ff', 0.9);
  for (let i = 0; i < 32; i++) {
    const a = (i / 32) * Math.PI * 2;
    const seg = new THREE.Mesh(new THREE.BoxGeometry(0.62, 0.04, 0.16), rm);
    seg.position.set(Math.cos(a) * R, 0.06, Math.sin(a) * R); seg.rotation.y = -a + Math.PI / 2;
    ring.add(seg);
  }
  for (let i = 0; i < 8; i++) {
    const a = (i / 8) * Math.PI * 2 + 0.2, r = R - 0.5;
    const rune = new THREE.Mesh(new THREE.BoxGeometry(0.22, 0.04, 0.34), rm2);
    rune.position.set(Math.cos(a) * r, 0.06, Math.sin(a) * r); rune.rotation.y = -a;
    ring.add(rune);
  }
  ring.position.set(0, 0, c.mode === 'drape' ? 0.2 : -0.1);
  g.add(ring);
  // Destellos que orbitan al personaje
  const sparks = [];
  for (let i = 0; i < 7; i++) {
    const m = new THREE.Mesh(new THREE.OctahedronGeometry(0.12 + (i % 3) * 0.03), glow(['#ffe98a', '#9a6bff', '#7fe4ff'][i % 3]));
    g.add(m); sparks.push(m);
  }
  const cy = c.mode === 'drape' ? c.top - 0.6 : c.neck - 0.4, oz = c.mode === 'drape' ? 0.2 : -0.1, orad = c.mode === 'drape' ? 3.1 : 2.3;
  g.userData.tick = (t) => {
    ring.rotation.y = t * 0.35;
    sparks.forEach((m, i) => {
      const a = t * (0.7 + (i % 3) * 0.15) + i * 0.9;
      m.position.set(Math.cos(a) * orad, cy + Math.sin(t * 1.6 + i) * 0.9 + (i % 4) * 0.35 - 0.5, oz + Math.sin(a) * orad);
      m.rotation.y = t * 2 + i;
    });
    g.children.forEach((ch) => ch.userData.tick?.(t));
  };
  g.userData.skin = 'mago';
  return g;
}


/* ======================= Skin "de la fortuna" (Legendaria): alas doradas, aureola, pilar de luz y la baraja en órbita ======================= */
const lit2 = (c, e = '#6b5a2a') => new THREE.MeshLambertMaterial({ color: c, emissive: e });

export function buildHalo(fit) {
  const g = new THREE.Group();
  const { w, cz } = fit;
  const R = w * 0.62 + 0.2, y = fit.y + 1.45;
  const hm = glow('#ffe27a'), hm2 = glow('#fff6cc', 0.9);
  const ring = new THREE.Group();
  ring.position.set(0, y, cz);
  for (let i = 0; i < 28; i++) {
    const a = (i / 28) * Math.PI * 2;
    const seg = new THREE.Mesh(new THREE.BoxGeometry(0.4, 0.12, 0.2), hm);
    seg.position.set(Math.cos(a) * R, 0, Math.sin(a) * R); seg.rotation.y = -a + Math.PI / 2;
    ring.add(seg);
  }
  const halo = new THREE.Mesh(new THREE.CylinderGeometry(R + 0.15, R + 0.15, 0.06, 28, 1, true), glow('#ffd23f', 0.25));
  ring.add(halo);
  ring.rotation.x = 0.12;
  g.add(ring);
  // Destellos pequeños sobre la aureola
  const tw = [];
  for (let i = 0; i < 4; i++) { const m = new THREE.Mesh(new THREE.OctahedronGeometry(0.13), hm2); g.add(m); tw.push(m); }
  g.userData.tick = (t) => {
    ring.rotation.y = t * 0.9;
    ring.position.y = y + Math.sin(t * 2) * 0.06;
    tw.forEach((m, i) => { const a = t * 1.4 + i * 1.57; m.position.set(Math.cos(a) * (R + 0.1), y + 0.25 + Math.sin(t * 3 + i) * 0.1, cz + Math.sin(a) * (R + 0.1)); m.scale.setScalar(0.6 + 0.5 * Math.abs(Math.sin(t * 4 + i))); });
  };
  g.userData.skin = 'fortuna';
  return g;
}

function buildWing(sx, len) {
  const wing = new THREE.Group();
  const white = lit2('#f6f1e3', '#2e2a20'), gold = lit2('#ffc928', '#5a3e00'), gold2 = lit2('#ffe27a', '#5a4408');
  const n = 6;
  for (let layer = 0; layer < 2; layer++) {
    for (let i = 0; i < n; i++) {
      const th = 0.28 + i * 0.27;
      const L = len * (0.62 + 0.38 * Math.sin(Math.min(1, i / (n - 1) * 0.95 + 0.2) * Math.PI * 0.75)) * (layer ? 0.58 : 1);
      const f = new THREE.Group();
      f.rotation.z = -sx * th;
      f.position.z = layer ? -0.07 : 0;
      const cx = Math.sin(th) * L * 0.5 * sx, cy = Math.cos(th) * L * 0.5;
      f.position.x = 0; f.position.y = 0;
      // pluma: eje +y local, partiendo del pivote
      box(f, 0.38, L, 0.1, 0, L / 2, 0, layer ? gold2 : white);
      box(f, 0.38, 0.28, 0.12, 0, L - 0.12, 0, gold);                      // punta dorada
      box(f, 0.5, 0.08, 0.13, 0, L * 0.5, 0, gold);                       // nervio dorado
      wing.add(f);
    }
  }
  return wing;
}

function buildFortuneBody(charId) {
  const c = ROYAL[charId] || ROYAL.oveja;
  const g = new THREE.Group();
  const quad = c.mode === 'drape';
  // Alas: V amplia detrás del cuerpo
  const wings = [];
  for (const sx of [-1, 1]) {
    const wg = new THREE.Group();
    const W = buildWing(sx, quad ? 2.5 : 2.3);
    wg.add(W);
    wg.position.set(sx * (quad ? 0.6 : c.tw + 0.1), quad ? c.top + 0.15 : c.neck - 0.5, quad ? (c.z0 + c.z1) / 2 : c.back - 0.2);
    wg.rotation.y = -sx * 0.7;
    g.add(wg); wings.push([wg, sx]);
  }
  // Pilar de luz dorado
  const R = quad ? 3.2 : 2.5, cz = quad ? 0.2 : -0.1;
  const pil = new THREE.Mesh(new THREE.CylinderGeometry(R * 0.85, R, 9, 24, 1, true), glow('#ffd23f', 0.06));
  pil.position.set(0, 4.5, cz);
  const pil2 = new THREE.Mesh(new THREE.CylinderGeometry(R * 0.5, R * 0.62, 9, 20, 1, true), glow('#fff2b0', 0.06));
  pil2.position.set(0, 4.5, cz);
  g.add(pil, pil2);
  // Anillo dorado en el suelo
  const ring = new THREE.Group();
  const gm = glow('#ffd23f', 0.95), gm2 = glow('#ffffff', 0.9);
  for (let i = 0; i < 40; i++) {
    const a = (i / 40) * Math.PI * 2;
    const seg = new THREE.Mesh(new THREE.BoxGeometry(0.6, 0.05, 0.2), i % 5 === 0 ? gm2 : gm);
    seg.position.set(Math.cos(a) * R, 0.07, Math.sin(a) * R); seg.rotation.y = -a + Math.PI / 2;
    ring.add(seg);
  }
  for (let i = 0; i < 4; i++) {
    const a = (i / 4) * Math.PI * 2 + Math.PI / 4;
    for (let k = 1; k < 5; k++) { const m = new THREE.Mesh(new THREE.BoxGeometry(0.22, 0.05, 0.22), gm); m.position.set(Math.cos(a) * (R - 0.4 - k * 0.45), 0.07, Math.sin(a) * (R - 0.4 - k * 0.45)); m.rotation.y = a; ring.add(m); }
  }
  ring.position.set(0, 0, cz);
  g.add(ring);
  // Baraja en órbita: cartas, fichas y dados
  const orbit = [];
  const mkCard = (suit) => {
    const cg = new THREE.Group();
    box(cg, 0.62, 0.86, 0.05, 0, 0, 0, lit2('#ffd23f', '#6b4a00'));
    box(cg, 0.52, 0.76, 0.06, 0, 0, 0.01, lit2('#ffffff', '#8a8068'));
    const j = suitJewel(suit, 0.3, 0.07); j.position.z = 0.06; cg.add(j);
    return cg;
  };
  const mkChip = (col) => {
    const m = new THREE.Mesh(new THREE.CylinderGeometry(0.3, 0.3, 0.1, 16), new THREE.MeshLambertMaterial({ color: col, emissive: col, emissiveIntensity: 0.3 }));
    const stripe = new THREE.Mesh(new THREE.CylinderGeometry(0.31, 0.31, 0.04, 16), solid('#ffffff'));
    const gg = new THREE.Group(); gg.add(m, stripe); return gg;
  };
  ['heart', 'spade', 'diamond', 'club'].forEach((k) => orbit.push({ o: mkCard(k), type: 'card' }));
  ['#ff3b5c', '#35a8ff', '#ffc928', '#4be06a'].forEach((k) => orbit.push({ o: mkChip(k), type: 'chip' }));
  [0, 1, 2].forEach(() => orbit.push({ o: buildDie(0.42), type: 'die' }));
  orbit.forEach((it) => g.add(it.o));
  // Chispas doradas que suben
  const sp = [];
  for (let i = 0; i < 18; i++) {
    const m = new THREE.Mesh(new THREE.OctahedronGeometry(0.1 + (i % 3) * 0.04), glow(i % 2 ? '#fff2b0' : '#ffd23f'));
    const a = (i * 2.399) % (Math.PI * 2), r = R * (0.25 + ((i * 37) % 70) / 100);
    m.userData = { x: Math.cos(a) * r, z: cz + Math.sin(a) * r, off: (i * 0.173) % 1, sp: 0.18 + (i % 4) * 0.05 };
    g.add(m); sp.push(m);
  }
  g.userData.tick = (t) => {
    wings.forEach(([wg, sx]) => { wg.rotation.z = sx * (Math.sin(t * 2.2) * 0.07); });
    ring.rotation.y = -t * 0.3;
    pil.material.opacity = 0.06 + Math.sin(t * 2) * 0.02;
    orbit.forEach((it, i) => {
      const n = orbit.length, a = t * 0.55 + (i / n) * Math.PI * 2;
      const rr = R * 0.95 + Math.sin(i * 1.7) * 0.35;
      it.o.position.set(Math.cos(a) * rr, (quad ? c.top : c.neck) - 1.2 + Math.sin(t * 1.5 + i * 1.3) * 0.5 + (i % 3) * 0.55, cz + Math.sin(a) * rr);
      if (it.type === 'card') it.o.rotation.y = -a + Math.PI / 2;
      else if (it.type === 'chip') { it.o.rotation.set(t * 2 + i, t * 1.3, 0); }
      else it.o.rotation.set(t * 1.1 + i, t * 1.6, 0.4);
    });
    sp.forEach((m) => {
      const f = (t * m.userData.sp + m.userData.off) % 1;
      m.position.set(m.userData.x, 0.2 + f * 7, m.userData.z);
      m.scale.setScalar(Math.max(0.05, Math.sin(f * Math.PI)));
      m.rotation.y = t * 3;
    });
  };
  g.userData.skin = 'fortuna';
  return g;
}


/* ======================= Skin "astronauta" (Épica): casco de cristal, mochila de oxígeno y bandera ======================= */
/** Caja de la cabeza (en coordenadas locales de la cabeza) a partir de sus mallas, para que el casco se ajuste a cada personaje. */
export function headBounds(head) {
  head.updateWorldMatrix(true, true);
  const inv = new THREE.Matrix4().copy(head.matrixWorld).invert();
  const box = new THREE.Box3();
  head.traverse((o) => {
    if (!o.isMesh || !o.geometry) return;
    if (!o.geometry.boundingBox) o.geometry.computeBoundingBox();
    o.updateWorldMatrix(true, false);
    box.union(o.geometry.boundingBox.clone().applyMatrix4(new THREE.Matrix4().multiplyMatrices(inv, o.matrixWorld)));
  });
  return box.isEmpty() ? null : box;
}

export function buildHelmet(fit, hb = null) {
  const g = new THREE.Group();
  // Medidas del casco: la caja real de la cabeza (orejas, cuernos y hocico incluidos) más un margen
  let cx = 0, cy = fit.y - 0.45, zc = fit.cz + 0.12, W = fit.w + 0.55, H = 2.05, D = fit.d + 0.6;
  if (hb) {
    const pad = { x: 0.28, top: 0.3, bot: 0.34, front: 0.3, back: 0.22 };
    const x0 = hb.min.x - pad.x, x1 = hb.max.x + pad.x, y0 = hb.min.y - pad.bot, y1 = hb.max.y + pad.top, z0 = hb.min.z - pad.back, z1 = hb.max.z + pad.front;
    W = Math.max(x1 - x0, 1.6); H = y1 - y0; D = z1 - z0;
    cx = (x0 + x1) / 2; cy = (y0 + y1) / 2; zc = (z0 + z1) / 2;
  }
  const glassM = new THREE.MeshLambertMaterial({ color: '#bfe6ff', emissive: '#2a5a80', transparent: true, opacity: 0.3, depthWrite: false, side: THREE.DoubleSide });
  const white = new THREE.MeshLambertMaterial({ color: '#f4f6fb', emissive: '#4a5060' });
  const gray = solid('#aeb6c8');
  box(g, W, H, D, cx, cy, zc, glassM);                                             // burbuja
  box(g, W - 0.3, 0.12, D - 0.3, cx, cy + H / 2 + 0.04, zc, glassM);              // tapa redondeada
  box(g, W + 0.12, 0.34, D + 0.12, cx, cy - H / 2 + 0.14, zc, white);            // aro del cuello
  box(g, W + 0.18, 0.08, D + 0.18, cx, cy - H / 2 + 0.36, zc, gray);
  for (const [sx, sz] of [[-1, -1], [1, -1], [-1, 1], [1, 1]]) box(g, 0.1, H - 0.2, 0.1, cx + sx * W / 2, cy + 0.1, zc + sz * D / 2, white);   // postes del casco
  box(g, W, 0.1, 0.1, cx, cy + H / 2 - 0.02, zc + D / 2, white);
  box(g, 0.34, 0.12, 0.05, cx - W / 2 + 0.3, cy + H / 2 - 0.35, zc + D / 2 + 0.03, white);   // brillo
  box(g, 0.12, 0.42, 0.05, cx - W / 2 + 0.25, cy + H / 2 - 0.65, zc + D / 2 + 0.03, white);
  // Antena con luz intermitente
  box(g, 0.08, 0.5, 0.08, cx + W / 2 - 0.2, cy + H / 2 + 0.3, zc - 0.2, gray);
  const bulb = new THREE.Mesh(new THREE.BoxGeometry(0.2, 0.2, 0.2), new THREE.MeshBasicMaterial({ color: '#ff3b3b' }));
  bulb.position.set(cx + W / 2 - 0.2, cy + H / 2 + 0.62, zc - 0.2);
  g.add(bulb);
  // Parche de la misión en el aro
  box(g, 0.34, 0.2, 0.05, cx, cy - H / 2 + 0.14, zc + D / 2 + 0.09, solid('#ff4b63'));
  box(g, 0.14, 0.14, 0.06, cx, cy - H / 2 + 0.14, zc + D / 2 + 0.12, solid('#ffffff'));
  g.userData.tick = (t) => { bulb.material.color.set(Math.sin(t * 5) > 0 ? '#ff3b3b' : '#5a1010'); };
  g.userData.skin = 'astronauta';
  return g;
}

function buildAstronautBody(charId) {
  const c = ROYAL[charId] || ROYAL.oveja;
  const g = new THREE.Group();
  const white = new THREE.MeshLambertMaterial({ color: '#f4f6fb', emissive: '#4a5060' });
  const gray = solid('#aeb6c8'), dark = solid('#4b5468'), blue = solid('#35a8ff'), red = solid('#ff4b63');
  const pack = new THREE.Group();
  box(pack, 1.5, 1.5, 0.9, 0, 0, 0, white);                           // mochila de soporte vital
  box(pack, 1.62, 0.16, 1.0, 0, 0.68, 0, gray);
  box(pack, 1.62, 0.16, 1.0, 0, -0.68, 0, gray);
  for (const sx of [-1, 1]) box(pack, 0.4, 1.1, 0.12, sx * 0.38, 0, -0.5, blue);   // tanques
  box(pack, 1.0, 0.36, 0.06, 0, 0.1, 0.48, dark);                      // panel de control
  for (let i = 0; i < 3; i++) box(pack, 0.16, 0.16, 0.08, -0.32 + i * 0.32, 0.1, 0.52, [red, solid('#4be06a'), solid('#ffd23f')][i]);
  if (c.mode === 'drape') { pack.position.set(0, c.top + 0.5, c.z0 + 1.0); }
  else { pack.position.set(0, c.neck - 0.95, c.back - 0.5); }
  g.add(pack);
  // Mangueras de oxígeno hacia el casco
  const hose = c.mode === 'drape' ? [[0.75, c.top + 0.2, c.z0 + 1.5]] : [[0.5, c.neck - 0.2, c.back - 0.1]];
  hose.forEach(([x, y, z]) => { for (const sx of [-1, 1]) box(g, 0.12, 0.12, 0.7, sx * x, y, z, dark); });
  // Bandera plantada con estrella
  const [fx, fz, ftop] = c.scepter;
  const flag = new THREE.Group();
  flag.position.set(-fx, 0, fz);
  box(flag, 0.14, ftop, 0.14, 0, ftop / 2, 0, gray);
  box(flag, 0.2, 0.2, 0.2, 0, ftop + 0.08, 0, solid('#ffd23f'));
  const cloth = new THREE.Group();
  cloth.position.set(0.07, ftop - 0.55, 0);
  const bands = ['#006847', '#ffffff', '#ce1126'].map((col, i) => {
    const bg = new THREE.Group();
    bg.position.x = 0.25 + i * 0.5;
    box(bg, 0.5, 1.0, 0.07, 0, 0, 0, new THREE.MeshLambertMaterial({ color: col, emissive: i === 1 ? '#555555' : '#101010' }));
    cloth.add(bg);
    return bg;
  });
  box(bands[1], 0.26, 0.26, 0.05, 0, 0, 0.05, solid('#8a5a2b'));       // escudo (águila sobre nopal)
  box(bands[1], 0.34, 0.1, 0.05, 0, -0.2, 0.05, solid('#2e8b3a'));
  box(bands[1], 0.12, 0.1, 0.05, 0.02, 0.17, 0.06, solid('#6b4220'));
  flag.add(cloth);
  g.add(flag);
  g.userData.tick = (t) => { cloth.rotation.y = Math.sin(t * 2.4) * 0.1; bands.forEach((m, i) => { m.position.z = Math.sin(t * 4 + i * 1.2) * 0.05; m.rotation.y = Math.sin(t * 4 + i * 1.2) * 0.12; }); };
  g.userData.skin = 'astronauta';
  return g;
}

/* ======================= Skin "de cumpleaños" (Muy rara, no se vende): gorro de fiesta y espanta suegras ======================= */
const MOUTH = {
  oveja:   { y: -0.5,  z: 1.03 },
  perro:   { y: -0.55, z: 1.38 },
  gato:    { y: -0.42, z: 1.08 },
  borrego: { y: -0.6,  z: 1.55 },
  vaca:    { y: -0.6,  z: 1.18 },
  zorro:   { y: -0.52, z: 1.42 },
  jirafa:  { y: -0.45, z: 1.28 },
};
function buildPartyHead(fit, charId) {
  const g = new THREE.Group();
  const { w, cz } = fit;
  const cols = ['#ff5fa2', '#ffd23f', '#35d0ff', '#8fe04b'].map((c) => new THREE.MeshLambertMaterial({ color: c, emissive: c, emissiveIntensity: 0.18 }));
  const white = solid('#ffffff');
  // Gorro de fiesta cónico con rayas y lunares
  const hat = new THREE.Group();
  hat.position.set(0, fit.y + 0.12, cz);
  hat.rotation.z = -0.14;
  const n = 6;
  for (let i = 0; i < n; i++) {
    const k = 1 - i / n;
    const sw = (w * 0.62) * k + 0.12;
    box(hat, sw, 0.3, sw, 0, 0.15 + i * 0.28, 0, cols[i % cols.length]);
    if (i % 2 === 0 && i < 4) box(hat, 0.1, 0.1, 0.05, sw * 0.2, 0.15 + i * 0.28, sw / 2 + 0.03, white);
  }
  const pom = new THREE.Group();
  pom.position.set(0, 0.15 + n * 0.28 + 0.08, 0);
  box(pom, 0.3, 0.3, 0.3, 0, 0, 0, white);
  box(pom, 0.18, 0.18, 0.18, 0.15, 0.1, 0.1, cols[0]);
  box(pom, 0.18, 0.18, 0.18, -0.12, 0.05, -0.1, cols[2]);
  hat.add(pom);
  g.add(hat);
  // Goma elástica bajo la barbilla (a los lados)
  for (const sx of [-1, 1]) box(g, 0.05, 0.9, 0.05, sx * (w * 0.32), fit.y - 0.35, cz + 0.1, solid('#e8e8e8'));
  // Espanta suegras en la boca
  const m = MOUTH[charId] || MOUTH.oveja;
  const horn = new THREE.Group();
  horn.position.set(0, m.y, m.z);
  horn.rotation.x = -0.12;
  box(horn, 0.24, 0.2, 0.2, 0, 0, 0.04, solid('#ffd23f'));            // boquilla
  for (let i = 0; i < 4; i++) box(horn, 0.18, 0.16, 0.2, 0, 0, 0.2 + i * 0.2, i % 2 ? cols[1] : cols[0]);   // tubo rayado
  const tip = new THREE.Group();
  tip.position.set(0, 0, 1.0);
  const seg = [];
  for (let i = 0; i < 6; i++) {
    const b = new THREE.Mesh(new THREE.BoxGeometry(0.34, 0.06, 0.22), cols[(i + 2) % cols.length]);
    b.position.set(0, i * 0.01, 0.11 + i * 0.22);
    tip.add(b); seg.push(b);
  }
  horn.add(tip);
  g.add(horn);
  g.userData.tick = (t) => {
    const k = 0.15 + 0.85 * Math.abs(Math.sin(t * 1.3));       // el espanta suegras se desenrolla y se enrolla
    seg.forEach((b, i) => { const on = i / seg.length < k; b.visible = on; b.position.y = i * 0.02 * k + (i / seg.length) * k * 0.12; });
  };
  g.userData.skin = 'cumple';
  return g;
}

/** Aproximación para modelos GLB sin cabeza identificable: a partir de la caja del modelo ya ajustado.
 *  Si el GLB tiene un nodo cuyo nombre contenga "head"/"cabeza", se usa ese nodo. */
export function placeBodyOnGlb(model, hero, bodyGroup) {
  model.updateWorldMatrix(true, true);
  hero.updateWorldMatrix(true, false);
  const inv = new THREE.Matrix4().copy(hero.matrixWorld).invert();
  const box = new THREE.Box3().setFromObject(model).applyMatrix4(inv);
  const size = new THREE.Vector3(); box.getSize(size);
  const c = new THREE.Vector3(); box.getCenter(c);
  const s = size.y / 3.9;
  bodyGroup.scale.setScalar(s);
  bodyGroup.position.set(c.x, box.min.y, c.z - 0.3 * s);
  hero.add(bodyGroup);
}

export function placeOnGlb(model, hero, skinGroup, charId) {
  let headNode = null;
  model.traverse((o) => { if (!headNode && /head|cabeza/i.test(o.name || '')) headNode = o; });
  const fit = HEAD_FIT[charId] || HEAD_FIT.oveja;
  model.updateWorldMatrix(true, true);
  hero.updateWorldMatrix(true, false);
  const inv = new THREE.Matrix4().copy(hero.matrixWorld).invert();
  const box = new THREE.Box3().setFromObject(headNode || model).applyMatrix4(inv);
  const size = new THREE.Vector3(); box.getSize(size);
  const c = new THREE.Vector3(); box.getCenter(c);
  let s, pos;
  if (headNode) {
    s = Math.max(0.3, size.x / (fit.w * 0.92));
    pos = new THREE.Vector3(c.x, box.min.y + size.y * 0.78 - fit.y * s, c.z);
  } else {
    // Cabeza al frente y arriba (+z hacia la cámara): proporciones del modelo vóxel
    s = size.y / 3.9;
    pos = new THREE.Vector3(c.x, box.max.y - 0.14 * size.y - fit.y * s, box.max.z - 0.5 * s - fit.cz * s);
  }
  skinGroup.scale.setScalar(s);
  skinGroup.position.copy(pos);
  hero.add(skinGroup);
}
