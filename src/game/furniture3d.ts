"use client";

/**
 * furniture3d — parametric toon-shaded 3D furniture kit for the manor
 * rooms. Every shop item (35 items x 3 style variants) is composed from
 * cartoon primitives. Builders return a THREE.Group whose origin sits at
 * the floor under the item's center; RoomScene3D handles placement,
 * fake shadows, disposal and tap targets.
 */

import * as THREE from "three";
import { toonMat } from "./three-kit";

export type StyleIdx = 0 | 1 | 2; // classic / modern / rustic

interface StylePalette {
  wood: number;
  woodDark: number;
  fabric: number;
  fabricSoft: number;
  accent: number;
  metal: number;
  cushion: number;
  green: number;
  pot: number;
}

export const STYLES: StylePalette[] = [
  // classic — warm cherry wood, crimson & gold
  { wood: 0x8c5b33, woodDark: 0x6d4426, fabric: 0xc0392b, fabricSoft: 0xe8b4a0, accent: 0xf5b301, metal: 0xd9a441, cushion: 0xf6d8a8, green: 0x55b85b, pot: 0xb06a3b },
  // modern — slate wood, teal & sky blue
  { wood: 0x5a6b73, woodDark: 0x3d4a50, fabric: 0x3ec5b0, fabricSoft: 0xa8ded6, accent: 0x5a8fde, metal: 0xb8c0c8, cushion: 0xe8eef2, green: 0x67c97b, pot: 0x8d99a2 },
  // rustic — honey oak, pumpkin & moss
  { wood: 0xa9713f, woodDark: 0x7c5227, fabric: 0xd97742, fabricSoft: 0xf0c9a0, accent: 0x8bc34a, metal: 0xb98a55, cushion: 0xf3e3c8, green: 0x4c9e4f, pot: 0x96552f },
];

const GLOW = 0xfff3c4;

/* --------------------------- tiny helpers --------------------------- */

type G = THREE.Group;
function grp(name?: string): G {
  const g = new THREE.Group();
  if (name) g.name = name;
  return g;
}
function box(parent: THREE.Object3D, w: number, h: number, d: number, color: number, grad: THREE.DataTexture, x = 0, y = 0, z = 0): THREE.Mesh {
  const m = new THREE.Mesh(new THREE.BoxGeometry(w, h, d), toonMat(color, grad));
  m.position.set(x, y, z);
  parent.add(m);
  return m;
}
function cyl(parent: THREE.Object3D, rt: number, rb: number, h: number, color: number, grad: THREE.DataTexture, x = 0, y = 0, z = 0, seg = 16): THREE.Mesh {
  const m = new THREE.Mesh(new THREE.CylinderGeometry(rt, rb, h, seg), toonMat(color, grad));
  m.position.set(x, y, z);
  parent.add(m);
  return m;
}
function ball(parent: THREE.Object3D, r: number, color: number, grad: THREE.DataTexture, x = 0, y = 0, z = 0, seg = 14): THREE.Mesh {
  const m = new THREE.Mesh(new THREE.SphereGeometry(r, seg, seg), toonMat(color, grad));
  m.position.set(x, y, z);
  parent.add(m);
  return m;
}
function cone(parent: THREE.Object3D, r: number, h: number, color: number, grad: THREE.DataTexture, x = 0, y = 0, z = 0, seg = 14): THREE.Mesh {
  const m = new THREE.Mesh(new THREE.ConeGeometry(r, h, seg), toonMat(color, grad));
  m.position.set(x, y, z);
  parent.add(m);
  return m;
}
function glowBall(parent: THREE.Object3D, r: number, x = 0, y = 0, z = 0): THREE.Mesh {
  const m = new THREE.Mesh(new THREE.SphereGeometry(r, 10, 10), new THREE.MeshBasicMaterial({ color: GLOW }));
  m.position.set(x, y, z);
  parent.add(m);
  return m;
}

/* ----------------------------- builders ----------------------------- */

function legs4(parent: G, grad: THREE.DataTexture, color: number, h: number, w: number, d: number, r = 0.05) {
  for (const [lx, lz] of [[-w, -d], [w, -d], [-w, d], [w, d]]) {
    cyl(parent, r, r, h, color, grad, lx, h / 2, lz, 10);
  }
}

function buildSofa(st: StylePalette, grad: THREE.DataTexture): G {
  const g = grp("sofa");
  box(g, 1.7, 0.42, 0.78, st.wood, grad, 0, 0.26, 0); // frame
  box(g, 1.62, 0.18, 0.7, st.fabricSoft, grad, 0, 0.5, 0); // seat base
  box(g, 1.7, 0.62, 0.2, st.fabric, grad, 0, 0.68, -0.29); // back
  box(g, 0.18, 0.34, 0.78, st.fabric, grad, -0.76, 0.62, 0); // arms
  box(g, 0.18, 0.34, 0.78, st.fabric, grad, 0.76, 0.62, 0);
  box(g, 0.66, 0.12, 0.56, st.cushion, grad, -0.32, 0.63, 0.02);
  box(g, 0.66, 0.12, 0.56, st.cushion, grad, 0.32, 0.63, 0.02);
  box(g, 0.3, 0.26, 0.08, st.accent, grad, -0.3, 0.82, -0.16); // pillow
  box(g, 0.3, 0.26, 0.08, st.fabricSoft, grad, 0.34, 0.8, -0.16);
  legs4(g, grad, st.woodDark, 0.1, 0.72, 0.28);
  return g;
}

function buildArmchair(st: StylePalette, grad: THREE.DataTexture): G {
  const g = grp("armchair");
  box(g, 0.9, 0.4, 0.72, st.wood, grad, 0, 0.25, 0);
  box(g, 0.84, 0.16, 0.62, st.fabricSoft, grad, 0, 0.47, 0);
  box(g, 0.9, 0.56, 0.18, st.fabric, grad, 0, 0.66, -0.27);
  box(g, 0.14, 0.3, 0.7, st.fabric, grad, -0.38, 0.58, 0);
  box(g, 0.14, 0.3, 0.7, st.fabric, grad, 0.38, 0.58, 0);
  box(g, 0.24, 0.2, 0.08, st.accent, grad, 0, 0.72, -0.14);
  legs4(g, grad, st.woodDark, 0.1, 0.34, 0.26);
  return g;
}

function buildTable(st: StylePalette, grad: THREE.DataTexture, w: number, round: boolean): G {
  const g = grp("table");
  if (round) {
    cyl(g, w / 2, w / 2, 0.08, st.wood, grad, 0, 0.62, 0, 20);
    cyl(g, 0.09, 0.12, 0.58, st.woodDark, grad, 0, 0.31, 0, 10);
    cyl(g, 0.34, 0.38, 0.07, st.woodDark, grad, 0, 0.04, 0, 16);
  } else {
    box(g, w, 0.08, 0.62, st.wood, grad, 0, 0.6, 0);
    legs4(g, grad, st.woodDark, 0.58, w / 2 - 0.08, 0.22, 0.045);
    box(g, 0.5, 0.1, 0.34, st.accent, grad, 0.1, 0.69, 0); // little tray
    ball(g, 0.09, st.fabric, grad, -0.12, 0.74, 0);
  }
  return g;
}

function buildChair(st: StylePalette, grad: THREE.DataTexture): G {
  const g = grp("chair");
  box(g, 0.5, 0.07, 0.5, st.wood, grad, 0, 0.44, 0);
  box(g, 0.5, 0.52, 0.07, st.fabric, grad, 0, 0.72, -0.22);
  legs4(g, grad, st.woodDark, 0.42, 0.2, 0.2, 0.04);
  return g;
}

function buildShadeLamp(st: StylePalette, grad: THREE.DataTexture, tall: boolean): G {
  const g = grp("lamp");
  const h = tall ? 1.5 : 0.62;
  cyl(g, 0.16, 0.22, 0.06, st.metal, grad, 0, 0.03, 0, 14);
  cyl(g, 0.045, 0.045, h, st.metal, grad, 0, h / 2 + 0.04, 0, 8);
  cone(g, tall ? 0.3 : 0.22, 0.26, st.fabric, grad, 0, h + 0.16, 0, 16);
  glowBall(g, 0.07, 0, h + 0.06, 0);
  return g;
}

function buildChandelier(st: StylePalette, grad: THREE.DataTexture, big: boolean): G {
  const g = grp("chandelier");
  const s = big ? 1.25 : 1;
  cyl(g, 0.022 * s, 0.022 * s, 0.5 * s, st.metal, grad, 0, 0.75 * s, 0, 8); // stem (origin at ceiling)
  const hub = new THREE.Mesh(new THREE.TorusGeometry(0.34 * s, 0.035 * s, 8, 20), toonMat(st.metal, grad));
  hub.rotation.x = Math.PI / 2;
  hub.position.y = 0.45 * s;
  g.add(hub);
  for (let i = 0; i < 6; i++) {
    const a = (i / 6) * Math.PI * 2;
    const x = Math.cos(a) * 0.34 * s;
    const z = Math.sin(a) * 0.34 * s;
    cone(g, 0.1 * s, 0.18 * s, st.fabric, grad, x, (0.45 + 0.1) * s, z, 10);
    glowBall(g, 0.055 * s, x, 0.44 * s, z);
    cyl(g, 0.014 * s, 0.014 * s, 0.12 * s, st.metal, grad, x, (0.45 + 0.2) * s, z, 6);
  }
  ball(g, 0.09 * s, st.accent, grad, 0, 0.44 * s, 0);
  return g;
}

function buildPendant(st: StylePalette, grad: THREE.DataTexture): G {
  const g = grp("pendant");
  cyl(g, 0.02, 0.02, 0.55, st.metal, grad, 0, 0.82, 0, 6);
  cone(g, 0.26, 0.3, st.metal, grad, 0, 0.42, 0, 16);
  glowBall(g, 0.1, 0, 0.3, 0);
  return g;
}

function buildCurtain(st: StylePalette, grad: THREE.DataTexture, w = 1.5): G {
  const g = grp("curtain");
  cyl(g, 0.025, 0.025, w + 0.24, st.metal, grad, 0, 1.72, 0, 8).rotation.z = Math.PI / 2;
  for (const sx of [-1, 1]) {
    const panel = box(g, w * 0.32, 1.6, 0.07, st.fabric, grad, sx * w * 0.31, 0.9, 0);
    panel.rotation.y = sx * 0.1;
    box(g, w * 0.1, 1.6, 0.05, st.fabricSoft, grad, sx * w * 0.16, 0.9, 0.04).rotation.y = sx * 0.18;
  }
  return g;
}

function buildRug(st: StylePalette, grad: THREE.DataTexture, w: number, d: number): G {
  const g = grp("rug");
  box(g, w, 0.03, d, st.fabric, grad, 0, 0.015, 0);
  box(g, w * 0.8, 0.035, d * 0.7, st.cushion, grad, 0, 0.02, 0);
  const rows = 3;
  for (let r = 0; r < rows; r++) {
    for (let c = 0; c < 4; c++) {
      box(g, 0.12, 0.04, 0.12, st.accent, grad, -w * 0.3 + c * w * 0.2, 0.045, -d * 0.22 + r * d * 0.22);
    }
  }
  return g;
}

function buildBookcase(st: StylePalette, grad: THREE.DataTexture): G {
  const g = grp("bookcase");
  box(g, 1.3, 1.7, 0.34, st.wood, grad, 0, 0.85, 0);
  const bookColors = [0xe2725b, 0x5a8fde, 0x55b85b, 0xf5b301, 0xa267d8, 0xf06ea9];
  for (let r = 0; r < 4; r++) {
    box(g, 1.2, 0.05, 0.3, st.woodDark, grad, 0, 0.3 + r * 0.4, 0.02);
    for (let b = 0; b < 7; b++) {
      const h = 0.22 + ((r * 7 + b) % 3) * 0.05;
      box(g, 0.1, h, 0.2, bookColors[(r * 3 + b) % 6], grad, -0.5 + b * 0.16, 0.32 + r * 0.4 + h / 2, 0.03);
    }
  }
  return g;
}

function buildShelf(st: StylePalette, grad: THREE.DataTexture): G {
  const g = grp("shelf");
  box(g, 0.95, 0.06, 0.3, st.wood, grad, 0, 1.0, 0);
  box(g, 0.06, 0.24, 0.28, st.woodDark, grad, -0.42, 0.88, 0);
  box(g, 0.06, 0.24, 0.28, st.woodDark, grad, 0.42, 0.88, 0);
  ball(g, 0.11, st.pot, grad, -0.3, 1.12, 0);
  box(g, 0.14, 0.26, 0.14, st.accent, grad, -0.05, 1.15, 0);
  ball(g, 0.09, st.fabric, grad, 0.25, 1.1, 0);
  return g;
}

function buildCabinet(st: StylePalette, grad: THREE.DataTexture): G {
  const g = grp("cabinet");
  box(g, 2.0, 0.8, 0.62, st.wood, grad, 0, 0.4, 0);
  box(g, 2.1, 0.08, 0.7, st.woodDark, grad, 0, 0.84, 0); // countertop
  for (const dx of [-0.5, 0, 0.5]) {
    box(g, 0.44, 0.5, 0.04, st.fabricSoft, grad, dx, 0.44, 0.32);
    ball(g, 0.035, st.metal, grad, dx, 0.44, 0.36);
  }
  box(g, 2.0, 0.5, 0.06, st.cushion, grad, 0, 1.15, -0.26); // backsplash
  return g;
}

function buildBed(st: StylePalette, grad: THREE.DataTexture): G {
  const g = grp("bed");
  box(g, 1.1, 0.28, 1.9, st.wood, grad, 0, 0.2, 0);
  box(g, 1.02, 0.2, 1.78, st.cushion, grad, 0, 0.42, 0); // mattress
  box(g, 1.02, 0.12, 1.1, st.fabric, grad, 0, 0.5, 0.3); // blanket
  box(g, 1.14, 0.7, 0.14, st.woodDark, grad, 0, 0.6, -0.94); // headboard
  box(g, 0.5, 0.14, 0.3, st.fabricSoft, grad, 0, 0.56, -0.62); // pillow
  legs4(g, grad, st.woodDark, 0.12, 0.48, 0.86);
  return g;
}

function buildWardrobe(st: StylePalette, grad: THREE.DataTexture): G {
  const g = grp("wardrobe");
  box(g, 1.1, 1.85, 0.5, st.wood, grad, 0, 0.93, 0);
  for (const dx of [-0.26, 0.26]) {
    box(g, 0.46, 1.6, 0.04, st.fabricSoft, grad, dx, 0.95, 0.26);
    ball(g, 0.04, st.metal, grad, dx > 0 ? dx - 0.16 : dx + 0.16, 0.95, 0.3);
  }
  box(g, 1.2, 0.08, 0.56, st.woodDark, grad, 0, 1.9, 0); // crown
  return g;
}

function buildPotPlant(st: StylePalette, grad: THREE.DataTexture, big: boolean): G {
  const g = grp("plant");
  const s = big ? 1.35 : 0.9;
  cyl(g, 0.22 * s, 0.3 * s, 0.4 * s, st.pot, grad, 0, 0.2 * s, 0, 14);
  cyl(g, 0.26 * s, 0.26 * s, 0.06, st.pot, grad, 0, 0.42 * s, 0, 14); // rim
  cyl(g, 0.05 * s, 0.07 * s, 0.5 * s, 0x6d4426, grad, 0, 0.66 * s, 0, 8); // trunk
  ball(g, 0.3 * s, st.green, grad, 0, 1.0 * s, 0, 12);
  ball(g, 0.2 * s, st.green, grad, 0.2 * s, 0.85 * s, 0.08 * s, 10);
  ball(g, 0.18 * s, st.green, grad, -0.2 * s, 0.9 * s, -0.05 * s, 10);
  ball(g, 0.12 * s, st.accent, grad, 0.05 * s, 1.18 * s, 0.1 * s, 8); // bloom
  return g;
}

function buildFlowerBed(st: StylePalette, grad: THREE.DataTexture): G {
  const g = grp("flowerbed");
  box(g, 1.3, 0.22, 0.7, st.woodDark, grad, 0, 0.11, 0);
  box(g, 1.18, 0.1, 0.58, 0x7a5230, grad, 0, 0.24, 0); // soil
  const petals = [0xf06ea9, 0xf5b301, 0xe94f4f, 0xa267d8, 0xffc98a];
  for (let i = 0; i < 7; i++) {
    const x = -0.48 + (i % 4) * 0.32 + (i > 3 ? 0.16 : 0);
    const z = i < 4 ? -0.14 : 0.16;
    cyl(g, 0.02, 0.02, 0.22, 0x4c9e4f, grad, x, 0.38, z, 6);
    ball(g, 0.09, petals[i % petals.length], grad, x, 0.5, z, 8);
  }
  return g;
}

function buildFlowerStand(st: StylePalette, grad: THREE.DataTexture): G {
  const g = grp("flowerstand");
  cyl(g, 0.03, 0.05, 1.1, st.metal, grad, 0, 0.55, 0, 8);
  for (const [y, r] of [[0.28, 0.34], [0.62, 0.3], [0.96, 0.26]] as const) {
    cyl(g, r, r * 0.85, 0.05, st.fabric, grad, 0, y, 0, 16);
    const potN = y > 0.9 ? 1 : 2;
    for (let i = 0; i < potN; i++) {
      const px = potN === 1 ? 0 : i === 0 ? -0.14 : 0.14;
      cyl(g, 0.08, 0.1, 0.14, st.pot, grad, px, y + 0.1, 0, 8);
      ball(g, 0.09, i === 0 ? 0xf06ea9 : 0xf5b301, grad, px, y + 0.24, 0, 8);
      ball(g, 0.06, st.green, grad, px + 0.08, y + 0.2, 0.04, 8);
    }
  }
  return g;
}

function buildGreenShelf(st: StylePalette, grad: THREE.DataTexture): G {
  const g = grp("greenshelf");
  box(g, 1.0, 0.05, 0.34, st.wood, grad, 0, 0.35, 0);
  box(g, 1.0, 0.05, 0.34, st.wood, grad, 0, 0.85, 0);
  box(g, 0.06, 0.85, 0.32, st.woodDark, grad, -0.47, 0.43, 0);
  box(g, 0.06, 0.85, 0.32, st.woodDark, grad, 0.47, 0.43, 0);
  const greens = [0x55b85b, 0x3ec5b0, 0x67c97b, 0x4c9e4f];
  for (const [x, y] of [[-0.28, 0.35], [0.1, 0.35], [0.34, 0.35], [-0.15, 0.85], [0.25, 0.85]] as const) {
    cyl(g, 0.09, 0.11, 0.15, st.pot, grad, x, y + 0.1, 0, 8);
    ball(g, 0.12, greens[(x * 10 + y * 10) % 4 | 0], grad, x, y + 0.26, 0, 10);
  }
  return g;
}

function buildGrowLamp(st: StylePalette, grad: THREE.DataTexture): G {
  const g = grp("growlamp");
  for (const sx of [-0.4, 0.4]) cyl(g, 0.015, 0.015, 0.4, st.metal, grad, sx, 0.9, 0, 6);
  box(g, 1.0, 0.07, 0.16, st.metal, grad, 0, 0.68, 0);
  const tube = new THREE.Mesh(new THREE.CylinderGeometry(0.045, 0.045, 0.9, 10), new THREE.MeshBasicMaterial({ color: 0xd8ffc8 }));
  tube.rotation.z = Math.PI / 2;
  tube.position.y = 0.62;
  g.add(tube);
  return g;
}

function buildWateringSet(st: StylePalette, grad: THREE.DataTexture): G {
  const g = grp("watering");
  cyl(g, 0.16, 0.18, 0.26, st.metal, grad, 0, 0.15, 0, 12);
  const spout = cyl(g, 0.03, 0.045, 0.3, st.metal, grad, 0.16, 0.24, 0, 8);
  spout.rotation.z = -0.8;
  const handle = new THREE.Mesh(new THREE.TorusGeometry(0.1, 0.02, 6, 12, Math.PI), toonMat(st.metal, grad));
  handle.position.set(-0.02, 0.28, 0);
  g.add(handle);
  cyl(g, 0.06, 0.07, 0.08, st.accent, grad, 0, 0.32, 0, 8); // cap
  return g;
}

function buildFountain(st: StylePalette, grad: THREE.DataTexture): G {
  const g = grp("fountain");
  cyl(g, 0.62, 0.72, 0.26, 0xcdbfa3, grad, 0, 0.13, 0, 22);
  const water = new THREE.Mesh(new THREE.CylinderGeometry(0.54, 0.54, 0.06, 22), new THREE.MeshBasicMaterial({ color: 0x7fd4e8, transparent: true, opacity: 0.85 }));
  water.position.y = 0.26;
  g.add(water);
  cyl(g, 0.09, 0.12, 0.5, 0xcdbfa3, grad, 0, 0.45, 0, 12);
  cyl(g, 0.34, 0.4, 0.1, 0xcdbfa3, grad, 0, 0.68, 0, 18);
  const water2 = new THREE.Mesh(new THREE.CylinderGeometry(0.28, 0.28, 0.05, 18), new THREE.MeshBasicMaterial({ color: 0x8fdeef, transparent: true, opacity: 0.85 }));
  water2.position.y = 0.73;
  g.add(water2);
  ball(g, 0.1, 0x9fe8f5, grad, 0, 0.85, 0, 10);
  return g;
}

function buildBench(st: StylePalette, grad: THREE.DataTexture): G {
  const g = grp("bench");
  box(g, 1.2, 0.08, 0.42, st.wood, grad, 0, 0.42, 0);
  for (let i = 0; i < 3; i++) box(g, 1.2, 0.1, 0.06, st.woodDark, grad, 0, 0.56 + i * 0.14, -0.2);
  for (const dx of [-0.5, 0.5]) {
    box(g, 0.08, 0.42, 0.36, st.woodDark, grad, dx, 0.21, 0);
    box(g, 0.08, 0.4, 0.06, st.woodDark, grad, dx, 0.6, -0.2);
  }
  return g;
}

function buildGardenLamp(st: StylePalette, grad: THREE.DataTexture): G {
  const g = grp("gardenlamp");
  cyl(g, 0.05, 0.08, 0.9, 0x4a4a52, grad, 0, 0.45, 0, 8);
  box(g, 0.22, 0.26, 0.22, 0x4a4a52, grad, 0, 1.02, 0);
  glowBall(g, 0.07, 0, 1.02, 0);
  cone(g, 0.17, 0.12, st.metal, grad, 0, 1.2, 0, 10);
  return g;
}

function buildMirror(st: StylePalette, grad: THREE.DataTexture): G {
  const g = grp("mirror");
  const frame = new THREE.Mesh(new THREE.TorusGeometry(0.42, 0.05, 10, 26), toonMat(st.metal, grad));
  frame.position.y = 1.25;
  g.add(frame);
  const glass = new THREE.Mesh(new THREE.CircleGeometry(0.4, 26), new THREE.MeshPhongMaterial({ color: 0xcfe8f2, shininess: 100, specular: 0xffffff }));
  glass.position.set(0, 1.25, 0.01);
  g.add(glass);
  box(g, 0.16, 0.5, 0.3, st.metal, grad, 0, 0.28, 0); // stand base
  box(g, 0.1, 0.42, 0.1, st.woodDark, grad, 0, 0.72, 0);
  return g;
}

function buildConsoleTable(st: StylePalette, grad: THREE.DataTexture): G {
  const g = grp("console");
  box(g, 1.2, 0.07, 0.44, st.wood, grad, 0, 0.68, 0);
  box(g, 0.7, 0.18, 0.38, st.fabricSoft, grad, 0, 0.5, 0); // drawer
  ball(g, 0.03, st.metal, grad, 0, 0.5, 0.2);
  for (const dx of [-0.52, 0.52]) {
    cyl(g, 0.035, 0.045, 0.66, st.woodDark, grad, dx, 0.34, 0, 8);
  }
  ball(g, 0.1, st.accent, grad, -0.3, 0.78, 0);
  box(g, 0.18, 0.24, 0.12, st.fabric, grad, 0.3, 0.8, 0);
  return g;
}

function buildKitchenDecor(st: StylePalette, grad: THREE.DataTexture): G {
  const g = grp("kitchendecor");
  box(g, 0.6, 0.05, 0.3, st.wood, grad, 0, 0.9, 0); // wall tray
  const jars = [st.accent, st.fabric, st.green];
  jars.forEach((c, i) => {
    cyl(g, 0.09, 0.09, 0.2, c, grad, -0.18 + i * 0.18, 1.03, 0, 10);
    cyl(g, 0.06, 0.06, 0.05, st.metal, grad, -0.18 + i * 0.18, 1.16, 0, 8);
  });
  return g;
}

function buildHallPlant(st: StylePalette, grad: THREE.DataTexture): G {
  const g = grp("hallplant");
  cyl(g, 0.2, 0.26, 0.34, st.pot, grad, 0, 0.17, 0, 14);
  for (let i = 0; i < 5; i++) {
    const a = (i / 5) * Math.PI * 2;
    const leaf = cone(g, 0.16, 0.55, st.green, grad, Math.cos(a) * 0.14, 0.72, Math.sin(a) * 0.14, 8);
    leaf.rotation.z = Math.cos(a) * 0.5;
    leaf.rotation.x = Math.sin(a) * 0.5;
  }
  cone(g, 0.14, 0.6, st.accent, grad, 0, 0.85, 0, 8);
  return g;
}

/* -------------------- new builders (110-level campaign) -------------------- */

function buildWallArt(st: StylePalette, grad: THREE.DataTexture): G {
  const g = grp("wallart");
  box(g, 0.85, 0.62, 0.06, st.woodDark, grad, 0, 0.15, 0); // frame (centered on anchor)
  const canvas = new THREE.Mesh(new THREE.PlaneGeometry(0.72, 0.5), toonMat(st.fabric, grad));
  canvas.position.set(0, 0.15, 0.035);
  g.add(canvas);
  box(g, 0.22, 0.16, 0.02, st.accent, grad, -0.14, 0.22, 0.045); // hills motif
  box(g, 0.3, 0.12, 0.02, st.green, grad, 0.08, 0.06, 0.045);
  ball(g, 0.06, st.metal, grad, 0.2, 0.3, 0.05); // sun
  return g;
}

function buildSconce(st: StylePalette, grad: THREE.DataTexture): G {
  const g = grp("sconce");
  box(g, 0.07, 0.3, 0.06, st.metal, grad, 0, 0.12, 0.02);
  box(g, 0.24, 0.05, 0.05, st.metal, grad, 0.09, 0.3, 0.04);
  cone(g, 0.13, 0.18, st.fabric, grad, 0.17, 0.44, 0.04, 12);
  glowBall(g, 0.05, 0.17, 0.38, 0.04);
  return g;
}

function buildWallShelf(st: StylePalette, grad: THREE.DataTexture): G {
  const g = grp("wallshelf");
  box(g, 0.8, 0.05, 0.24, st.wood, grad, 0, 0.3, 0);
  box(g, 0.05, 0.16, 0.2, st.woodDark, grad, -0.3, 0.2, 0);
  box(g, 0.05, 0.16, 0.2, st.woodDark, grad, 0.3, 0.2, 0);
  cyl(g, 0.08, 0.08, 0.16, st.accent, grad, -0.2, 0.42, 0, 10);
  cyl(g, 0.07, 0.07, 0.12, st.fabric, grad, 0.02, 0.4, 0, 10);
  ball(g, 0.09, st.green, grad, 0.24, 0.44, 0);
  return g;
}

function buildWallMap(st: StylePalette, grad: THREE.DataTexture): G {
  const g = grp("wallmap");
  box(g, 0.8, 0.6, 0.05, st.woodDark, grad, 0, 0.15, 0);
  const map = new THREE.Mesh(new THREE.PlaneGeometry(0.7, 0.5), toonMat(0xbfe0e8, grad));
  map.position.set(0, 0.15, 0.03);
  g.add(map);
  box(g, 0.24, 0.16, 0.02, st.green, grad, -0.14, 0.24, 0.045);
  box(g, 0.18, 0.13, 0.02, st.accent, grad, 0.12, 0.05, 0.045);
  box(g, 0.1, 0.09, 0.02, st.fabricSoft, grad, 0.2, 0.28, 0.045);
  return g;
}

function buildBathMirror(st: StylePalette, grad: THREE.DataTexture): G {
  const g = grp("bathmirror");
  const frame = new THREE.Mesh(new THREE.TorusGeometry(0.26, 0.045, 10, 24), toonMat(st.metal, grad));
  frame.position.y = 0.22;
  g.add(frame);
  const glass = new THREE.Mesh(new THREE.CircleGeometry(0.24, 24), new THREE.MeshPhongMaterial({ color: 0xd6ecf4, shininess: 100, specular: 0xffffff }));
  glass.position.set(0, 0.22, 0.01);
  g.add(glass);
  box(g, 0.36, 0.04, 0.14, st.fabric, grad, 0, -0.14, 0.02); // small shelf
  ball(g, 0.04, st.accent, grad, 0.1, -0.08, 0.03); // soap
  return g;
}

function buildTowelRack(st: StylePalette, grad: THREE.DataTexture): G {
  const g = grp("towelrack");
  cyl(g, 0.02, 0.02, 0.56, st.metal, grad, 0, 0.12, 0.08, 8).rotation.z = Math.PI / 2;
  box(g, 0.05, 0.16, 0.06, st.metal, grad, -0.25, 0.1, 0.02);
  box(g, 0.05, 0.16, 0.06, st.metal, grad, 0.25, 0.1, 0.02);
  box(g, 0.16, 0.34, 0.04, st.fabric, grad, -0.13, -0.08, 0.08);
  box(g, 0.14, 0.28, 0.04, st.accent, grad, 0.11, -0.06, 0.08);
  return g;
}

function buildHangingPlant(st: StylePalette, grad: THREE.DataTexture): G {
  const g = grp("hangingplant");
  cyl(g, 0.012, 0.012, 0.4, st.metal, grad, 0, 0.28, 0, 6); // cord up to ceiling
  cyl(g, 0.13, 0.1, 0.18, st.pot, grad, 0, 0.0, 0, 12);
  cyl(g, 0.15, 0.15, 0.04, st.pot, grad, 0, 0.1, 0, 12); // rim
  ball(g, 0.15, st.green, grad, 0, -0.12, 0, 12);
  ball(g, 0.11, st.green, grad, 0.09, -0.26, 0.04, 10);
  ball(g, 0.09, st.fabricSoft, grad, -0.08, -0.22, -0.03, 10);
  ball(g, 0.05, st.accent, grad, 0.03, -0.34, 0.02, 8);
  return g;
}

function buildGlobe(st: StylePalette, grad: THREE.DataTexture): G {
  const g = grp("globe");
  cyl(g, 0.13, 0.17, 0.06, st.woodDark, grad, 0, 0.03, 0, 14);
  cyl(g, 0.02, 0.02, 0.14, st.metal, grad, 0, 0.13, 0, 8);
  ball(g, 0.17, 0x5a8fde, grad, 0, 0.36, 0, 16);
  ball(g, 0.07, st.green, grad, 0.08, 0.42, 0.08, 10);
  ball(g, 0.06, st.accent, grad, -0.09, 0.3, 0.1, 10);
  ball(g, 0.05, st.green, grad, 0.05, 0.28, -0.13, 10);
  return g;
}

function buildFridge(st: StylePalette, grad: THREE.DataTexture): G {
  const g = grp("fridge");
  box(g, 0.7, 1.5, 0.55, st.cushion, grad, 0, 0.75, 0);
  box(g, 0.72, 0.04, 0.57, st.metal, grad, 0, 1.06, 0); // door split
  box(g, 0.04, 0.28, 0.04, st.metal, grad, 0.26, 1.28, 0.29);
  box(g, 0.04, 0.44, 0.04, st.metal, grad, 0.26, 0.78, 0.29);
  ball(g, 0.045, st.accent, grad, -0.15, 1.25, 0.29);
  ball(g, 0.045, st.fabric, grad, -0.05, 1.15, 0.29);
  ball(g, 0.045, st.green, grad, -0.22, 1.12, 0.29);
  return g;
}

function buildDresser(st: StylePalette, grad: THREE.DataTexture): G {
  const g = grp("dresser");
  box(g, 1.0, 0.6, 0.45, st.wood, grad, 0, 0.3, 0);
  box(g, 1.06, 0.06, 0.5, st.woodDark, grad, 0, 0.63, 0);
  for (const dy of [0.42, 0.18]) {
    for (const dx of [-0.22, 0.22]) {
      box(g, 0.42, 0.2, 0.03, st.fabricSoft, grad, dx, dy, 0.23);
      ball(g, 0.03, st.metal, grad, dx, dy, 0.26);
    }
  }
  cyl(g, 0.07, 0.09, 0.14, st.pot, grad, -0.35, 0.72, 0, 10);
  ball(g, 0.08, st.accent, grad, -0.35, 0.85, 0, 10);
  return g;
}

function buildWorkbench(st: StylePalette, grad: THREE.DataTexture): G {
  const g = grp("workbench");
  box(g, 1.3, 0.07, 0.55, st.wood, grad, 0, 0.62, 0);
  legs4(g, grad, st.woodDark, 0.6, 0.55, 0.2, 0.04);
  box(g, 1.05, 0.04, 0.4, st.woodDark, grad, 0, 0.22, 0);
  cyl(g, 0.09, 0.11, 0.16, st.pot, grad, -0.35, 0.74, 0, 10);
  ball(g, 0.1, st.green, grad, -0.35, 0.9, 0, 10);
  cyl(g, 0.08, 0.1, 0.12, st.pot, grad, 0.15, 0.72, 0.05, 10);
  ball(g, 0.09, st.fabricSoft, grad, 0.15, 0.86, 0.05, 10);
  box(g, 0.22, 0.05, 0.16, st.accent, grad, 0.45, 0.69, 0);
  return g;
}

function buildBirdhouse(st: StylePalette, grad: THREE.DataTexture): G {
  const g = grp("birdhouse");
  cyl(g, 0.14, 0.16, 0.05, st.woodDark, grad, 0, 0.03, 0, 12);
  cyl(g, 0.04, 0.05, 0.9, st.woodDark, grad, 0, 0.48, 0, 8);
  box(g, 0.34, 0.3, 0.3, st.wood, grad, 0, 1.05, 0);
  cone(g, 0.3, 0.2, st.fabric, grad, 0, 1.3, 0, 4);
  ball(g, 0.05, 0x3a2a18, grad, 0, 1.06, 0.16, 8);
  cyl(g, 0.015, 0.015, 0.1, st.accent, grad, 0, 0.98, 0.2, 6).rotation.x = Math.PI / 2;
  return g;
}

function buildUmbrella(st: StylePalette, grad: THREE.DataTexture): G {
  const g = grp("umbrella");
  cyl(g, 0.16, 0.2, 0.06, st.woodDark, grad, 0, 0.03, 0, 14);
  cyl(g, 0.028, 0.035, 1.7, st.metal, grad, 0, 0.88, 0, 8);
  cone(g, 0.85, 0.42, st.fabric, grad, 0, 1.8, 0, 10);
  ball(g, 0.06, st.accent, grad, 0, 2.05, 0, 8);
  return g;
}

function buildCoatRack(st: StylePalette, grad: THREE.DataTexture): G {
  const g = grp("coatrack");
  cyl(g, 0.18, 0.22, 0.05, st.woodDark, grad, 0, 0.025, 0, 14);
  cyl(g, 0.035, 0.045, 1.5, st.woodDark, grad, 0, 0.79, 0, 8);
  for (const a of [0.4, 1.9, 3.4]) {
    const arm = box(g, 0.26, 0.04, 0.04, st.wood, grad, Math.cos(a) * 0.14, 1.5, Math.sin(a) * 0.14);
    arm.rotation.y = -a;
    ball(g, 0.035, st.accent, grad, Math.cos(a) * 0.26, 1.5, Math.sin(a) * 0.26, 8);
  }
  box(g, 0.26, 0.5, 0.08, st.fabric, grad, 0.14, 1.15, 0.06);
  ball(g, 0.05, st.accent, grad, 0.14, 0.86, 0.06);
  return g;
}

function buildBathtub(st: StylePalette, grad: THREE.DataTexture): G {
  const g = grp("bathtub");
  box(g, 1.3, 0.46, 0.7, 0xf6f3ea, grad, 0, 0.3, 0);
  box(g, 1.38, 0.09, 0.78, 0xece7db, grad, 0, 0.55, 0); // rim
  const water = new THREE.Mesh(new THREE.BoxGeometry(1.16, 0.04, 0.58), new THREE.MeshBasicMaterial({ color: 0x9fdcec, transparent: true, opacity: 0.9 }));
  water.position.y = 0.55;
  g.add(water);
  ball(g, 0.07, 0xffffff, grad, 0.1, 0.6, 0.05, 10); // foam
  ball(g, 0.05, 0xffffff, grad, -0.12, 0.6, -0.08, 10);
  for (const [fx, fz] of [[-0.5, -0.26], [0.5, -0.26], [-0.5, 0.26], [0.5, 0.26]]) {
    box(g, 0.1, 0.1, 0.1, st.metal, grad, fx, 0.05, fz);
  }
  cyl(g, 0.03, 0.03, 0.3, st.metal, grad, -0.56, 0.72, 0, 8);
  box(g, 0.12, 0.04, 0.04, st.metal, grad, -0.5, 0.84, 0);
  return g;
}

function buildSink(st: StylePalette, grad: THREE.DataTexture): G {
  const g = grp("sink");
  cyl(g, 0.14, 0.18, 0.55, 0xf2ede2, grad, 0, 0.28, 0, 14);
  cyl(g, 0.3, 0.24, 0.16, 0xf6f3ea, grad, 0, 0.64, 0, 16);
  cyl(g, 0.23, 0.23, 0.04, 0xd9eef2, grad, 0, 0.68, 0, 14);
  cyl(g, 0.024, 0.024, 0.24, st.metal, grad, -0.1, 0.82, -0.08, 8);
  box(g, 0.18, 0.04, 0.04, st.metal, grad, -0.02, 0.92, -0.08);
  box(g, 0.04, 0.08, 0.04, st.metal, grad, 0.06, 0.88, -0.08);
  return g;
}

function buildVase(st: StylePalette, grad: THREE.DataTexture): G {
  const g = grp("vase");
  cyl(g, 0.14, 0.2, 0.3, st.cushion, grad, 0, 0.15, 0, 14);
  cyl(g, 0.08, 0.11, 0.12, st.cushion, grad, 0, 0.36, 0, 12);
  cyl(g, 0.11, 0.11, 0.04, st.accent, grad, 0, 0.43, 0, 12);
  for (const [fx, fc, fh] of [[-0.05, st.accent, 0.24], [0.05, st.fabric, 0.3], [0, st.green, 0.2]] as Array<[number, number, number]>) {
    cyl(g, 0.012, 0.012, fh, st.green, grad, fx, 0.46 + fh / 2, 0, 6);
    ball(g, 0.055, fc, grad, fx, 0.48 + fh, 0, 10);
  }
  return g;
}

function buildPiano(st: StylePalette, grad: THREE.DataTexture): G {
  const g = grp("piano");
  box(g, 1.15, 1.0, 0.55, st.woodDark, grad, 0, 0.62, -0.1);
  box(g, 1.1, 0.09, 0.34, st.wood, grad, 0, 0.72, 0.26); // keyboard shelf
  const keys = new THREE.Mesh(new THREE.BoxGeometry(1.0, 0.05, 0.16), toonMat(0xfdf8ec, grad));
  keys.position.set(0, 0.79, 0.3);
  g.add(keys);
  for (let i = 0; i < 7; i++) {
    box(g, 0.05, 0.05, 0.09, 0x22222a, grad, -0.42 + i * 0.14, 0.83, 0.26);
  }
  box(g, 1.12, 0.08, 0.06, st.accent, grad, 0, 0.68, 0.44); // felt strip
  box(g, 0.6, 0.3, 0.03, st.woodDark, grad, 0, 1.02, -0.3).rotation.x = -0.12; // music rest
  for (const dx of [-0.5, 0.5]) {
    cyl(g, 0.045, 0.055, 0.24, st.woodDark, grad, dx, 0.12, 0.15, 8);
  }
  return g;
}

function buildCello(st: StylePalette, grad: THREE.DataTexture): G {
  const g = grp("cello");
  const body = ball(g, 0.3, st.wood, grad, 0, 0.52, 0, 16);
  body.scale.set(1, 1.18, 0.55);
  box(g, 0.09, 0.72, 0.07, st.woodDark, grad, 0, 1.18, 0);
  ball(g, 0.06, st.woodDark, grad, 0, 1.58, 0, 10); // scroll
  for (const dx of [-0.03, 0, 0.03]) {
    cyl(g, 0.008, 0.008, 0.95, 0xd9cfa8, grad, dx, 0.85, 0.14, 6);
  }
  box(g, 0.2, 0.05, 0.03, st.woodDark, grad, 0, 0.66, 0.15); // bridge
  cyl(g, 0.02, 0.02, 0.4, st.metal, grad, 0, 0.14, 0, 8); // endpin
  g.rotation.z = 0.06;
  return g;
}

function buildMusicStand(st: StylePalette, grad: THREE.DataTexture): G {
  const g = grp("musicstand");
  for (const a of [0, 2.1, 4.2]) {
    const leg = box(g, 0.04, 0.4, 0.04, st.metal, grad, Math.cos(a) * 0.12, 0.14, Math.sin(a) * 0.12);
    leg.rotation.z = Math.cos(a) * 0.5;
    leg.rotation.x = Math.sin(a) * 0.5;
  }
  cyl(g, 0.02, 0.02, 0.85, st.metal, grad, 0, 0.5, 0, 8);
  const desk = box(g, 0.42, 0.3, 0.03, st.metal, grad, 0, 1.0, 0.02);
  desk.rotation.x = -0.35;
  box(g, 0.3, 0.2, 0.02, st.fabric, grad, 0, 1.04, 0.06).rotation.x = -0.35; // sheet
  ball(g, 0.04, st.accent, grad, 0.08, 1.1, 0.08);
  return g;
}

function buildDesk(st: StylePalette, grad: THREE.DataTexture): G {
  const g = grp("desk");
  box(g, 1.3, 0.07, 0.6, st.wood, grad, 0, 0.66, 0);
  box(g, 0.5, 0.5, 0.5, st.woodDark, grad, -0.36, 0.32, 0); // drawer unit
  for (let i = 0; i < 2; i++) {
    box(g, 0.4, 0.16, 0.03, st.fabricSoft, grad, -0.36, 0.42 - i * 0.22, 0.26);
    ball(g, 0.028, st.metal, grad, -0.36, 0.42 - i * 0.22, 0.29);
  }
  for (const dx of [0.28, 0.58]) {
    box(g, 0.07, 0.62, 0.5, st.woodDark, grad, dx, 0.31, 0);
  }
  box(g, 0.3, 0.02, 0.22, 0xfdf8ec, grad, 0.05, 0.71, 0.05); // papers
  box(g, 0.24, 0.06, 0.18, st.accent, grad, -0.3, 0.73, 0.02); // book
  box(g, 0.2, 0.05, 0.15, st.green, grad, -0.3, 0.79, 0.02); // book 2
  cyl(g, 0.03, 0.04, 0.2, st.metal, grad, 0.45, 0.8, -0.1, 8);
  cone(g, 0.1, 0.12, st.accent, grad, 0.45, 0.95, -0.1, 10);
  return g;
}

function buildOfficeChair(st: StylePalette, grad: THREE.DataTexture): G {
  const g = grp("officechair");
  cyl(g, 0.26, 0.28, 0.1, st.fabric, grad, 0, 0.5, 0, 16);
  box(g, 0.44, 0.52, 0.08, st.fabric, grad, 0, 0.88, -0.2);
  box(g, 0.36, 0.1, 0.06, st.accent, grad, 0, 0.98, -0.16);
  cyl(g, 0.03, 0.035, 0.3, st.metal, grad, 0, 0.32, 0, 8);
  for (const a of [0.6, 1.9, 3.1, 4.4, 5.6]) {
    box(g, 0.24, 0.04, 0.05, st.metal, grad, Math.cos(a) * 0.12, 0.18, Math.sin(a) * 0.12).rotation.y = -a;
    ball(g, 0.035, 0x2e2e34, grad, Math.cos(a) * 0.23, 0.14, Math.sin(a) * 0.23, 8);
  }
  return g;
}

function buildAtticChest(st: StylePalette, grad: THREE.DataTexture): G {
  const g = grp("chest");
  box(g, 0.8, 0.45, 0.5, st.wood, grad, 0, 0.28, 0);
  box(g, 0.84, 0.1, 0.54, st.woodDark, grad, 0, 0.55, 0);
  box(g, 0.06, 0.45, 0.52, st.metal, grad, -0.25, 0.28, 0);
  box(g, 0.06, 0.45, 0.52, st.metal, grad, 0.25, 0.28, 0);
  ball(g, 0.05, st.accent, grad, 0, 0.52, 0.27, 8); // lock
  return g;
}

function buildBoxes(st: StylePalette, grad: THREE.DataTexture): G {
  const g = grp("boxes");
  box(g, 0.5, 0.4, 0.45, st.wood, grad, 0, 0.2, 0);
  box(g, 0.4, 0.34, 0.4, st.woodDark, grad, 0.06, 0.57, 0).rotation.y = 0.3;
  box(g, 0.26, 0.2, 0.26, st.fabric, grad, -0.08, 0.85, 0.02).rotation.y = -0.2;
  box(g, 0.42, 0.04, 0.38, st.accent, grad, 0.06, 0.76, 0).rotation.y = 0.3;
  return g;
}

function buildHay(st: StylePalette, grad: THREE.DataTexture): G {
  const g = grp("hay");
  const bale = cyl(g, 0.28, 0.28, 0.5, 0xe3c25f, grad, 0, 0.28, 0, 14);
  bale.rotation.z = Math.PI / 2;
  for (const dx of [-0.14, 0.14]) {
    const band = new THREE.Mesh(new THREE.TorusGeometry(0.28, 0.02, 6, 18), toonMat(st.metal, grad));
    band.rotation.y = Math.PI / 2;
    band.position.set(dx, 0.28, 0);
    g.add(band);
  }
  ball(g, 0.2, 0xead27a, grad, 0.12, 0.62, 0.04, 12);
  cyl(g, 0.02, 0.02, 0.5, st.wood, grad, -0.42, 0.3, 0, 6).rotation.z = 0.5;
  return g;
}

function buildSaddle(st: StylePalette, grad: THREE.DataTexture): G {
  const g = grp("saddle");
  box(g, 0.08, 0.7, 0.08, st.woodDark, grad, -0.24, 0.35, 0).rotation.z = 0.3;
  box(g, 0.08, 0.7, 0.08, st.woodDark, grad, 0.24, 0.35, 0).rotation.z = -0.3;
  box(g, 0.5, 0.08, 0.1, st.woodDark, grad, 0, 0.66, 0);
  box(g, 0.44, 0.1, 0.34, st.fabric, grad, 0, 0.76, 0);
  ball(g, 0.07, st.woodDark, grad, 0, 0.86, -0.14, 10); // pommel
  box(g, 0.4, 0.1, 0.08, st.fabric, grad, 0, 0.86, 0.16); // cantle
  box(g, 0.05, 0.2, 0.04, st.metal, grad, -0.2, 0.6, 0.02);
  box(g, 0.05, 0.2, 0.04, st.metal, grad, 0.2, 0.6, 0.02);
  return g;
}

function buildBucket(st: StylePalette, grad: THREE.DataTexture): G {
  const g = grp("bucket");
  cyl(g, 0.16, 0.12, 0.22, st.metal, grad, 0, 0.11, 0, 14);
  cyl(g, 0.14, 0.14, 0.03, 0x7fd4e8, grad, 0, 0.18, 0, 12);
  const handle = new THREE.Mesh(new THREE.TorusGeometry(0.13, 0.014, 6, 14, Math.PI), toonMat(st.metal, grad));
  handle.position.y = 0.23;
  g.add(handle);
  return g;
}

function buildHorse(st: StylePalette, grad: THREE.DataTexture): G {
  const g = grp("horse");
  const coat = st.fabric;
  box(g, 0.78, 0.4, 0.32, coat, grad, 0, 0.72, 0); // body
  for (const [lx, lz] of [[-0.26, -0.1], [0.26, -0.1], [-0.26, 0.1], [0.26, 0.1]]) {
    cyl(g, 0.045, 0.05, 0.52, coat, grad, lx, 0.26, lz, 8);
    box(g, 0.09, 0.06, 0.11, st.woodDark, grad, lx, 0.03, lz); // hoof
  }
  const neck = box(g, 0.18, 0.44, 0.16, coat, grad, 0.3, 1.05, 0);
  neck.rotation.z = -0.45;
  const head = box(g, 0.28, 0.15, 0.14, coat, grad, 0.46, 1.28, 0);
  head.rotation.z = 0.12;
  box(g, 0.12, 0.11, 0.13, st.fabricSoft, grad, 0.62, 1.24, 0); // muzzle
  for (const ez of [-0.05, 0.05]) {
    cone(g, 0.04, 0.11, st.woodDark, grad, 0.38, 1.4, ez, 6);
  }
  for (let i = 0; i < 3; i++) {
    box(g, 0.06, 0.14, 0.05, st.woodDark, grad, 0.22 - i * 0.09, 1.24 + i * 0.05, 0);
  } // mane
  const tail = cone(g, 0.07, 0.34, st.woodDark, grad, -0.4, 0.85, 0, 8);
  tail.rotation.z = 0.5;
  ball(g, 0.03, 0x2e2418, grad, 0.5, 1.34, 0.08, 6); // eyes
  ball(g, 0.03, 0x2e2418, grad, 0.5, 1.34, -0.08, 6);
  return g;
}

function buildFruitTree(st: StylePalette, grad: THREE.DataTexture): G {
  const g = grp("fruittree");
  cyl(g, 0.09, 0.14, 0.85, st.woodDark, grad, 0, 0.42, 0, 10);
  ball(g, 0.46, st.green, grad, 0, 1.1, 0, 14);
  ball(g, 0.3, st.fabricSoft, grad, 0.2, 1.36, 0.06, 12);
  ball(g, 0.26, st.green, grad, -0.28, 1.3, -0.06, 12);
  const fruits = [0xe2483c, 0xf5b301, 0xe2725b];
  for (let i = 0; i < 5; i++) {
    const a = i * 1.35;
    ball(g, 0.06, fruits[i % 3], grad, Math.cos(a) * 0.34, 1.05 + Math.sin(i * 2.1) * 0.18, Math.sin(a) * 0.3, 8);
  }
  return g;
}

function buildFruitBasket(st: StylePalette, grad: THREE.DataTexture): G {
  const g = grp("fruitbasket");
  cyl(g, 0.24, 0.18, 0.2, st.pot, grad, 0, 0.1, 0, 14);
  const rim = new THREE.Mesh(new THREE.TorusGeometry(0.24, 0.022, 8, 18), toonMat(st.woodDark, grad));
  rim.rotation.x = Math.PI / 2;
  rim.position.y = 0.2;
  g.add(rim);
  ball(g, 0.08, 0xe2483c, grad, -0.07, 0.26, 0.02, 10);
  ball(g, 0.08, 0xf5b301, grad, 0.08, 0.26, -0.02, 10);
  ball(g, 0.07, 0xe2725b, grad, 0, 0.32, 0.04, 10);
  const handle = new THREE.Mesh(new THREE.TorusGeometry(0.17, 0.016, 6, 14, Math.PI), toonMat(st.woodDark, grad));
  handle.position.y = 0.22;
  g.add(handle);
  return g;
}

function buildLadder(st: StylePalette, grad: THREE.DataTexture): G {
  const g = grp("ladder");
  cyl(g, 0.03, 0.035, 1.35, st.wood, grad, -0.2, 0.675, 0, 8);
  cyl(g, 0.03, 0.035, 1.35, st.wood, grad, 0.2, 0.675, 0, 8);
  for (let i = 0; i < 5; i++) {
    cyl(g, 0.022, 0.022, 0.42, st.woodDark, grad, 0, 0.2 + i * 0.24, 0, 6).rotation.z = Math.PI / 2;
  }
  g.rotation.z = 0.14;
  return g;
}

function buildCrate(st: StylePalette, grad: THREE.DataTexture): G {
  const g = grp("crate");
  box(g, 0.5, 0.4, 0.42, st.wood, grad, 0, 0.2, 0);
  box(g, 0.44, 0.05, 0.02, st.woodDark, grad, 0, 0.12, 0.215);
  box(g, 0.44, 0.05, 0.02, st.woodDark, grad, 0, 0.28, 0.215);
  for (let i = 0; i < 3; i++) {
    ball(g, 0.065, [0xe2483c, 0xf5b301, 0xe2725b][i], grad, -0.12 + i * 0.12, 0.45, i % 2 ? 0.06 : -0.04, 10);
  }
  return g;
}

/* --------------------------- entry point --------------------------- */

const BUILDERS: Record<string, (st: StylePalette, grad: THREE.DataTexture) => G> = {
  sofa: buildSofa,
  armchair: buildArmchair,
  coffee_table: (s, g) => buildTable(s, g, 1.1, false),
  kitchen_table: (s, g) => buildTable(s, g, 1.2, s !== STYLES[1]),
  console_table: buildConsoleTable,
  chandelier: (s, g) => buildChandelier(s, g, false),
  hall_chandelier: (s, g) => buildChandelier(s, g, true),
  pendant_light: buildPendant,
  floor_lamp: (s, g) => buildShadeLamp(s, g, true),
  bedside_lamp: (s, g) => buildShadeLamp(s, g, false),
  garden_lamp: buildGardenLamp,
  grow_lamp: buildGrowLamp,
  curtain: (s, g) => buildCurtain(s, g, 1.5),
  bed_curtain: (s, g) => buildCurtain(s, g, 1.3),
  carpet: (s, g) => buildRug(s, g, 2.0, 1.4),
  rug: (s, g) => buildRug(s, g, 1.7, 1.2),
  runner: (s, g) => buildRug(s, g, 1.0, 2.4),
  bed_carpet: (s, g) => buildRug(s, g, 1.6, 1.1),
  bookcase: buildBookcase,
  shelf: buildShelf,
  green_shelf: buildGreenShelf,
  chair: buildChair,
  kitchen_chair: buildChair,
  cabinet: buildCabinet,
  bed: buildBed,
  wardrobe: buildWardrobe,
  planter: (s, g) => buildPotPlant(s, g, true),
  garden_planter: (s, g) => buildPotPlant(s, g, false),
  hall_plant: buildHallPlant,
  kitchen_decor: buildKitchenDecor,
  flower_stand: buildFlowerStand,
  watering_set: buildWateringSet,
  flower_bed: buildFlowerBed,
  fountain: buildFountain,
  bench: buildBench,
  mirror: buildMirror,

  /* ---- 110-level campaign additions ---- */
  wall_art: buildWallArt,
  hall_painting: buildWallArt,
  sconce: buildSconce,
  wall_lamp: buildSconce,
  kitchen_shelf: buildWallShelf,
  wall_map: buildWallMap,
  bath_mirror: buildBathMirror,
  towel_rack: buildTowelRack,
  green_hanger: buildHangingPlant,
  globe: buildGlobe,
  fridge: buildFridge,
  dresser: buildDresser,
  workbench: buildWorkbench,
  birdhouse: buildBirdhouse,
  umbrella: buildUmbrella,
  coat_rack: buildCoatRack,
  bathtub: buildBathtub,
  sink: buildSink,
  bath_mat: (s, g) => buildRug(s, g, 1.3, 0.8),
  bath_plant: (s, g) => buildPotPlant(s, g, false),
  dining_table: (s, g) => buildTable(s, g, 1.35, false),
  dining_chair: buildChair,
  dining_sideboard: buildCabinet,
  dining_chandelier: (s, g) => buildChandelier(s, g, false),
  dining_vase: buildVase,
  dining_carpet: (s, g) => buildRug(s, g, 1.9, 1.3),
  piano: buildPiano,
  cello: buildCello,
  music_stand: buildMusicStand,
  music_lamp: (s, g) => buildShadeLamp(s, g, true),
  music_carpet: (s, g) => buildRug(s, g, 1.8, 1.25),
  desk: buildDesk,
  office_chair: buildOfficeChair,
  study_lamp: (s, g) => buildShadeLamp(s, g, true),
  office_bookcase: buildBookcase,
  study_rug: (s, g) => buildRug(s, g, 1.7, 1.2),
  attic_chest: buildAtticChest,
  attic_boxes: buildBoxes,
  attic_lamp: buildPendant,
  attic_carpet: (s, g) => buildRug(s, g, 1.5, 1.1),
  attic_plant: buildHallPlant,
  gazebo_seat: buildBench,
  gazebo_table: (s, g) => buildTable(s, g, 0.9, true),
  gazebo_lantern: buildGardenLamp,
  gazebo_plants: (s, g) => buildPotPlant(s, g, false),
  guest_bed: buildBed,
  guest_table: (s, g) => buildTable(s, g, 1.0, false),
  guest_lamp: (s, g) => buildShadeLamp(s, g, false),
  guest_rug: (s, g) => buildRug(s, g, 1.6, 1.1),
  stable_horse: buildHorse,
  stable_hay: buildHay,
  stable_saddle: buildSaddle,
  stable_bucket: buildBucket,
  fruit_tree: buildFruitTree,
  fruit_basket: buildFruitBasket,
  orchard_ladder: buildLadder,
  orchard_crate: buildCrate,
};

/**
 * Build a furniture model. Returns null for unknown items.
 * Caller is responsible for disposal (disposeObject on the group).
 */
export function buildFurniture(item: string, variant: number, grad: THREE.DataTexture): THREE.Group | null {
  const fn = BUILDERS[item];
  if (!fn) return null;
  const st = STYLES[Math.min(Math.max(variant, 0), 2)];
  return fn(st, grad);
}

/** Rough footprint radius used for fake shadows and hit boxes. */
export function furnitureFootprint(item: string): number {
  switch (item) {
    case "carpet": return 1.15;
    case "rug": return 0.95;
    case "runner": return 0.85;
    case "bed_carpet": return 0.9;
    case "sofa": return 0.95;
    case "cabinet": return 1.1;
    case "bed": return 1.0;
    case "bookcase": return 0.75;
    case "fountain": return 0.8;
    case "bench": return 0.7;
    case "bathtub": return 0.8;
    case "piano": return 0.85;
    case "desk": return 0.85;
    case "dining_table": return 0.85;
    case "guest_bed": return 0.95;
    case "stable_horse": return 0.7;
    case "fruit_tree": return 0.65;
    case "stable_hay": return 0.6;
    case "fridge": return 0.55;
    case "dresser": return 0.65;
    case "dining_sideboard": return 1.1;
    case "umbrella": return 0.7;
    default: return 0.6;
  }
}
