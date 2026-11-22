"use client";

/**
 * Mansion3D — the Color Manor rebuilt as a real-time WebGL cartoon scene.
 * Turntable rotation (drag to spin, gentle auto-rotate when idle), lit
 * windows that follow the number of unlocked wings, chimney smoke, balloons,
 * drifting clouds, trees, fence and flower beds — all primitives with banded
 * toon shading so it matches the hand-drawn UI around it.
 */

import { useEffect, useRef } from "react";
import * as THREE from "three";
import {
  createLightRig,
  createRenderer,
  disposeObject,
  hasWebGL,
  makeToonGradient,
  toonMat,
} from "@/game/three-kit";

const WOOD = 0x8a5a33;
const CREAM = 0xf7e6c4;
const CREAM_DARK = 0xe6cfa6;
const ROOF = 0xc96f45;
const ROOF_DARK = 0xa45330;

interface WindowSpec {
  mesh: THREE.Mesh;
  order: number; // lit when unlockedCount > order
}

export function Mansion3D({
  unlockedCount = 1,
  className,
}: {
  unlockedCount?: number;
  className?: string;
}) {
  const mountRef = useRef<HTMLDivElement>(null);
  const litRef = useRef(unlockedCount);
  const applyLightingRef = useRef<(() => void) | null>(null);

  // keep the scene in sync when the prop changes without rebuilding it
  useEffect(() => {
    litRef.current = unlockedCount;
    applyLightingRef.current?.();
  }, [unlockedCount]);

  useEffect(() => {
    const mount = mountRef.current;
    if (!mount || !hasWebGL()) return;

    const canvas = document.createElement("canvas");
    canvas.className = "block h-full w-full";
    mount.appendChild(canvas);

    let renderer: THREE.WebGLRenderer;
    try {
      renderer = createRenderer(canvas);
    } catch {
      canvas.remove();
      return;
    }

    const scene = new THREE.Scene();
    const gradient = makeToonGradient();

    const camera = new THREE.PerspectiveCamera(38, 1, 0.1, 120);
    camera.position.set(9.5, 6.2, 12.5);
    camera.lookAt(0, 1.8, 0);

    const { hemi, key, fill } = createLightRig(11);
    scene.add(hemi, key, fill);

    /* ------------------------------ helpers ------------------------------ */
    const disposables: THREE.Object3D[] = [];
    const track = <T extends THREE.Object3D>(o: T): T => {
      disposables.push(o);
      return o;
    };

    const windowSpecs: WindowSpec[] = [];
    const addWindow = (parent: THREE.Object3D, pos: [number, number, number], order: number, w = 0.5, h = 0.72) => {
      const mat = new THREE.MeshBasicMaterial({ color: 0xbfe3f2 });
      const mesh = new THREE.Mesh(new THREE.PlaneGeometry(w, h), mat);
      mesh.position.set(...pos);
      parent.add(mesh);
      windowSpecs.push({ mesh, order });
      // brown frame slightly behind
      const frame = new THREE.Mesh(
        new THREE.PlaneGeometry(w + 0.1, h + 0.1),
        new THREE.MeshBasicMaterial({ color: 0x8a5a33 }),
      );
      frame.position.set(pos[0], pos[1], pos[2] - 0.015);
      parent.add(frame);
      return mesh;
    };

    /* ------------------------------ ground ------------------------------ */
    const ground = new THREE.Mesh(new THREE.CylinderGeometry(8.2, 8.2, 0.4, 48), toonMat(0x8fc97e, gradient));
    ground.position.y = -0.2;
    ground.receiveShadow = true;
    scene.add(track(ground));

    const path = new THREE.Mesh(new THREE.BoxGeometry(1.5, 0.08, 2.9), toonMat(0xe9d5af, gradient));
    path.position.set(0, 0.02, 3.1);
    scene.add(track(path));

    /* ------------------------------ manor ------------------------------ */
    const manor = new THREE.Group();
    scene.add(track(manor));

    // main block
    const main = new THREE.Mesh(new THREE.BoxGeometry(3.7, 2.4, 2.6), toonMat(CREAM, gradient));
    main.position.set(0, 1.2, 0.35);
    main.castShadow = true;
    manor.add(track(main));

    // main roof (4-sided hip)
    const mainRoof = new THREE.Mesh(new THREE.ConeGeometry(3.15, 1.75, 4), toonMat(ROOF, gradient));
    mainRoof.rotation.y = Math.PI / 4;
    mainRoof.position.set(0, 3.27, 0.35);
    mainRoof.castShadow = true;
    manor.add(track(mainRoof));

    // tower
    const tower = new THREE.Mesh(new THREE.CylinderGeometry(0.95, 1.05, 3.9, 24), toonMat(0xfbf0dc, gradient));
    tower.position.set(0, 1.95, -0.5);
    tower.castShadow = true;
    manor.add(track(tower));
    const towerRoof = new THREE.Mesh(new THREE.ConeGeometry(1.5, 2.0, 24), toonMat(ROOF_DARK, gradient));
    towerRoof.position.set(0, 4.9, -0.5);
    towerRoof.castShadow = true;
    manor.add(track(towerRoof));
    // flag
    const pole = new THREE.Mesh(new THREE.CylinderGeometry(0.03, 0.03, 0.8, 8), toonMat(WOOD, gradient));
    pole.position.set(0, 6.25, -0.5);
    manor.add(track(pole));
    const flag = new THREE.Mesh(new THREE.BufferGeometry(), new THREE.MeshBasicMaterial({ color: 0xe2725b, side: THREE.DoubleSide }));
    flag.geometry.setFromPoints([
      new THREE.Vector3(0, 0.18, 0),
      new THREE.Vector3(0.62, 0.09, 0),
      new THREE.Vector3(0, 0, 0),
    ]);
    flag.geometry.computeVertexNormals();
    flag.position.set(0, 6.32, -0.5);
    manor.add(track(flag));

    // wings
    const wingGeo = new THREE.BoxGeometry(1.75, 1.7, 2.1);
    const wingRoofGeo = new THREE.ConeGeometry(1.6, 1.25, 4);
    const wings: Array<{ box: THREE.Mesh; roof: THREE.Mesh; x: number }> = [];
    for (const sx of [-1, 1]) {
      const x = 2.75 * sx;
      const box = new THREE.Mesh(wingGeo, toonMat(CREAM_DARK, gradient));
      box.position.set(x, 0.85, 0.15);
      box.castShadow = true;
      manor.add(track(box));
      const roof = new THREE.Mesh(wingRoofGeo, toonMat(ROOF_DARK, gradient));
      roof.rotation.y = Math.PI / 4;
      roof.position.set(x, 2.32, 0.15);
      roof.castShadow = true;
      manor.add(track(roof));
      wings.push({ box, roof, x });
    }

    // windows — lit order matches the manor wings (7 originals + 5 new wings):
    // 0 tower top, 1 upper-L, 2 upper-R, 3 lower-L, 4 lower-R, 5 wing-L, 6 wing-R,
    // 7 tower mid, 8/9 wing small-L/R, 10 door transom, 11 upper side-L/R
    addWindow(tower, [0, 2.62, 1.07], 0, 0.52, 0.66);
    addWindow(main, [-0.92, 1.78, 1.66], 1);
    addWindow(main, [0.92, 1.78, 1.66], 2);
    addWindow(main, [-0.92, 0.85, 1.66], 3);
    addWindow(main, [0.92, 0.85, 1.66], 4);
    addWindow(wings[0].box, [0, 0.95, 1.06], 5, 0.46, 0.62);
    addWindow(wings[1].box, [0, 0.95, 1.06], 6, 0.46, 0.62);
    addWindow(tower, [0, 1.05, 1.03], 7, 0.44, 0.58);
    addWindow(wings[0].box, [0, 1.42, 1.06], 8, 0.36, 0.4);
    addWindow(wings[1].box, [0, 1.42, 1.06], 9, 0.36, 0.4);
    addWindow(main, [0, 1.5, 1.68], 10, 0.44, 0.26);
    addWindow(main, [-1.5, 1.78, 1.68], 11, 0.4, 0.55);
    addWindow(main, [1.5, 1.78, 1.68], 11, 0.4, 0.55);

    // flower boxes under lower windows
    for (const sx of [-1, 1]) {
      const fb = new THREE.Mesh(new THREE.BoxGeometry(0.72, 0.14, 0.18), toonMat(0xa9713f, gradient));
      fb.position.set(0.92 * sx, 0.42, 1.7);
      manor.add(track(fb));
      for (let i = 0; i < 3; i++) {
        const fl = new THREE.Mesh(new THREE.SphereGeometry(0.055, 10, 8), new THREE.MeshBasicMaterial({ color: [0xe2725b, 0xf5b301, 0xf06ea9][i] }));
        fl.position.set(0.92 * sx - 0.2 + i * 0.2, 0.52, 1.7);
        manor.add(track(fl));
      }
    }

    // door + columns + lanterns + steps
    const door = new THREE.Mesh(new THREE.BoxGeometry(0.72, 1.15, 0.1), toonMat(0x9c6538, gradient));
    door.position.set(0, 0.58, 1.72);
    manor.add(track(door));
    const doorArch = new THREE.Mesh(new THREE.CylinderGeometry(0.36, 0.36, 0.1, 16, 1, false, 0, Math.PI), toonMat(0x9c6538, gradient));
    doorArch.rotation.set(Math.PI / 2, 0, 0);
    doorArch.position.set(0, 1.15, 1.72);
    manor.add(track(doorArch));
    for (const sx of [-1, 1]) {
      const col = new THREE.Mesh(new THREE.CylinderGeometry(0.09, 0.11, 1.3, 12), toonMat(0xf3e3c8, gradient));
      col.position.set(0.62 * sx, 0.65, 1.86);
      col.castShadow = true;
      manor.add(track(col));
      const lamp = new THREE.Mesh(new THREE.SphereGeometry(0.085, 12, 10), new THREE.MeshBasicMaterial({ color: 0xffe08a }));
      lamp.position.set(0.62 * sx, 1.38, 1.86);
      manor.add(track(lamp));
    }
    for (let i = 0; i < 3; i++) {
      const step = new THREE.Mesh(new THREE.BoxGeometry(1.5 - i * 0.18, 0.09, 0.5), toonMat(i % 2 ? 0xdcc294 : 0xe9d5af, gradient));
      step.position.set(0, 0.045 + i * 0.09, 1.98 + i * 0.24);
      manor.add(track(step));
    }

    // chimneys + animated smoke puffs
    const smokePuffs: Array<{ mesh: THREE.Mesh; mat: THREE.MeshBasicMaterial; off: number; x: number; z: number }> = [];
    for (const [cx, cz, base] of [
      [-1.25, -0.15, 0],
      [1.25, -0.35, 0.55],
    ] as Array<[number, number, number]>) {
      const chim = new THREE.Mesh(new THREE.CylinderGeometry(0.17, 0.2, 0.55, 12), toonMat(0x8c5b33, gradient));
      chim.position.set(cx, 3.35, cz);
      manor.add(track(chim));
      for (let i = 0; i < 3; i++) {
        const mat = new THREE.MeshBasicMaterial({ color: 0xffffff, transparent: true, opacity: 0 });
        const puff = new THREE.Mesh(new THREE.SphereGeometry(0.14, 10, 8), mat);
        manor.add(puff);
        smokePuffs.push({ mesh: puff, mat, off: base + i * 0.33, x: cx, z: cz });
      }
    }

    /* ---------------------- yard buildings (pop in when unlocked) ---------------------- */
    const yardBuildings: Array<{ group: THREE.Group; target: number; scale: number }> = [];
    const addYardBuilding = (build: () => THREE.Group, pos: [number, number, number]) => {
      const g = build();
      g.position.set(...pos);
      g.scale.setScalar(0.001);
      g.visible = false;
      scene.add(track(g));
      yardBuildings.push({ group: g, target: 0, scale: 0.001 });
    };

    const buildYardGazebo = () => {
      const g = new THREE.Group();
      const base = new THREE.Mesh(new THREE.CylinderGeometry(1.0, 1.12, 0.2, 6), toonMat(0xdcc294, gradient));
      base.position.y = 0.1;
      g.add(base);
      for (let i = 0; i < 6; i++) {
        const a = (i / 6) * Math.PI * 2;
        const post = new THREE.Mesh(new THREE.CylinderGeometry(0.07, 0.08, 1.5, 8), toonMat(WOOD, gradient));
        post.position.set(Math.cos(a) * 0.9, 0.95, Math.sin(a) * 0.9);
        g.add(post);
      }
      const roof = new THREE.Mesh(new THREE.ConeGeometry(1.45, 0.85, 6), toonMat(ROOF, gradient));
      roof.position.y = 2.1;
      roof.castShadow = true;
      g.add(roof);
      const finial = new THREE.Mesh(new THREE.SphereGeometry(0.1, 10, 8), toonMat(0xf5b301, gradient));
      finial.position.y = 2.62;
      g.add(finial);
      for (const a of [0.6, 3.7]) {
        const lamp = new THREE.Mesh(new THREE.SphereGeometry(0.07, 8, 8), new THREE.MeshBasicMaterial({ color: 0xffe08a }));
        lamp.position.set(Math.cos(a) * 0.9, 1.55, Math.sin(a) * 0.9);
        g.add(lamp);
      }
      return g;
    };

    const buildYardGuesthouse = () => {
      const g = new THREE.Group();
      const body = new THREE.Mesh(new THREE.BoxGeometry(1.8, 1.1, 1.5), toonMat(0xfbf0dc, gradient));
      body.position.y = 0.55;
      body.castShadow = true;
      g.add(body);
      const roof = new THREE.Mesh(new THREE.ConeGeometry(1.6, 0.8, 4), toonMat(ROOF, gradient));
      roof.rotation.y = Math.PI / 4;
      roof.position.y = 1.5;
      roof.castShadow = true;
      g.add(roof);
      const door = new THREE.Mesh(new THREE.BoxGeometry(0.4, 0.72, 0.08), toonMat(0x9c6538, gradient));
      door.position.set(-0.3, 0.36, 0.78);
      g.add(door);
      for (const wx of [0.3, 0.66]) {
        const win = new THREE.Mesh(new THREE.PlaneGeometry(0.26, 0.3), new THREE.MeshBasicMaterial({ color: 0xffd75e }));
        win.position.set(wx, 0.62, 0.78);
        g.add(win);
      }
      const chim = new THREE.Mesh(new THREE.CylinderGeometry(0.1, 0.12, 0.4, 8), toonMat(0x8c5b33, gradient));
      chim.position.set(0.55, 1.55, -0.3);
      g.add(chim);
      return g;
    };

    const buildYardStable = () => {
      const g = new THREE.Group();
      const body = new THREE.Mesh(new THREE.BoxGeometry(2.1, 1.25, 1.5), toonMat(0xa9713f, gradient));
      body.position.y = 0.62;
      body.castShadow = true;
      g.add(body);
      const roof = new THREE.Mesh(new THREE.ConeGeometry(1.75, 0.85, 4), toonMat(ROOF_DARK, gradient));
      roof.rotation.y = Math.PI / 4;
      roof.position.y = 1.68;
      roof.castShadow = true;
      g.add(roof);
      const door = new THREE.Mesh(new THREE.BoxGeometry(0.72, 0.9, 0.08), toonMat(0x6d4426, gradient));
      door.position.set(0, 0.46, 0.78);
      g.add(door);
      // white cross trim on the door (classic stable look)
      const trim = new THREE.Mesh(new THREE.BoxGeometry(0.7, 0.09, 0.02), toonMat(0xf6e7c8, gradient));
      trim.position.set(0, 0.46, 0.84);
      trim.rotation.z = 0.55;
      g.add(trim);
      const hay = new THREE.Mesh(new THREE.SphereGeometry(0.24, 10, 8), toonMat(0xe3c25f, gradient));
      hay.position.set(1.25, 0.22, 0.5);
      hay.scale.y = 0.7;
      g.add(hay);
      return g;
    };

    const buildYardOrchard = () => {
      const g = new THREE.Group();
      for (const [tx, tz, s] of [[-0.35, -0.2, 1], [0.4, 0.1, 0.85], [-0.05, 0.45, 0.7]] as const) {
        const trunk = new THREE.Mesh(new THREE.CylinderGeometry(0.09 * s, 0.12 * s, 0.75 * s, 8), toonMat(WOOD, gradient));
        trunk.position.set(tx, 0.38 * s, tz);
        g.add(trunk);
        const fol = new THREE.Mesh(new THREE.SphereGeometry(0.48 * s, 12, 10), toonMat(0x6fa85f, gradient));
        fol.position.set(tx, 0.95 * s, tz);
        g.add(fol);
        for (let f = 0; f < 3; f++) {
          const fruit = new THREE.Mesh(new THREE.SphereGeometry(0.06 * s, 8, 6), new THREE.MeshBasicMaterial({ color: [0xe2483c, 0xf5b301, 0xe2725b][f] }));
          fruit.position.set(tx + Math.cos(f * 2.2) * 0.32 * s, 0.95 * s + Math.sin(f * 1.7) * 0.26 * s, tz + Math.sin(f * 2.6) * 0.3 * s);
          g.add(fruit);
        }
      }
      return g;
    };

    addYardBuilding(buildYardGazebo, [4.7, 0, 2.9]);
    addYardBuilding(buildYardOrchard, [-4.8, 0, 2.7]);
    addYardBuilding(buildYardGuesthouse, [-4.5, 0, -2.8]);
    addYardBuilding(buildYardStable, [4.6, 0, -3.0]);

    /* ------------------------------ garden ------------------------------ */
    // trees
    for (const sx of [-1, 1]) {
      const tx = 5.1 * sx;
      const trunk = new THREE.Mesh(new THREE.CylinderGeometry(0.16, 0.22, 1.1, 10), toonMat(WOOD, gradient));
      trunk.position.set(tx, 0.55, 0.9);
      trunk.castShadow = true;
      scene.add(track(trunk));
      const fol = new THREE.Mesh(new THREE.SphereGeometry(0.95, 18, 14), toonMat(0x6fa85f, gradient));
      fol.position.set(tx, 1.72, 0.9);
      fol.castShadow = true;
      scene.add(track(fol));
      const fol2 = new THREE.Mesh(new THREE.SphereGeometry(0.6, 16, 12), toonMat(0x8bc48a, gradient));
      fol2.position.set(tx + 0.5 * sx, 2.2, 0.9);
      scene.add(track(fol2));
    }

    // fence pickets left & right of the path
    const picketGeo = new THREE.BoxGeometry(0.09, 0.55, 0.07);
    const railGeo = new THREE.BoxGeometry(2.9, 0.06, 0.06);
    for (const sx of [-1, 1]) {
      for (let i = 0; i < 9; i++) {
        const p = new THREE.Mesh(picketGeo, toonMat(0xf6e7c8, gradient));
        p.position.set(sx * (1.35 + i * 0.3), 0.28, 4.4);
        scene.add(track(p));
      }
      for (const y of [0.18, 0.4]) {
        const rail = new THREE.Mesh(railGeo, toonMat(0xefddb6, gradient));
        rail.position.set(sx * 2.55, y, 4.4);
        scene.add(track(rail));
      }
    }

    // flower dots on the lawn
    const flowerColors = [0xe2725b, 0xf5b301, 0xf06ea9, 0xa267d8, 0x5a8fde];
    for (let i = 0; i < 16; i++) {
      const c = flowerColors[i % flowerColors.length];
      const fl = new THREE.Mesh(new THREE.SphereGeometry(0.075, 8, 6), new THREE.MeshBasicMaterial({ color: c }));
      const side = i % 2 ? 1 : -1;
      fl.position.set(side * (1.9 + (i % 5) * 0.75), 0.06, 2.2 + ((i * 0.55) % 1.9));
      scene.add(track(fl));
    }

    /* ------------------------------ sky ------------------------------ */
    const sun = new THREE.Mesh(new THREE.SphereGeometry(1.0, 20, 16), new THREE.MeshBasicMaterial({ color: 0xffd98a }));
    sun.position.set(7.5, 7.5, -9);
    scene.add(track(sun));
    const halo = new THREE.Mesh(new THREE.SphereGeometry(1.6, 20, 16), new THREE.MeshBasicMaterial({ color: 0xffd98a, transparent: true, opacity: 0.28 }));
    halo.position.copy(sun.position);
    scene.add(track(halo));

    const balloons: Array<{ group: THREE.Group; baseY: number; ph: number }> = [];
    const balloonColors = [0xe2725b, 0xf5b301, 0x5a8fde];
    for (let i = 0; i < 3; i++) {
      const g = new THREE.Group();
      const ball = new THREE.Mesh(new THREE.SphereGeometry(0.4, 16, 12), toonMat(balloonColors[i], gradient));
      ball.scale.set(1, 1.18, 1);
      g.add(track(ball));
      const knot = new THREE.Mesh(new THREE.ConeGeometry(0.09, 0.14, 8), toonMat(balloonColors[i], gradient));
      knot.rotation.x = Math.PI;
      knot.position.y = -0.5;
      g.add(track(knot));
      const str = new THREE.Mesh(new THREE.CylinderGeometry(0.008, 0.008, 1.1, 4), new THREE.MeshBasicMaterial({ color: 0xb98a55 }));
      str.position.y = -1.05;
      g.add(track(str));
      g.position.set(-4.6 + i * 0.75, 4.4 + i * 0.55, 1.6 - i * 0.4);
      scene.add(g);
      balloons.push({ group: g, baseY: g.position.y, ph: i * 1.3 });
    }

    const clouds: Array<{ group: THREE.Group; baseX: number; sp: number }> = [];
    for (let i = 0; i < 3; i++) {
      const g = new THREE.Group();
      const puffGeo = new THREE.SphereGeometry(1, 14, 10);
      const mat = new THREE.MeshBasicMaterial({ color: 0xffffff, transparent: true, opacity: 0.92 });
      const a = new THREE.Mesh(puffGeo, mat);
      a.scale.set(1.15, 0.62, 0.8);
      g.add(track(a));
      const b = new THREE.Mesh(puffGeo, mat);
      b.position.set(0.95, 0.18, 0);
      b.scale.set(0.8, 0.5, 0.7);
      g.add(track(b));
      const c = new THREE.Mesh(puffGeo, mat);
      c.position.set(-0.9, 0.14, 0.1);
      c.scale.set(0.72, 0.46, 0.66);
      g.add(track(c));
      g.position.set(-6 + i * 5.5, 6.4 + (i % 2) * 0.8, -5 + i * 1.5);
      g.scale.setScalar(0.9);
      scene.add(g);
      clouds.push({ group: g, baseX: g.position.x, sp: 0.22 + i * 0.07 });
    }

    /* --------------------------- window lighting --------------------------- */
    const LIT = new THREE.Color(0xffd75e);
    const DIM = new THREE.Color(0xbfe3f2);
    const applyLighting = () => {
      const lit = Math.min(litRef.current, 12);
      for (const w of windowSpecs) {
        (w.mesh.material as THREE.MeshBasicMaterial).color.copy(w.order < lit ? LIT : DIM);
      }
      // yard buildings appear once their wing is unlocked (after window 11)
      yardBuildings.forEach((b, i) => {
        b.target = litRef.current > 12 + i ? 1 : 0;
      });
    };
    applyLighting();
    applyLightingRef.current = applyLighting;

    /* ------------------------------ input ------------------------------ */
    let angle = 0.5;
    let targetAngle = 0.5;
    let auto = true;
    let dragging = false;
    let lastX = 0;
    let idleTimer: ReturnType<typeof setTimeout> | null = null;

    const onDown = (e: PointerEvent) => {
      dragging = true;
      lastX = e.clientX;
      if (idleTimer) clearTimeout(idleTimer);
    };
    const onMove = (e: PointerEvent) => {
      if (!dragging) return;
      const dx = e.clientX - lastX;
      lastX = e.clientX;
      targetAngle += dx * 0.012;
    };
    const onUp = () => {
      if (!dragging) return;
      dragging = false;
      if (idleTimer) clearTimeout(idleTimer);
      idleTimer = setTimeout(() => {
        // resume auto-rotate from wherever the user left it
        auto = true;
      }, 2600);
    };
    canvas.addEventListener("pointerdown", onDown);
    window.addEventListener("pointermove", onMove);
    window.addEventListener("pointerup", onUp);
    window.addEventListener("pointercancel", onUp);

    /* ------------------------------ resize ------------------------------ */
    const resize = () => {
      const w = mount.clientWidth || 1;
      const h = mount.clientHeight || 1;
      renderer.setSize(w, h, false);
      camera.aspect = w / h;
      camera.updateProjectionMatrix();
    };
    resize();
    const ro = new ResizeObserver(resize);
    ro.observe(mount);

    /* ------------------------------ loop ------------------------------ */
    const clock = new THREE.Clock();
    let raf = 0;
    let running = true;
    let elapsed = 0;

    const tick = () => {
      if (!running) return;
      raf = requestAnimationFrame(tick);
      const dt = Math.min(clock.getDelta(), 0.05);
      elapsed += dt;
      const t = elapsed;

      if (auto && !dragging) targetAngle += dt * 0.14;
      angle += (targetAngle - angle) * 0.08;
      manor.rotation.y = angle;

      // balloons bob
      for (const b of balloons) {
        b.group.position.y = b.baseY + Math.sin(t * 1.5 + b.ph) * 0.22;
        b.group.rotation.z = Math.sin(t * 1.1 + b.ph) * 0.08;
      }
      // clouds drift
      for (const c of clouds) {
        c.group.position.x = c.baseX + Math.sin(t * c.sp) * 1.4;
      }
      // smoke
      for (const p of smokePuffs) {
        const phase = (t * 0.42 + p.off) % 1;
        p.mesh.position.set(p.x + Math.sin(phase * 9) * 0.08, 3.62 + phase * 1.35, p.z);
        p.mesh.scale.setScalar(0.7 + phase * 1.5);
        p.mat.opacity = 0.62 * (1 - phase) * (phase > 0.04 ? 1 : phase / 0.04);
      }
      // yard buildings pop in when unlocked
      for (const b of yardBuildings) {
        if (Math.abs(b.scale - b.target) > 0.005) {
          b.scale += (b.target - b.scale) * Math.min(1, dt * 3.4);
          b.group.visible = b.scale > 0.02;
          b.group.scale.setScalar(Math.max(0.001, b.scale));
        }
      }
      // flag wave
      flag.rotation.y = Math.sin(t * 3.2) * 0.35;
      // sun halo pulse
      halo.scale.setScalar(1 + Math.sin(t * 1.4) * 0.06);

      renderer.render(scene, camera);
    };
    raf = requestAnimationFrame(tick);

    const onVis = () => {
      if (document.hidden) {
        running = false;
        cancelAnimationFrame(raf);
      } else if (!running) {
        running = true;
        clock.getDelta();
        raf = requestAnimationFrame(tick);
      }
    };
    document.addEventListener("visibilitychange", onVis);


    return () => {
      running = false;
      cancelAnimationFrame(raf);
      document.removeEventListener("visibilitychange", onVis);
      canvas.removeEventListener("pointerdown", onDown);
      window.removeEventListener("pointermove", onMove);
      window.removeEventListener("pointerup", onUp);
      window.removeEventListener("pointercancel", onUp);
      if (idleTimer) clearTimeout(idleTimer);
      ro.disconnect();
      disposables.forEach((o) => disposeObject(o));
      scene.clear();
      renderer.dispose();
      canvas.remove();
    };
  }, []);

  return <div ref={mountRef} className={className} aria-hidden />;
}
