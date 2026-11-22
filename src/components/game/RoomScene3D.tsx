"use client";

/**
 * RoomScene3D — real 3D interiors for the seven manor wings.
 * Toon-shaded room shell (walls, wainscot, window with sky, floor),
 * furniture from the furniture3d kit placed at each shop slot,
 * glowing golden beams for empty slots (tap → shop), tap-to-switch on
 * owned furniture, drag-to-orbit and a gentle idle sway.
 */

import { useEffect, useRef } from "react";
import * as THREE from "three";
import { ROOM_BY_ID } from "@/game/decor";
import { buildFurniture, furnitureFootprint } from "@/game/furniture3d";
import {
  createLightRig,
  createRenderer,
  disposeObject,
  hasWebGL,
  makeToonGradient,
  toonMat,
} from "@/game/three-kit";

/* --------------------------- room shells --------------------------- */

interface RoomShell {
  mode: "indoor" | "garden" | "greenhouse";
  wall: number;
  wallAlt: number; // wainscot / band
  floor: number;
  windowX?: number; // world x center of the back-wall window
  windowW?: number;
  windowH?: number;
}

const SHELLS: Record<string, RoomShell> = {
  living: { mode: "indoor", wall: 0xf7e8d3, wallAlt: 0xebd7b8, floor: 0xc99c6b, windowX: 2.15, windowW: 1.25, windowH: 1.6 },
  library: { mode: "indoor", wall: 0xefe0c8, wallAlt: 0xe3cba6, floor: 0xb98a55, windowX: -0.25, windowW: 1.1, windowH: 1.45 },
  kitchen: { mode: "indoor", wall: 0xf5efe0, wallAlt: 0xeaf2ec, floor: 0xd8cbb2, windowX: -0.7, windowW: 1.25, windowH: 1.4 },
  bedroom: { mode: "indoor", wall: 0xf3e3dc, wallAlt: 0xebd7b8, floor: 0xc99c6b, windowX: 2.0, windowW: 1.2, windowH: 1.5 },
  greenhouse: { mode: "greenhouse", wall: 0xdff2fb, wallAlt: 0x9fb8a8, floor: 0xb8a88f },
  garden: { mode: "garden", wall: 0xa8d8a0, wallAlt: 0x8bc98a, floor: 0x9ccf8e },
  hallway: { mode: "indoor", wall: 0xf3e8d0, wallAlt: 0xebd7b8, floor: 0xb98a55 },
  bathroom: { mode: "indoor", wall: 0xe7f1f2, wallAlt: 0xc3dde0, floor: 0xd9e2df, windowX: -1.6, windowW: 1.1, windowH: 1.3 },
  dining: { mode: "indoor", wall: 0xf7ecd8, wallAlt: 0xecd6b4, floor: 0xd2a878, windowX: 1.4, windowW: 1.3, windowH: 1.55 },
  music: { mode: "indoor", wall: 0xeadfe9, wallAlt: 0xd9c9dd, floor: 0xb98a55, windowX: -1.9, windowW: 1.15, windowH: 1.45 },
  study: { mode: "indoor", wall: 0xe6dcc4, wallAlt: 0xd9c9a4, floor: 0xa97e4f, windowX: 2.0, windowW: 1.1, windowH: 1.4 },
  attic: { mode: "indoor", wall: 0xecdcc0, wallAlt: 0xdfc9a2, floor: 0xb08a5e, windowX: 0, windowW: 1.0, windowH: 1.2 },
  gazebo: { mode: "garden", wall: 0xa8d8a0, wallAlt: 0x8bc98a, floor: 0xa2d18d },
  guesthouse: { mode: "indoor", wall: 0xf5e9d2, wallAlt: 0xead4b0, floor: 0xc99c6b, windowX: 1.6, windowW: 1.15, windowH: 1.4 },
  stable: { mode: "indoor", wall: 0xe8d6b4, wallAlt: 0xd9bd8e, floor: 0xb59a72 },
  orchard: { mode: "garden", wall: 0xa8d8a0, wallAlt: 0x8bc98a, floor: 0x93c684 },
};

const ROOM_W = 7.2;
const ROOM_D = 4.4; // back wall z=-2.2 … front z=+2.2
const WALL_H = 3.1;
const CEIL_Y = WALL_H;

const HANG_H: Record<string, number> = {
  chandelier: 1.05,
  hall_chandelier: 1.4,
  pendant_light: 1.15,
  grow_lamp: 1.15,
  dining_chandelier: 1.05,
  attic_lamp: 0.9,
  green_hanger: 0.9,
};

interface SlotNode {
  slotId: string;
  anchor: THREE.Group;
  hit: THREE.Mesh;
  ring: THREE.Mesh | null;
  ringMat: THREE.MeshBasicMaterial | null;
  owned: boolean;
}

interface RoomScene3DProps {
  roomId: string;
  decor: Record<string, { variant: number }>;
  onSlotTap: (slotId: string) => void;
  /**
   * Reports the on-screen x position (%) of every EMPTY slot, projected
   * from the live 3D camera — so "go to shop" buttons and slot chips can
   * sit EXACTLY beneath the spot they point at, even while orbiting.
   */
  onSlotPositions?: (positions: Record<string, number>) => void;
  className?: string;
}

export function RoomScene3D({ roomId, decor, onSlotTap, onSlotPositions, className }: RoomScene3DProps) {
  const mountRef = useRef<HTMLDivElement>(null);
  const propsRef = useRef({ decor, onSlotTap, onSlotPositions });
  useEffect(() => {
    propsRef.current = { decor, onSlotTap, onSlotPositions };
  });

  const apiRef = useRef<{ rebuildDecor: (d: Record<string, { variant: number }>) => void } | null>(null);
  const slotsRef = useRef<SlotNode[]>([]);

  useEffect(() => {
    const mount = mountRef.current;
    if (!mount || !hasWebGL()) return;
    const el = mount;

    const canvas = document.createElement("canvas");
    canvas.className = "block h-full w-full touch-none";
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
    const camera = new THREE.PerspectiveCamera(42, 1, 0.1, 60);
    const shell = SHELLS[roomId] ?? SHELLS.living;

    const { hemi, key, fill } = createLightRig(shell.mode === "indoor" ? 0.9 : 1.15);
    scene.add(hemi, key, fill);

    const root = new THREE.Group();
    scene.add(root);

    const disposables: THREE.Object3D[] = [];
    const track = <T extends THREE.Object3D>(o: T): T => {
      disposables.push(o);
      return o;
    };
    const decorGroup = new THREE.Group();
    root.add(decorGroup);
    const slots: SlotNode[] = [];
    slotsRef.current = slots;

    /* ------------------------- shell ------------------------- */

    function plane(w: number, h: number, color: number, pos: [number, number, number], rot?: [number, number, number]): THREE.Mesh {
      const m = new THREE.Mesh(new THREE.PlaneGeometry(w, h), toonMat(color, gradient));
      m.position.set(...pos);
      if (rot) m.rotation.set(...rot);
      root.add(m);
      return m;
    }

    function buildWindow(cx: number, w: number, h: number) {
      const g = new THREE.Group();
      g.position.set(cx, 1.85, -2.16);
      const frame = new THREE.Mesh(new THREE.BoxGeometry(w + 0.18, h + 0.18, 0.1), toonMat(0x8a5a33, gradient));
      g.add(frame);
      const glass = new THREE.Mesh(new THREE.PlaneGeometry(w, h), new THREE.MeshBasicMaterial({ color: 0xbfe3f0 }));
      glass.position.z = 0.06;
      g.add(glass);
      const sun = new THREE.Mesh(new THREE.CircleGeometry(0.16, 14), new THREE.MeshBasicMaterial({ color: 0xffe9a8 }));
      sun.position.set(-w * 0.22, h * 0.22, 0.07);
      g.add(sun);
      const hill = new THREE.Mesh(new THREE.PlaneGeometry(w, h * 0.34), new THREE.MeshBasicMaterial({ color: 0xa8d8a0 }));
      hill.position.set(0, -h * 0.3, 0.07);
      g.add(hill);
      const barV = new THREE.Mesh(new THREE.BoxGeometry(0.05, h, 0.03), toonMat(0x8a5a33, gradient));
      barV.position.z = 0.08;
      g.add(barV);
      const barH = new THREE.Mesh(new THREE.BoxGeometry(w, 0.05, 0.03), toonMat(0x8a5a33, gradient));
      barH.position.z = 0.08;
      g.add(barH);
      root.add(g);
    }

    function buildShell() {
      if (shell.mode === "garden") {
        plane(ROOM_W + 6, 12, 0xcfeef7, [0, 4.4, -7]); // sky
        const sun = new THREE.Mesh(new THREE.SphereGeometry(0.55, 14, 14), new THREE.MeshBasicMaterial({ color: 0xffe08a }));
        sun.position.set(-3.2, 4.6, -6.4);
        root.add(sun);
        // distant hills
        for (const [hx, hr, hz] of [[-3.4, 1.7, -5.6], [0.4, 2.2, -6], [3.8, 1.5, -5.6]] as const) {
          const hill = new THREE.Mesh(new THREE.SphereGeometry(hr, 16, 12), toonMat(0x8bc98a, gradient));
          hill.scale.y = 0.55;
          hill.position.set(hx, 0, hz);
          root.add(hill);
        }
        // hedge along the back
        for (let i = 0; i < 9; i++) {
          const ball = new THREE.Mesh(new THREE.SphereGeometry(0.62, 12, 10), toonMat(0x5f9e57, gradient));
          ball.position.set(-3.5 + i * 0.9, 0.5, -2.5 + (i % 2) * 0.14);
          root.add(ball);
        }
        plane(ROOM_W, ROOM_D, shell.floor, [0, 0, 0], [-Math.PI / 2, 0, 0]);
        // flower dots on the lawn
        for (let i = 0; i < 14; i++) {
          const fx = (Math.random() * 2 - 1) * 3.2;
          const fz = (Math.random() * 2 - 1) * 1.6;
          if (Math.abs(fx) < 1.2 && fz > 0) continue;
          const petal = new THREE.Mesh(new THREE.SphereGeometry(0.05, 6, 6), new THREE.MeshBasicMaterial({ color: [0xf06ea9, 0xf5b301, 0xffffff][i % 3] }));
          petal.position.set(fx, 0.04, fz);
          root.add(petal);
        }
        return;
      }

      // back wall (+ window)
      plane(ROOM_W, WALL_H, shell.wall, [0, WALL_H / 2, -2.2]);
      if (shell.windowX !== undefined) {
        buildWindow(shell.windowX, shell.windowW ?? 1.2, shell.windowH ?? 1.5);
      }
      // side walls
      plane(ROOM_D, WALL_H, shell.wall, [-ROOM_W / 2, WALL_H / 2, 0], [0, Math.PI / 2, 0]);
      plane(ROOM_D, WALL_H, shell.wall, [ROOM_W / 2, WALL_H / 2, 0], [0, -Math.PI / 2, 0]);
      // ceiling
      plane(ROOM_W, ROOM_D, 0xfff6e8, [0, CEIL_Y, 0], [Math.PI / 2, 0, 0]);
      // floor
      plane(ROOM_W, ROOM_D, shell.floor, [0, 0, 0], [-Math.PI / 2, 0, 0]);
      // floor planks hint
      for (let i = 1; i < 6; i++) {
        const line = new THREE.Mesh(new THREE.BoxGeometry(ROOM_W, 0.005, 0.02), new THREE.MeshBasicMaterial({ color: 0x000000, transparent: true, opacity: 0.08 }));
        line.position.set(0, 0.01, -2.2 + i * (ROOM_D / 6));
        root.add(line);
      }
      // wainscot band + skirting
      const band = new THREE.Mesh(new THREE.BoxGeometry(ROOM_W, 0.9, 0.06), toonMat(shell.wallAlt, gradient));
      band.position.set(0, 0.85, -2.17);
      root.add(band);
      const rail = new THREE.Mesh(new THREE.BoxGeometry(ROOM_W, 0.07, 0.1), toonMat(0xd9bf98, gradient));
      rail.position.set(0, 1.32, -2.16);
      root.add(rail);
      const skirt = new THREE.Mesh(new THREE.BoxGeometry(ROOM_W, 0.14, 0.1), toonMat(0xd9bf98, gradient));
      skirt.position.set(0, 0.07, -2.16);
      root.add(skirt);

      if (shell.mode === "greenhouse") {
        // glass panels with wooden beams
        const glassMat = new THREE.MeshPhongMaterial({ color: 0xdff2fb, transparent: true, opacity: 0.22, side: THREE.DoubleSide, depthWrite: false });
        for (let i = 0; i < 6; i++) {
          const beam = new THREE.Mesh(new THREE.BoxGeometry(0.1, WALL_H, 0.1), toonMat(0x8a6a45, gradient));
          beam.position.set(-3 + i * 1.2, WALL_H / 2, -2.2);
          root.add(beam);
        }
        const glassWall = new THREE.Mesh(new THREE.PlaneGeometry(ROOM_W, WALL_H), glassMat);
        glassWall.position.set(0, WALL_H / 2, -2.26);
        root.add(glassWall);
        const roofGlass = new THREE.Mesh(new THREE.PlaneGeometry(ROOM_W, ROOM_D), glassMat);
        roofGlass.position.set(0, CEIL_Y + 0.01, 0);
        roofGlass.rotation.x = Math.PI / 2;
        root.add(roofGlass);
      }

      if (roomId === "hallway") {
        // two arched doorways on the back wall
        for (const dx of [-1.9, 1.9]) {
          const door = new THREE.Mesh(new THREE.BoxGeometry(1.1, 2.1, 0.08), toonMat(0xa9713f, gradient));
          door.position.set(dx, 1.05, -2.14);
          root.add(door);
          const inset = new THREE.Mesh(new THREE.BoxGeometry(0.9, 1.9, 0.06), toonMat(0x6d4426, gradient));
          inset.position.set(dx, 0.95, -2.12);
          root.add(inset);
          const knob = new THREE.Mesh(new THREE.SphereGeometry(0.05, 8, 8), toonMat(0xf5b301, gradient));
          knob.position.set(dx + 0.3, 1.0, -2.08);
          root.add(knob);
        }
      }
      if (roomId === "kitchen") {
        // tile band along the upper wall
        const tiles = new THREE.Mesh(new THREE.PlaneGeometry(ROOM_W, 1.5), toonMat(shell.wallAlt, gradient));
        tiles.position.set(0, 2.25, -2.17);
        root.add(tiles);
      }
    }

    /* ------------------------- slots & furniture ------------------------- */

    function slotWorld(slot: { x: number; y: number; anchorTop?: boolean; place?: "floor" | "wall" | "window"; wy?: number; z?: number; item: string; scale: number }): [number, number, number] {
      const wx = (slot.x - 200) * 0.0175;
      if (slot.anchorTop) {
        const hangH = HANG_H[slot.item] ?? 1.0;
        return [wx, CEIL_Y - hangH, 0];
      }
      // ON the window: curtains frame it exactly (window centre y = 1.85)
      if (slot.place === "window") {
        const winBottom = 1.85 - (shell.windowH ?? 1.5) / 2;
        return [shell.windowX ?? 2.15, slot.wy !== undefined ? slot.wy : winBottom, -2.0];
      }
      // mounted on the back wall, just in front of it
      if (slot.place === "wall") {
        return [wx, slot.wy ?? 0, -2.0];
      }
      if (slot.z !== undefined) {
        return [wx, 0, slot.z];
      }
      const wz = slot.y >= 210 ? 0.9 : slot.y >= 180 ? 0.15 : -0.45;
      return [wx, 0, wz];
    }

    function makeShadow(item: string, scale: number, x: number, z: number) {
      const r = furnitureFootprint(item) * scale * 0.75;
      const shadow = new THREE.Mesh(
        new THREE.CircleGeometry(r, 18),
        new THREE.MeshBasicMaterial({ color: 0x3a2a18, transparent: true, opacity: 0.16, depthWrite: false }),
      );
      shadow.rotation.x = -Math.PI / 2;
      shadow.position.set(x, 0.02, z);
      decorGroup.add(shadow);
    }

    function rebuildDecor(d: Record<string, { variant: number }>) {
      // clear
      for (const s of slots) {
        s.hit.removeFromParent();
        disposeObject(s.hit);
      }
      slots.length = 0;
      slotsRef.current = slots;
      disposeObject(decorGroup);
      decorGroup.clear();

      const room = ROOM_BY_ID.get(roomId);
      if (!room) return;

      room.slots.forEach((slot, idx) => {
        const owned = d[slot.id];
        const [x, y, z] = slotWorld(slot);
        const anchor = new THREE.Group();
        anchor.position.set(x, y, z);
        decorGroup.add(anchor);

        if (owned) {
          const model = buildFurniture(slot.item, owned.variant, gradient);
          if (model) {
            anchor.add(model);
            const s = Math.min(slot.scale, 1.35);
            model.scale.setScalar(s);
          }
          // floor shadows only for free-standing items
          const onFloor = !slot.anchorTop && (slot.place ?? "floor") === "floor";
          if (onFloor) makeShadow(slot.item, Math.min(slot.scale, 1.35), x, z);
        } else {
          // golden "build here" marker: pulsing ring + light beam
          const beam = new THREE.Mesh(
            new THREE.CylinderGeometry(0.14, 0.2, slot.anchorTop ? 0.5 : 1.1, 12, 1, true),
            new THREE.MeshBasicMaterial({ color: 0xffd54f, transparent: true, opacity: 0.3, side: THREE.DoubleSide, depthWrite: false }),
          );
          beam.position.y = slot.anchorTop ? -0.45 : 0.6;
          anchor.add(beam);
          const ringMat = new THREE.MeshBasicMaterial({ color: 0xf5b301, transparent: true, opacity: 0.8 });
          const ring = new THREE.Mesh(new THREE.TorusGeometry(0.3, 0.035, 8, 24), ringMat);
          ring.rotation.x = Math.PI / 2;
          ring.position.y = slot.anchorTop ? -0.2 : 0.05;
          anchor.add(ring);
          const node: SlotNode = { slotId: slot.id, anchor, hit: null as unknown as THREE.Mesh, ring, ringMat, owned: false };
          // invisible hit target
          const hit = new THREE.Mesh(
            new THREE.CylinderGeometry(0.55, 0.55, slot.anchorTop ? 1 : 1.6, 8),
            new THREE.MeshBasicMaterial({ transparent: true, opacity: 0, depthWrite: false }),
          );
          hit.position.y = slot.anchorTop ? 0 : 0.7;
          hit.userData.slotId = slot.id;
          anchor.add(hit);
          node.hit = hit;
          slots.push(node);
          if (node.ring) node.ring.userData.phase = idx * 0.7;
        }

        // hit target for owned furniture (tap → switch model)
        if (owned) {
          const hit = new THREE.Mesh(
            new THREE.CylinderGeometry(0.6, 0.6, slot.anchorTop ? 1.2 : 1.9, 8),
            new THREE.MeshBasicMaterial({ transparent: true, opacity: 0, depthWrite: false }),
          );
          hit.position.y = slot.anchorTop ? 0.3 : 0.9;
          hit.userData.slotId = slot.id;
          anchor.add(hit);
          slots.push({ slotId: slot.id, anchor, hit, ring: null, ringMat: null, owned: true });
        }
      });
    }
    apiRef.current = { rebuildDecor };

    buildShell();
    rebuildDecor(propsRef.current.decor);

    /* ------------------------- input ------------------------- */

    const raycaster = new THREE.Raycaster();
    const ndc = new THREE.Vector2();
    let downX = 0;
    let downY = 0;
    let dragging = false;
    let azimuth = 0;
    let azimuthTarget = 0;

    const onDown = (e: PointerEvent) => {
      downX = e.clientX;
      downY = e.clientY;
      dragging = true;
    };
    const onMove = (e: PointerEvent) => {
      if (!dragging) return;
      azimuthTarget = THREE.MathUtils.clamp(azimuthTarget + (e.movementX || 0) * 0.004, -0.5, 0.5);
    };
    const onUp = (e: PointerEvent) => {
      dragging = false;
      if (Math.hypot(e.clientX - downX, e.clientY - downY) > 9) return;
      const rect = canvas.getBoundingClientRect();
      ndc.set(((e.clientX - rect.left) / rect.width) * 2 - 1, -((e.clientY - rect.top) / rect.height) * 2 + 1);
      raycaster.setFromCamera(ndc, camera);
      const hits = raycaster.intersectObjects(slotsRef.current.map((s) => s.hit), false);
      if (hits.length > 0) {
        const slotId = hits[0].object.userData.slotId as string;
        propsRef.current.onSlotTap(slotId);
      }
    };
    canvas.addEventListener("pointerdown", onDown);
    canvas.addEventListener("pointermove", onMove);
    canvas.addEventListener("pointerup", onUp);
    canvas.addEventListener("pointerleave", () => (dragging = false));

    /* ------------------------- resize & loop ------------------------- */

    const resize = () => {
      const w = el.clientWidth || 1;
      const h = el.clientHeight || 1;
      renderer.setSize(w, h, false);
      camera.aspect = w / h;
      camera.updateProjectionMatrix();
    };
    resize();
    const ro = new ResizeObserver(resize);
    ro.observe(el);

    const clock = new THREE.Clock();
    let raf = 0;
    let running = true;
    let elapsed = 0;
    const camTarget = new THREE.Vector3(0, 1.15, 0);
    const camBase = new THREE.Vector3(0, 2.6, 6.2);

    // live projection of empty-slot screen positions for the parent UI
    const projVec = new THREE.Vector3();
    let lastReport = 0;
    const lastMap: Record<string, number> = {};
    const reportPositions = (now: number) => {
      if (now - lastReport < 0.28) return;
      lastReport = now;
      const cb = propsRef.current.onSlotPositions;
      if (!cb) return;
      let changed = false;
      const out: Record<string, number> = {};
      for (const s of slotsRef.current) {
        if (s.owned) continue;
        s.anchor.getWorldPosition(projVec);
        projVec.project(camera);
        const xp = Math.round(Math.min(94, Math.max(6, (projVec.x * 0.5 + 0.5) * 100)));
        out[s.slotId] = xp;
        if (Math.abs((lastMap[s.slotId] ?? -99) - xp) > 1) changed = true;
      }
      if (changed || Object.keys(lastMap).length !== Object.keys(out).length) {
        for (const k of Object.keys(lastMap)) delete lastMap[k];
        Object.assign(lastMap, out);
        cb(out);
      }
    };

    const tick = () => {
      if (!running) return;
      raf = requestAnimationFrame(tick);
      const dt = Math.min(clock.getDelta(), 0.05);
      elapsed += dt;

      // orbit: drag offset + idle sway
      azimuth += (azimuthTarget - azimuth) * Math.min(1, dt * 6);
      const sway = Math.sin(elapsed * 0.35) * 0.05;
      const a = azimuth + sway;
      const r = Math.hypot(camBase.x, camBase.z);
      camera.position.set(
        Math.sin(a) * r,
        camBase.y + Math.sin(elapsed * 0.5) * 0.06,
        Math.cos(a) * r,
      );
      camera.lookAt(camTarget);

      // pulsing rings for empty slots
      for (const s of slotsRef.current) {
        if (s.ring && s.ringMat && !s.owned) {
          const phase = (s.ring.userData.phase as number) ?? 0;
          s.ringMat.opacity = 0.45 + Math.sin(elapsed * 3.4 + phase) * 0.3;
          const sc = 1 + Math.sin(elapsed * 3.4 + phase) * 0.12;
          s.ring.scale.setScalar(sc);
          s.ring.rotation.z = elapsed * 0.8;
        }
      }

      reportPositions(elapsed);
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
      canvas.removeEventListener("pointermove", onMove);
      canvas.removeEventListener("pointerup", onUp);
      ro.disconnect();
      slotsRef.current = [];
      apiRef.current = null;
      disposables.forEach((o) => disposeObject(o));
      disposeObject(decorGroup);
      decorGroup.removeFromParent();
      scene.clear();
      renderer.dispose();
      canvas.remove();
    };
  }, [roomId]);

  // reactive: rebuild furniture when decor map changes
  useEffect(() => {
    apiRef.current?.rebuildDecor(decor);
  }, [decor]);

  return <div ref={mountRef} className={className ?? "aspect-[4/3] w-full"} aria-hidden />;
}
