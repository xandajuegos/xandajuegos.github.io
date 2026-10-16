// Visor 3D del personaje (Oveja, Perro, Gato, Borrego, Vaca). Carga el GLB del usuario y, si no existe
// todavía, construye el personaje procedural en estilo vóxel como respaldo.
import { THREE, GLTFLoader } from './three-lib.js';
import { sfx } from './audio.js';
import { buildSkin, buildSkinBody, placeOnGlb, placeBodyOnGlb, headBounds } from './skin-models.js';

const mat = (color) => new THREE.MeshLambertMaterial({ color });

function addBox(parent, w, h, d, x, y, z, color) {
  const m = new THREE.Mesh(new THREE.BoxGeometry(w, h, d), mat(color));
  m.position.set(x, y, z);
  parent.add(m);
  return m;
}

/** Oveja vóxel procedural (respaldo cuando char_oveja.glb no está disponible). */
function buildVoxelSheep() {
  const root = new THREE.Group();
  const WOOL = ['#f7f5f0', '#ffffff', '#ece8e1', '#f2efe9'];
  const DARK = '#34343f';

  // Patas
  for (const [x, z] of [[-0.75, -0.85], [0.75, -0.85], [-0.75, 0.85], [0.75, 0.85]]) {
    addBox(root, 0.55, 1.05, 0.55, x, 0.52, z, DARK);
    addBox(root, 0.62, 0.22, 0.7, x, 0.11, z + 0.05, '#23232c');
  }
  // Cuerpo de lana
  const body = new THREE.Group();
  root.add(body);
  addBox(body, 2.5, 1.9, 2.7, 0, 1.95, 0, WOOL[0]);
  // Mechones (vóxeles de lana) para volumen
  const puffs = [
    [-1.3, 2.3, 0.4], [1.3, 2.1, -0.5], [-1.25, 1.5, -0.7], [1.25, 1.6, 0.8], [0, 3.05, -0.6], [-0.7, 3.0, 0.5],
    [0.8, 3.0, 0.2], [0, 2.9, -1.35], [-0.9, 2.2, -1.4], [0.95, 1.5, -1.4], [0, 1.2, -1.2], [-0.4, 1.1, 1.3],
  ];
  puffs.forEach(([x, y, z], i) => addBox(body, 0.85, 0.85, 0.85, x, y, z, WOOL[i % WOOL.length]));
  addBox(body, 0.9, 0.9, 0.9, 0, 2.4, -1.65, WOOL[1]); // cola

  // Cabeza
  const head = new THREE.Group();
  head.position.set(0, 2.55, 1.55);
  root.add(head);
  addBox(head, 1.3, 1.25, 1.2, 0, 0, 0.25, DARK);
  addBox(head, 1.55, 0.55, 1.45, 0, 0.78, 0.05, WOOL[1]); // flequillo de lana
  addBox(head, 1.05, 0.45, 0.5, 0, -0.4, 0.78, '#4a4a58'); // hocico
  addBox(head, 0.3, 0.2, 0.12, 0, -0.28, 1.06, '#f2a5b6'); // nariz
  const ears = [];
  for (const sx of [-1, 1]) {
    const ear = new THREE.Group();
    ear.position.set(sx * 0.82, 0.12, 0.15);
    addBox(ear, 0.65, 0.28, 0.4, sx * 0.3, 0, 0, '#4a4a58');
    addBox(ear, 0.35, 0.16, 0.25, sx * 0.34, 0, 0.06, '#e8a3b0');
    head.add(ear);
    ears.push(ear);
  }
  const eyes = [];
  for (const sx of [-1, 1]) {
    const eye = new THREE.Group();
    eye.position.set(sx * 0.38, 0.12, 0.88);
    addBox(eye, 0.36, 0.36, 0.1, 0, 0, 0, '#ffffff');
    addBox(eye, 0.16, 0.2, 0.12, sx * -0.03, -0.02, 0.03, '#0a0a10');
    head.add(eye);
    eyes.push(eye);
  }
  root.userData.parts = { head, ears, eyes, body };
  return root;
}

/** Perro vóxel procedural (respaldo cuando char_perro.glb no está disponible). */
function buildVoxelDog() {
  const root = new THREE.Group();
  const FUR = '#f4f6fa', FUR2 = '#e3e8f1', SHADE = '#d3dae8', CREAM = '#e6c48a', CREAM2 = '#d2ad6c', BLACK = '#14141c';
  const body = new THREE.Group();
  root.add(body);
  addBox(body, 1.7, 1.6, 2.0, 0, 0.85, -0.75, FUR2);          // cadera
  addBox(body, 1.5, 2.1, 1.3, 0, 1.95, -0.1, FUR);            // pecho/torso erguido
  addBox(body, 1.1, 1.0, 0.5, 0, 1.3, 0.62, '#ffffff');       // pecho frontal
  for (const sx of [-1, 1]) {
    addBox(body, 0.62, 1.4, 1.7, sx * 1.1, 0.7, -0.7, FUR);   // muslos
    addBox(body, 0.66, 0.3, 1.1, sx * 1.1, 0.15, 0.1, SHADE); // patas traseras
    addBox(body, 0.5, 1.6, 0.5, sx * 0.42, 0.8, 0.78, FUR);   // patas delanteras
    addBox(body, 0.6, 0.28, 0.85, sx * 0.42, 0.14, 0.92, SHADE); // patitas
  }
  const tail = new THREE.Group();
  tail.position.set(0.15, 0.35, -1.8);
  addBox(tail, 0.5, 0.5, 1.0, 0, 0, -0.45, FUR);
  addBox(tail, 0.46, 0.46, 0.5, 0, 0.12, -1.0, FUR2);
  body.add(tail);

  const head = new THREE.Group();
  head.position.set(0, 3.5, 0.2);
  root.add(head);
  addBox(head, 1.6, 1.45, 1.5, 0, 0, 0.1, FUR);
  addBox(head, 0.85, 0.65, 0.8, 0, -0.28, 0.98, '#ffffff');   // hocico
  addBox(head, 0.38, 0.3, 0.22, 0, -0.02, 1.4, BLACK);        // nariz
  addBox(head, 0.5, 0.12, 0.1, 0, -0.55, 1.36, SHADE);        // boca
  addBox(head, 1.3, 0.3, 1.0, 0, 0.78, 0.0, FUR2);            // frente
  const ears = [];
  for (const sx of [-1, 1]) {
    const ear = new THREE.Group();
    ear.position.set(sx * 0.9, 0.62, 0.05);
    ear.userData.base = sx * -0.38;
    ear.rotation.z = ear.userData.base;
    addBox(ear, 0.45, 1.15, 0.85, sx * 0.1, -0.5, 0, CREAM);
    addBox(ear, 0.2, 0.7, 0.6, sx * 0.3, -0.7, 0, CREAM2);
    head.add(ear);
    ears.push(ear);
  }
  const eyes = [];
  for (const sx of [-1, 1]) {
    const eye = new THREE.Group();
    eye.position.set(sx * 0.42, 0.22, 0.86);
    addBox(eye, 0.24, 0.32, 0.1, 0, 0, 0, BLACK);
    addBox(eye, 0.07, 0.09, 0.06, sx * 0.04, 0.07, 0.07, '#ffffff');
    head.add(eye);
    eyes.push(eye);
  }
  root.userData.parts = { head, ears, eyes, body, tail };
  return root;
}

/** Gato vóxel procedural (respaldo cuando char_gato.glb no está disponible). */
function buildVoxelCat() {
  const root = new THREE.Group();
  const FUR = '#26262d', FUR2 = '#1b1b21', SHADE = '#131318', BLACK = '#050507', PINK = '#f48fb1';
  const body = new THREE.Group();
  root.add(body);
  addBox(body, 1.5, 1.4, 1.8, 0, 0.75, -0.7, FUR2);          // cadera
  addBox(body, 1.2, 2.0, 1.1, 0, 1.9, -0.15, FUR);           // torso erguido
  for (const sx of [-1, 1]) {
    addBox(body, 0.55, 1.2, 1.5, sx * 0.92, 0.6, -0.7, FUR);   // muslos
    addBox(body, 0.6, 0.28, 1.0, sx * 0.92, 0.14, 0.05, SHADE); // patas traseras
    addBox(body, 0.45, 1.5, 0.45, sx * 0.34, 0.75, 0.68, FUR);  // patas delanteras
    addBox(body, 0.55, 0.26, 0.8, sx * 0.34, 0.13, 0.82, SHADE); // patitas
  }
  const tail = new THREE.Group();
  tail.position.set(0.55, 0.4, -1.55);
  tail.userData.sway = true;
  addBox(tail, 0.4, 0.4, 0.8, 0, 0, -0.35, FUR);
  addBox(tail, 0.4, 1.5, 0.4, 0, 0.55, -0.75, FUR);
  addBox(tail, 0.4, 0.4, 0.7, 0, 1.4, -0.55, FUR2);
  addBox(tail, 0.4, 0.5, 0.4, 0, 1.15, -0.2, FUR2);
  body.add(tail);

  const head = new THREE.Group();
  head.position.set(0, 3.4, 0.15);
  root.add(head);
  addBox(head, 1.7, 1.3, 1.4, 0, 0, 0.05, FUR);
  addBox(head, 0.6, 0.42, 0.36, 0, -0.3, 0.9, FUR2);          // hocico
  addBox(head, 0.28, 0.18, 0.16, 0, -0.1, 1.12, PINK);        // nariz rosa
  const ears = [];
  for (const sx of [-1, 1]) {
    const ear = new THREE.Group();
    ear.position.set(sx * 0.58, 0.62, -0.05);
    addBox(ear, 0.5, 0.45, 0.35, 0, 0.2, 0, FUR);
    addBox(ear, 0.28, 0.3, 0.3, sx * -0.04, 0.55, 0, FUR2);
    head.add(ear);
    ears.push(ear);
  }
  const eyes = [];
  for (const sx of [-1, 1]) {
    const eye = new THREE.Group();
    eye.position.set(sx * 0.44, 0.14, 0.76);
    addBox(eye, 0.26, 0.32, 0.1, 0, 0, 0, BLACK);
    addBox(eye, 0.07, 0.08, 0.06, sx * 0.04, 0.07, 0.06, '#8a8a99');
    head.add(eye);
    eyes.push(eye);
  }
  root.userData.parts = { head, ears, eyes, body, tail };
  return root;
}

/** Borrego vóxel procedural (respaldo cuando char_borrego.glb no está disponible). */
export function buildVoxelRam() {
  const root = new THREE.Group();
  const W = '#ffffff', W2 = '#f3f3f7', W3 = '#e4e4ec';
  const CREAM = '#f4e8bd', CREAM2 = '#f9f1d4', CREAM3 = '#e9dbab';
  const TAN = '#e9bf92', TAN2 = '#d0a06f', HORN = '#c98f55', PINK = '#e3a07d', BLACK = '#0a0a10';
  // Patas cuadradas de dos tonos
  for (const sx of [-1, 1]) for (const sz of [-1, 1]) {
    addBox(root, 0.7, 0.52, 0.7, sx * 0.6, 0.74, sz * 1.3, TAN);
    addBox(root, 0.7, 0.48, 0.7, sx * 0.6, 0.24, sz * 1.3, TAN2);
  }
  const body = new THREE.Group();
  root.add(body);
  addBox(body, 1.95, 0.2, 3.8, 0, 1.1, 0, W3);                 // base clara
  addBox(body, 1.8, 2.4, 3.6, 0, 2.4, 0, W);                  // cuerpo (largo ≈ 2× ancho)
  addBox(body, 1.72, 0.3, 3.3, 0, 3.75, -0.1, W);               // losa superior
  for (const sx of [-1, 1]) {
    addBox(body, 0.16, 1.8, 2.5, sx * 0.97, 2.4, -0.35, W2);   // panel lateral escalonado
    addBox(body, 0.16, 0.8, 1.0, sx * 0.97, 3.3, 1.05, W);
    addBox(body, 0.16, 0.5, 0.9, sx * 0.97, 1.55, 1.2, W3);
  }
  addBox(body, 1.8, 1.4, 0.5, 0, 1.95, 2.0, W2);               // pecho blanco bajo la cabeza
  addBox(body, 1.9, 0.5, 1.0, 0, 3.25, 1.55, W2);               // flequillo escalonado
  addBox(body, 1.7, 0.35, 0.7, 0, 3.7, 1.35, W);
  addBox(body, 0.9, 0.9, 0.45, 0, 3.0, -1.95, W2);             // cola
  const head = new THREE.Group();
  head.position.set(0, 2.05, 2.6);
  root.add(head);
  addBox(head, 1.5, 1.45, 1.3, 0, 0, 0, CREAM);                // cabeza
  addBox(head, 1.15, 0.95, 1.0, 0, -0.3, 1.05, CREAM2);        // hocico grande
  addBox(head, 1.15, 0.25, 0.8, 0, -0.85, 0.95, CREAM3);       // mentón escalonado
  addBox(head, 1.6, 0.5, 1.2, 0, 0.95, -0.1, W);               // lana sobre la frente
  const ears = [];
  for (const sx of [-1, 1]) {
    const ear = new THREE.Group();
    ear.position.set(sx * 0.75, 0.3, -0.25);
    addBox(ear, 0.8, 0.36, 0.55, sx * 0.35, 0, 0, CREAM);
    addBox(ear, 0.12, 0.2, 0.3, sx * 0.72, 0, 0.1, PINK);
    addBox(ear, 0.36, 0.2, 0.1, sx * 0.4, 0, 0.3, PINK);
    head.add(ear);
    ears.push(ear);
    // cuerno en espiral sobre el costado de la lana
    const horn = new THREE.Group();
    horn.position.set(sx * 1.05, 3.1, 0.95);
    for (const [z, y] of [[0, 1], [0, 2], [0, 3], [1, 3], [2, 3], [3, 3], [3, 2], [3, 1], [3, 0], [2, 0], [1, 0], [1, 1], [1, 2], [2, 2]]) addBox(horn, 0.26, 0.22, 0.22, 0, (y - 1.5) * 0.3, (z - 1.5) * 0.3, HORN);
    root.add(horn);
  }
  const eyes = [];
  for (const sx of [-1, 1]) {
    const eye = new THREE.Group();
    eye.position.set(sx * 0.76, 0.1, 0.4);
    addBox(eye, 0.1, 0.42, 0.26, 0, 0, 0, BLACK);
    head.add(eye);
    eyes.push(eye);
  }
  root.traverse((o) => { if (o.material?.emissive) o.material.emissive.copy(o.material.color).multiplyScalar(0.5); });
  root.userData.parts = { head, ears, eyes, body };
  return root;
}

/** Vaca vóxel procedural (respaldo cuando char_vaca.glb no está disponible). */
function buildVoxelCow() {
  const root = new THREE.Group();
  const W = '#fbfbfd', W2 = '#eeeef3', W3 = '#e2e2ea', K = '#26262e', K2 = '#1a1a21';
  const PINK = '#f2a3b4', PINK2 = '#e68ca0', HORN = '#f1e3b6', HOOF = '#3a3036', BLACK = '#0a0a10';
  for (const sx of [-1, 1]) for (const sz of [-1, 1]) {
    addBox(root, 0.7, 0.6, 0.7, sx * 0.62, 0.7, sz * 1.3, W);
    addBox(root, 0.74, 0.4, 0.74, sx * 0.62, 0.2, sz * 1.3, HOOF);
  }
  const body = new THREE.Group();
  root.add(body);
  addBox(body, 1.95, 0.2, 3.8, 0, 1.1, 0, W3);
  addBox(body, 1.8, 2.3, 3.6, 0, 2.35, 0, W);
  addBox(body, 1.7, 0.25, 3.3, 0, 3.62, -0.1, W);
  addBox(body, 0.5, 0.35, 0.7, 0, 0.95, -0.9, PINK);            // ubre
  // manchas negras (sobresalen un poco para verse como parches)
  for (const sx of [-1, 1]) {
    addBox(body, 0.12, 1.2, 1.3, sx * 0.93, 2.7, -0.7, K);
    addBox(body, 0.12, 0.8, 0.8, sx * 0.93, 1.9, 0.9, K);
    addBox(body, 0.12, 0.6, 0.7, sx * 0.93, 3.1, -1.2, K2);
  }
  addBox(body, 1.0, 0.12, 1.2, 0.3, 3.78, 0.2, K);
  addBox(body, 0.8, 0.12, 0.9, -0.4, 3.78, -1.1, K2);
  addBox(body, 1.8, 1.4, 0.5, 0, 1.95, 2.0, W2);
  addBox(body, 1.6, 0.4, 0.8, 0, 3.55, 1.5, W2);
  const tail = new THREE.Group();
  tail.position.set(0, 3.2, -1.85);
  tail.userData.sway = true;
  addBox(tail, 0.22, 1.6, 0.22, 0, -0.8, -0.1, W2);
  addBox(tail, 0.4, 0.5, 0.4, 0, -1.75, -0.1, K);
  body.add(tail);
  const head = new THREE.Group();
  head.position.set(0, 2.2, 2.6);
  root.add(head);
  addBox(head, 1.5, 1.5, 1.3, 0, 0, 0, W);                      // cabeza
  addBox(head, 1.2, 0.85, 0.55, 0, -0.45, 0.9, PINK);           // hocico rosa
  addBox(head, 0.2, 0.2, 0.1, -0.3, -0.35, 1.2, PINK2);         // fosas
  addBox(head, 0.2, 0.2, 0.1, 0.3, -0.35, 1.2, PINK2);
  addBox(head, 0.62, 0.62, 0.15, -0.38, 0.3, 0.62, K);          // mancha en la cara
  addBox(head, 1.4, 0.3, 0.9, 0, 0.88, -0.1, W2);               // mechón
  const ears = [];
  for (const sx of [-1, 1]) {
    const ear = new THREE.Group();
    ear.position.set(sx * 0.75, 0.45, -0.25);
    addBox(ear, 0.8, 0.34, 0.5, sx * 0.35, 0, 0, K);
    addBox(ear, 0.4, 0.18, 0.1, sx * 0.4, 0, 0.28, PINK);
    head.add(ear);
    ears.push(ear);
    addBox(head, 0.28, 0.5, 0.28, sx * 0.5, 1.0, -0.1, HORN);   // cuernos
    addBox(head, 0.28, 0.2, 0.28, sx * 0.6, 1.35, -0.1, HORN);
  }
  const eyes = [];
  for (const sx of [-1, 1]) {
    const eye = new THREE.Group();
    eye.position.set(sx * 0.76, 0.18, 0.35);
    addBox(eye, 0.1, 0.38, 0.26, 0, 0, 0, BLACK);
    head.add(eye);
    eyes.push(eye);
  }
  root.traverse((o) => { if (o.material?.emissive) o.material.emissive.copy(o.material.color).multiplyScalar(0.4); });
  root.userData.parts = { head, ears, eyes, body, tail };
  return root;
}

/** Zorro vóxel procedural (no tiene GLB: este es su modelo). Cuadrúpedo bajo, cabezota, cola con punta blanca. */
function buildVoxelFox() {
  const root = new THREE.Group();
  const OR = '#f28a24', OR2 = '#e2751a', OR3 = '#f6a043', WH = '#fbf4ea', WH2 = '#eadfce', BR = '#5b3017', BR2 = '#3f200f', BLACK = '#14141c';
  // Patas oscuras
  for (const sx of [-1, 1]) for (const sz of [-1, 1]) {
    addBox(root, 0.62, 0.9, 0.62, sx * 0.64, 0.45, sz * 0.95, BR);
    addBox(root, 0.68, 0.2, 0.78, sx * 0.64, 0.1, sz * 0.95 + 0.06, BR2);
  }
  const body = new THREE.Group();
  root.add(body);
  addBox(body, 1.9, 1.3, 2.6, 0, 1.45, 0, OR);                 // cuerpo
  addBox(body, 1.5, 0.3, 2.2, 0, 2.18, -0.1, OR3);             // lomo más claro
  addBox(body, 1.3, 0.5, 1.9, 0, 0.9, 0, WH2);                 // panza
  addBox(body, 1.3, 0.95, 0.3, 0, 1.45, 1.3, WH);              // pecho blanco
  for (const sx of [-1, 1]) addBox(body, 0.12, 0.9, 1.4, sx * 0.99, 1.5, -0.45, OR2); // flancos
  const tail = new THREE.Group();
  tail.position.set(0, 1.75, -1.3);
  tail.userData.sway = true;
  tail.rotation.x = 0.7;
  addBox(tail, 0.8, 0.8, 1.5, 0, 0, -0.7, OR);
  addBox(tail, 0.84, 0.84, 0.8, 0, 0, -1.8, WH);
  body.add(tail);

  const head = new THREE.Group();
  head.position.set(0, 2.6, 1.05);
  root.add(head);
  addBox(head, 1.9, 1.65, 1.7, 0, 0, 0.15, OR);                // cabeza
  addBox(head, 1.2, 0.3, 1.4, 0, 0.9, 0.2, OR3);              // coronilla
  addBox(head, 1.0, 0.7, 0.5, 0, -0.4, 1.15, WH);              // hocico
  addBox(head, 0.36, 0.28, 0.22, 0, -0.08, 1.45, BLACK);        // nariz
  for (const sx of [-1, 1]) addBox(head, 0.34, 0.7, 0.9, sx * 0.88, -0.4, 0.55, WH); // mejillas
  const ears = [];
  for (const sx of [-1, 1]) {
    const ear = new THREE.Group();
    ear.position.set(sx * 0.62, 0.85, 0.0);
    addBox(ear, 0.62, 0.6, 0.5, 0, 0.3, 0, OR);
    addBox(ear, 0.62, 0.26, 0.5, 0, 0.73, 0, BR);                // punta oscura
    addBox(ear, 0.32, 0.4, 0.1, 0, 0.3, 0.27, BR2);             // interior
    head.add(ear);
    ears.push(ear);
  }
  const eyes = [];
  for (const sx of [-1, 1]) {
    const eye = new THREE.Group();
    eye.position.set(sx * 0.55, 0.26, 1.01);
    addBox(eye, 0.3, 0.38, 0.1, 0, 0, 0, BLACK);
    addBox(eye, 0.09, 0.1, 0.06, sx * 0.04, 0.08, 0.07, '#ffffff');
    head.add(eye);
    eyes.push(eye);
  }
  root.userData.parts = { head, ears, eyes, body, tail };
  return root;
}

/** Jirafa vóxel procedural (no tiene GLB: este es su modelo). Cuello largo con manchas, cuernitos con bolitas. */
function buildVoxelGiraffe() {
  const root = new THREE.Group();
  const YE = '#ffcf3f', YE2 = '#f4b928', YE3 = '#ffe07a', SP = '#a8601f', SP2 = '#8a4a14', CR = '#fff1c4', BLACK = '#14141c', HOOF = '#4a2a12';
  for (const sx of [-1, 1]) for (const sz of [-1, 1]) {
    addBox(root, 0.55, 1.0, 0.55, sx * 0.62, 0.5, sz * 0.85, YE);
    addBox(root, 0.6, 0.3, 0.62, sx * 0.62, 0.15, sz * 0.85 + 0.03, HOOF);
  }
  const body = new THREE.Group();
  root.add(body);
  addBox(body, 1.9, 1.3, 2.5, 0, 1.6, 0, YE);                  // cuerpo
  addBox(body, 1.5, 0.25, 2.1, 0, 2.3, -0.05, YE3);            // lomo claro
  addBox(body, 1.3, 0.4, 1.9, 0, 1.05, 0, CR);                   // panza
  for (const sx of [-1, 1]) {                                   // manchas
    addBox(body, 0.12, 0.55, 0.6, sx * 0.97, 1.85, -0.6, SP);
    addBox(body, 0.12, 0.45, 0.5, sx * 0.97, 1.45, 0.5, SP2);
    addBox(body, 0.12, 0.35, 0.4, sx * 0.97, 2.0, 0.7, SP);
  }
  addBox(body, 0.55, 0.12, 0.55, 0.3, 2.45, -0.6, SP);
  addBox(body, 0.45, 0.12, 0.45, -0.4, 2.45, 0.3, SP2);
  const tail = new THREE.Group();
  tail.position.set(0, 2.05, -1.25);
  tail.userData.sway = true;
  addBox(tail, 0.22, 1.0, 0.22, 0, -0.5, -0.05, YE2);
  addBox(tail, 0.4, 0.4, 0.4, 0, -1.15, -0.05, SP2);
  body.add(tail);
  // Cuello: pila de tramos con manchas
  const neck = new THREE.Group();
  root.add(neck);
  addBox(neck, 0.85, 0.9, 0.9, 0, 2.6, 0.95, YE);
  addBox(neck, 0.8, 0.9, 0.85, 0, 3.4, 1.05, YE);
  addBox(neck, 0.4, 0.45, 0.12, 0.2, 2.75, 1.45, SP);
  addBox(neck, 0.45, 0.4, 0.12, -0.15, 3.55, 1.5, SP2);
  for (const sx of [-1, 1]) {
    addBox(neck, 0.12, 0.5, 0.45, sx * 0.43, 2.85, 0.95, SP);
    addBox(neck, 0.12, 0.45, 0.4, sx * 0.4, 3.6, 1.05, SP2);
  }
  addBox(neck, 0.5, 1.9, 0.12, 0, 3.0, 0.55, SP2);              // crin
  const head = new THREE.Group();
  head.position.set(0, 4.1, 1.2);
  root.add(head);
  addBox(head, 1.25, 0.95, 1.2, 0, 0, 0.15, YE);                // cabeza
  addBox(head, 0.95, 0.65, 0.55, 0, -0.2, 0.95, YE3);           // hocico
  addBox(head, 0.2, 0.18, 0.12, -0.22, -0.12, 1.24, SP2);       // fosas
  addBox(head, 0.2, 0.18, 0.12, 0.22, -0.12, 1.24, SP2);
  addBox(head, 0.6, 0.1, 0.1, 0, -0.45, 1.2, SP);               // boca
  const ears = [];
  for (const sx of [-1, 1]) {
    const ear = new THREE.Group();
    ear.position.set(sx * 0.72, 0.25, -0.05);
    addBox(ear, 0.55, 0.25, 0.4, sx * 0.22, 0, 0, YE2);
    addBox(ear, 0.25, 0.16, 0.25, sx * 0.34, 0, 0.05, SP);
    head.add(ear);
    ears.push(ear);
    addBox(head, 0.2, 0.4, 0.2, sx * 0.32, 0.65, 0.05, YE2);     // cuernitos
    addBox(head, 0.34, 0.28, 0.34, sx * 0.32, 0.98, 0.05, SP2);
  }
  const eyes = [];
  for (const sx of [-1, 1]) {
    const eye = new THREE.Group();
    eye.position.set(sx * 0.5, 0.16, 0.76);
    addBox(eye, 0.24, 0.3, 0.1, 0, 0, 0, BLACK);
    addBox(eye, 0.08, 0.09, 0.06, sx * 0.03, 0.07, 0.06, '#ffffff');
    head.add(eye);
    eyes.push(eye);
  }
  root.userData.parts = { head, ears, eyes, body, tail };
  return root;
}

function softShadow() {
  const c = document.createElement('canvas');
  c.width = c.height = 128;
  const g = c.getContext('2d');
  const grd = g.createRadialGradient(64, 64, 4, 64, 64, 62);
  grd.addColorStop(0, 'rgba(0,0,0,0.55)');
  grd.addColorStop(1, 'rgba(0,0,0,0)');
  g.fillStyle = grd; g.fillRect(0, 0, 128, 128);
  const tex = new THREE.CanvasTexture(c);
  const m = new THREE.Mesh(new THREE.PlaneGeometry(5.2, 5.2), new THREE.MeshBasicMaterial({ map: tex, transparent: true, depthWrite: false }));
  m.rotation.x = -Math.PI / 2;
  m.position.y = 0.02;
  return m;
}

function fitModel(obj, height = 4.2) {
  const box = new THREE.Box3().setFromObject(obj);
  const size = new THREE.Vector3(); box.getSize(size);
  const s = height / (size.y || 1);
  obj.scale.multiplyScalar(s);
  const b2 = new THREE.Box3().setFromObject(obj);
  const center = new THREE.Vector3(); b2.getCenter(center);
  obj.position.x -= center.x;
  obj.position.z -= center.z;
  obj.position.y -= b2.min.y;
}

export async function createCharacterViewer(container, { modelUrl, accent = '#35c6ff', platform = true, charId = 'oveja', skin = null, zoom = 1 } = {}) {
  const canvas = document.createElement('canvas');
  canvas.className = 'char-canvas';
  container.append(canvas);

  const renderer = new THREE.WebGLRenderer({ canvas, alpha: true, antialias: true });
  renderer.setPixelRatio(Math.min(devicePixelRatio, 2));
  const scene = new THREE.Scene();
  const camera = new THREE.PerspectiveCamera(30, 1, 0.1, 100);
  camera.position.set(0, 4.6, 14);
  camera.lookAt(0, 2.15, 0);

  scene.add(new THREE.HemisphereLight(0xffffff, 0x8aa0d0, 1.15));
  const key = new THREE.DirectionalLight(0xffffff, 1.7);
  key.position.set(-6, 10, 8);
  scene.add(key);
  const rim = new THREE.DirectionalLight(new THREE.Color(accent), 1.2);
  rim.position.set(7, 4, -6);
  scene.add(rim);

  const stage = new THREE.Group();
  scene.add(stage);

  let pad = null;
  if (platform) {
    pad = new THREE.Mesh(new THREE.BoxGeometry(5.6, 0.22, 5.6), mat(accent));
    pad.rotation.y = Math.PI / 4;
    pad.position.y = -0.1;
    stage.add(pad);
    const padTop = new THREE.Mesh(new THREE.BoxGeometry(4.6, 0.06, 4.6), mat('#ffffff'));
    padTop.material.transparent = true; padTop.material.opacity = 0.16;
    padTop.rotation.y = Math.PI / 4; padTop.position.y = 0.04;
    stage.add(padTop);
  }
  stage.add(softShadow());

  const hero = new THREE.Group();
  stage.add(hero);
  let model = null, mixer = null, parts = null;

  try {
    if (!modelUrl) throw new Error('sin modelo');
    const gltf = await new GLTFLoader().loadAsync(modelUrl);
    model = gltf.scene;
    fitModel(model);
    hero.add(model);
    if (gltf.animations?.length) {
      mixer = new THREE.AnimationMixer(model);
      const clip = gltf.animations.find((a) => /idle|stand|breath/i.test(a.name)) || gltf.animations[0];
      mixer.clipAction(clip).play();
    }
  } catch {
    model = charId === 'perro' ? buildVoxelDog() : charId === 'gato' ? buildVoxelCat() : charId === 'borrego' ? buildVoxelRam() : charId === 'vaca' ? buildVoxelCow() : charId === 'zorro' ? buildVoxelFox() : charId === 'jirafa' ? buildVoxelGiraffe() : buildVoxelSheep();
    parts = model.userData.parts;
    hero.add(model);
  }
  // Skin (accesorio sobre la cabeza). En vóxel sigue a la cabeza; en GLB se coloca por su caja.
  let skinGroup = null, skinBody = null;
  function setSkin(id) {
    if (skinGroup) { skinGroup.parent?.remove(skinGroup); skinGroup = null; }
    if (skinBody) { skinBody.parent?.remove(skinBody); skinBody = null; }
    if (!id) return;
    const g = buildSkin(id, charId, parts?.head ? headBounds(parts.head) : null);
    if (g) {
      skinGroup = g;
      if (parts?.head) parts.head.add(g); else placeOnGlb(model, hero, g, charId);
    }
    const b = buildSkinBody(id, charId);
    if (b) {
      skinBody = b;
      if (parts?.head) hero.add(b); else placeBodyOnGlb(model, hero, b);
    }
  }
  setSkin(skin);
  const baseRot = -0.62;
  hero.rotation.y = baseRot;

  // Interacción: arrastrar para girar, tocar para saltar.
  let dragging = false, lastX = 0, moved = 0, spin = baseRot, spinVel = 0;
  const down = (e) => { dragging = true; lastX = e.clientX; moved = 0; canvas.setPointerCapture?.(e.pointerId); };
  const move = (e) => {
    if (!dragging) return;
    const dx = e.clientX - lastX; lastX = e.clientX; moved += Math.abs(dx);
    spin += dx * 0.012; spinVel = dx * 0.012;
  };
  const up = () => { if (dragging && moved < 6) jump(); dragging = false; };
  canvas.addEventListener('pointerdown', down);
  canvas.addEventListener('pointermove', move);
  canvas.addEventListener('pointerup', up);
  canvas.addEventListener('pointercancel', () => (dragging = false));

  let jumpT = -1, blinkT = 2.5, t0 = performance.now();
  function jump() {
    if (jumpT >= 0) return;
    jumpT = 0;
    sfx(charId === 'perro' ? 'woof' : charId === 'gato' ? 'meow' : charId === 'vaca' ? 'moo' : charId === 'zorro' ? 'yip' : charId === 'jirafa' ? 'hum' : 'baa');
  }

  function resize() {
    const w = container.clientWidth || 300, h = container.clientHeight || 300;
    renderer.setSize(w, h, false);
    camera.aspect = w / h;
    // Ajusta distancia para que el personaje siempre quepa
    camera.position.z = (14 * Math.max(1, 0.9 / Math.min(1.2, camera.aspect * 1.15))) / zoom;
    camera.updateProjectionMatrix();
  }
  const ro = new ResizeObserver(resize);
  ro.observe(container);
  resize();

  let raf = 0, alive = true, last = performance.now();
  function frame(now) {
    if (!alive) return;
    raf = requestAnimationFrame(frame);
    const dt = Math.min(0.05, (now - last) / 1000); last = now;
    const t = (now - t0) / 1000;

    // Giro con inercia y retorno suave a la pose base
    if (!dragging) {
      spin += spinVel; spinVel *= 0.92;
      spin += (baseRot + Math.sin(t * 0.6) * 0.12 - spin) * 0.02;
    }
    hero.rotation.y = spin;

    // Respiración + salto
    let sy = 1 + Math.sin(t * 2.2) * 0.012, py = 0;
    if (jumpT >= 0) {
      jumpT += dt;
      const p = jumpT / 0.7;
      if (p >= 1) { jumpT = -1; }
      else {
        py = Math.sin(p * Math.PI) * 1.6;
        sy = p < 0.15 ? 1 - p * 2.2 : p > 0.85 ? 1 - (1 - p) * 2.2 : 1 + Math.sin(p * Math.PI) * 0.1;
      }
    }
    hero.position.y = py;
    hero.scale.set(1 / Math.sqrt(sy), sy, 1 / Math.sqrt(sy));

    skinGroup?.userData.tick?.(t); skinBody?.userData.tick?.(t);
    if (parts) {
      parts.head.rotation.z = Math.sin(t * 1.3) * 0.05;
      parts.head.rotation.x = Math.sin(t * 1.9) * 0.025;
      parts.ears.forEach((e, i) => { e.rotation.z = (e.userData.base || 0) + Math.sin(t * 3 + i * 2) * 0.08 * (i ? 1 : -1) + (jumpT >= 0 ? (i ? 0.5 : -0.5) : 0); });
      if (parts.tail) parts.tail.rotation[parts.tail.userData.sway ? 'z' : 'y'] = Math.sin(t * (jumpT >= 0 ? 14 : 5)) * (jumpT >= 0 ? 0.6 : 0.3);
      blinkT -= dt;
      const k = blinkT < 0 && blinkT > -0.12 ? 0.1 : 1;
      parts.eyes.forEach((e) => (e.scale.y = k));
      if (blinkT < -0.12) blinkT = 2.2 + Math.random() * 3;
    }
    if (pad) pad.rotation.y = Math.PI / 4 + Math.sin(t * 0.5) * 0.03;
    mixer?.update(dt);
    renderer.render(scene, camera);
  }
  raf = requestAnimationFrame(frame);

  return {
    jump,
    setSkin,
    setAccent(hex) {
      if (pad) pad.material.color.set(hex);
      rim.color.set(hex);
    },
    dispose() {
      alive = false;
      cancelAnimationFrame(raf);
      ro.disconnect();
      renderer.dispose();
      canvas.remove();
    },
  };
}
