"use client";

/**
 * Tubes3D — the water-sort puzzle rendered as a real 3D scene.
 * Glass tubes and colors FLOAT freely in the air (no table, no stands —
 * the tubes hover with a gentle bob) on clearly separated "floating shelves":
 *
 *  - 1..5 tubes  → one single horizontal row (big, side by side)
 *  - 6+ tubes    → two vertically stacked rows with a wide air gap, so
 *                  every tube is fully visible and tappable — nothing is
 *                  ever hidden behind another tube.
 *
 * The pour is a full "pitcher pour": the source tube lifts above the board,
 * glides over the destination while swinging up, then hangs tilted (leaning
 * slightly towards the camera, in front of the board plane) with its mouth
 * landed exactly above the destination mouth. A solid vertical stream falls
 * into the destination while units drain / fill in exact stack slots, then
 * the tube arcs back home. Liquids always stack from the tube floor with
 * zero drift; emptied slivers are hidden instantly. The hanging tube floats
 * in front of the board plane, so it can never sweep through other tubes.
 *
 * Exposes the same imperative `pour()` API as the DOM fallback board.
 */

import { forwardRef, useEffect, useImperativeHandle, useRef } from "react";
import * as THREE from "three";
import { LIQUIDS } from "@/game/palette";
import { isTubeComplete } from "@/game/solver";
import {
  createLightRig,
  createRenderer,
  disposeObject,
  hasWebGL,
  makeToonGradient,
} from "@/game/three-kit";
import { UNIT_MS, type TubeBoardApi } from "@/game/board-anim";

/* ----------------------------- world metrics ----------------------------- */
const UNIT_H = 0.52;
/** half height of a liquid unit cylinder (unit geo height = UNIT_H * 0.88) */
const HALF_H = UNIT_H * 0.44;
const TUBE_R = 0.42;
const TUBE_H = UNIT_H * 4 + 0.45;
const SPACING = 1.14;
/** air gap between the two floating shelf rows */
const SHELF_GAP = 0.52;
/** y raise of the upper shelf row */
const RISE = TUBE_H + SHELF_GAP;
/** two rows only from this tube count up (below → one big row) */
const TWO_ROWS_FROM = 6;
const UP = new THREE.Vector3(0, 1, 0);

const SEL_LIFT = 0.34; // selected tube hover
const clamp01 = (v: number) => Math.min(Math.max(v, 0), 1);

/* ------------------------- pour choreography ------------------------- */
/** gap between the hanging mouth and the destination rim */
const MOUTH_GAP = 0.22;
/** final hang tilt (rad ≈ 130°) — mouth points down into the destination */
const TILT_POUR = 2.27;
/** transit tilt (rad ≈ 95°) — mouth leads sideways while gliding over */
const TILT_FLY = 1.66;
const LIFT_MS = 180;
const TRANSIT_MS = 250;
const TIPIN_MS = 175;
const RETURN_MS = 340;
/** z blended into the lean direction — the camera sits at +z, so a negative
 * z puts the hanging tube body in FRONT of the board plane (never clipping
 * through the other tubes while it descends). */
const CAM_LEAN = -0.62;
/** ?slowmo → 3× slower pours, for visual inspection */
const SLOW = typeof window !== "undefined" && window.location.search.includes("slowmo");
const D = (ms: number) => (SLOW ? ms * 3 : ms);

interface TubeNode {
  group: THREE.Group;
  liquid: THREE.Group;
  ring: THREE.Mesh;
  ringMat: THREE.MeshBasicMaterial;
  hit: THREE.Mesh;
  baseX: number;
  baseY: number;
  baseZ: number;
  /** idle-bob phase offset so tubes don't float in lockstep */
  floatPhase: number;
  units: THREE.Mesh[];
}

interface Burst {
  points: THREE.Points;
  mat: THREE.PointsMaterial;
  vels: Float32Array;
  born: number;
  life: number;
}

interface DustMotes {
  points: THREE.Points;
  mat: THREE.PointsMaterial;
  vels: Float32Array;
  bounds: { x: number; y: number; z: number };
}

interface Tubes3DProps {
  tubes: number[][];
  selected: number | null;
  hinted: { from: number; to: number } | null;
  justCompleted: number[];
  shakeIdx: number | null;
  onTap: (index: number) => void;
  className?: string;
}

export const Tubes3D = forwardRef<TubeBoardApi, Tubes3DProps>(function Tubes3D(
  { tubes, selected, hinted, justCompleted, shakeIdx, onTap, className },
  ref,
) {
  const mountRef = useRef<HTMLDivElement>(null);
  const propsRef = useRef({ tubes, selected, hinted, shakeIdx, onTap });

  useEffect(() => {
    propsRef.current = { tubes, selected, hinted, shakeIdx, onTap };
  });

  const nodesRef = useRef<TubeNode[]>([]);
  const quietRef = useRef<Set<number>>(new Set());
  const pouringRef = useRef<number | null>(null);
  const burstsRef = useRef<Burst[]>([]);
  const dustRef = useRef<DustMotes | null>(null);
  const growRef = useRef<{ mesh: THREE.Mesh; p: number; k: number }[]>([]);
  const shakeRef = useRef<{ idx: number; until: number } | null>(null);
  const completeRef = useRef<boolean[]>([]);
  const prevCompletedRef = useRef<number[]>([]);
  const pourImplRef = useRef<TubeBoardApi["pour"] | null>(null);

  /* imperative handle delegated to the scene implementation */
  useImperativeHandle(
    ref,
    () => ({
      pour: (from: number, to: number, count: number, color: number) =>
        pourImplRef.current ? pourImplRef.current(from, to, count, color) : Promise.resolve(),
    }),
    [],
  );

  /* keep a stable copy of latest tubes for the imperative pour */
  const tubesRef = useRef(tubes);
  useEffect(() => {
    tubesRef.current = tubes;
  }, [tubes]);

  /* ------------------------------ scene setup ------------------------------ */
  const apiRef = useRef<{
    buildBoard: (state: number[][]) => void;
    syncTubes: (state: number[][]) => void;
    burst: (idx: number) => void;
    refit: () => void;
  } | null>(null);

  useEffect(() => {
    const mount = mountRef.current;
    if (!mount || !hasWebGL()) return;

    const canvas = document.createElement("canvas");
    canvas.className = "block h-full w-full touch-none";
    mount.appendChild(canvas);
    const el = mount;

    let renderer: THREE.WebGLRenderer;
    try {
      renderer = createRenderer(canvas);
    } catch {
      canvas.remove();
      return;
    }

    const scene = new THREE.Scene();
    const gradient = makeToonGradient();

    const camera = new THREE.PerspectiveCamera(40, 1, 0.1, 80);
    const lookTargetV = new THREE.Vector3(0, 1.2, 0);

    const { hemi, key, fill } = createLightRig(7);
    scene.add(hemi, key, fill);

    const nodes: TubeNode[] = [];
    nodesRef.current = nodes;
    const disposables: THREE.Object3D[] = [];
    const track = <T extends THREE.Object3D>(o: T): T => {
      disposables.push(o);
      return o;
    };

    /* shared resources */
    const unitGeo = new THREE.CylinderGeometry(TUBE_R - 0.06, TUBE_R - 0.06, UNIT_H * 0.88, 22);
    /** glossy "liquid surface" cap sitting on top of every unit band */
    const capGeo = new THREE.CylinderGeometry(TUBE_R - 0.03, TUBE_R - 0.05, 0.085, 20);
    const glassGeo = new THREE.CylinderGeometry(TUBE_R, TUBE_R * 0.9, TUBE_H, 26, 1, false);
    const ringGeo = new THREE.TorusGeometry(TUBE_R + 0.17, 0.035, 8, 30);
    const hitGeo = new THREE.CylinderGeometry(TUBE_R + 0.16, TUBE_R + 0.16, TUBE_H + 0.35, 10);
    const liqMats = LIQUIDS.map(
      (c) => new THREE.MeshToonMaterial({ color: new THREE.Color(c.base), gradientMap: gradient, emissive: new THREE.Color(c.dark).multiplyScalar(0.22) }),
    );
    const capMats = LIQUIDS.map(
      (c) => new THREE.MeshPhongMaterial({ color: new THREE.Color(c.light), shininess: 120, specular: 0xffffff, emissive: new THREE.Color(c.light).multiplyScalar(0.18) }),
    );
    const glassMat = new THREE.MeshPhongMaterial({
      color: 0xdff2fb,
      transparent: true,
      opacity: 0.16,
      shininess: 90,
      specular: 0xffffff,
      depthWrite: false,
      side: THREE.DoubleSide,
    });
    const rimMat = new THREE.MeshPhongMaterial({ color: 0xffffff, transparent: true, opacity: 0.5, shininess: 80 });

    const bottomY = (k: number) => 0.1 + UNIT_H / 2 + k * UNIT_H;

    /* layout: how many shelf rows and how many tubes per row.
     * Row 0 is the TOP floating shelf, row 1 sits below it —
     * indices 0..rows[0]-1 live on the top shelf (matches the DOM board). */
    function layoutFor(n: number): { rows: number[]; twoRows: boolean } {
      const twoRows = n >= TWO_ROWS_FROM;
      return { rows: twoRows ? [Math.ceil(n / 2), n - Math.ceil(n / 2)] : [n], twoRows };
    }

    function slotBase(i: number, n: number): { x: number; y: number; rowTop: boolean } {
      const { rows, twoRows } = layoutFor(n);
      const rowTop = twoRows && i < rows[0];
      const rowCount = twoRows ? (rowTop ? rows[0] : rows[1]) : rows[0];
      const startInRow = twoRows && !rowTop ? rows[0] : 0;
      const k = i - startInRow;
      return { x: (k - (rowCount - 1) / 2) * SPACING, y: rowTop ? RISE : 0, rowTop };
    }

    function makeUnit(color: number, k: number): THREE.Mesh {
      const m = new THREE.Mesh(unitGeo, liqMats[color % liqMats.length]);
      m.position.y = bottomY(k);
      // glossy top surface: a child so it inherits the drain/fill scaling —
      // the "liquid level" visibly descends when the unit shrinks
      const cap = new THREE.Mesh(capGeo, capMats[color % capMats.length]);
      cap.position.y = UNIT_H * 0.44 - 0.045;
      m.add(cap);
      return m;
    }

    /* floating board root — tubes hover in the air, no table beneath */
    const boardRoot = new THREE.Group();
    scene.add(track(boardRoot));

    /* ambient golden dust drifting around the floating tubes */
    const dust = (() => {
      const n = 46;
      const positions = new Float32Array(n * 3);
      const vels = new Float32Array(n * 3);
      const bounds = { x: 5.7, y: RISE + TUBE_H + 1.4, z: 2.5 };
      for (let i = 0; i < n; i++) {
        positions[i * 3] = (Math.random() * 2 - 1) * bounds.x;
        positions[i * 3 + 1] = Math.random() * bounds.y * 1.4 - 0.4;
        positions[i * 3 + 2] = (Math.random() * 2 - 1) * bounds.z;
        vels[i * 3] = (Math.random() - 0.5) * 0.12;
        vels[i * 3 + 1] = 0.14 + Math.random() * 0.2;
        vels[i * 3 + 2] = (Math.random() - 0.5) * 0.1;
      }
      const geo = new THREE.BufferGeometry();
      geo.setAttribute("position", new THREE.BufferAttribute(positions, 3));
      const mat = new THREE.PointsMaterial({
        color: 0xffe9b0,
        size: 0.085,
        transparent: true,
        opacity: 0.55,
        depthWrite: false,
      });
      const points = new THREE.Points(geo, mat);
      scene.add(points);
      return { points, mat, vels, bounds };
    })();
    dustRef.current = dust;

    /* ------------------------- camera framing ------------------------- */
    /* Fits the whole floating board (both shelves + pour headroom) with a
     * gentle downward tilt. Re-run on build and on resize. */
    let fitLook = new THREE.Vector3(0, 1.2, 0);
    let fitCamYOff = 2.2;
    let fitDist = 9;
    /** world Y of the top edge of the viewport at the board plane (approx) */
    let fitTopY = 8;

    function refitCamera() {
      const n = Math.max(nodes.length, 1);
      const { twoRows } = layoutFor(n);
      let maxCount = 1;
      let maxRowY = 0;
      nodes.forEach((nd) => {
        maxRowY = Math.max(maxRowY, nd.baseY);
      });
      const { rows } = layoutFor(n);
      maxCount = Math.max(...rows);
      const width = (maxCount - 1) * SPACING + TUBE_R * 2 + 0.5;
      const worldTop = maxRowY + TUBE_H + 0.66; // headroom for hover + pour arc
      const worldBottom = -0.22;
      const contentH = worldTop - worldBottom;
      const vFov = (camera.fov * Math.PI) / 180;
      const aspect = Math.max(camera.aspect || (el.clientWidth || 1) / (el.clientHeight || 1), 0.35);
      const distV = (contentH * 1.03) / (2 * Math.tan(vFov / 2));
      const distH = (width * 1.03) / (2 * Math.tan(vFov / 2) * aspect);
      fitDist = Math.max(distV, distH) + 0.3;
      fitLook = new THREE.Vector3(0, (worldTop + worldBottom) / 2 + (twoRows ? 0 : 0.06), 0);
      fitCamYOff = fitDist * 0.3;
      camera.position.set(0, fitLook.y + fitCamYOff, Math.sqrt(Math.max(fitDist * fitDist - fitCamYOff * fitCamYOff, 1)));
      camera.lookAt(fitLook);
      lookTargetV.copy(fitLook);
      fitTopY = fitLook.y + Math.tan(vFov / 2) * Math.sqrt(Math.max(fitDist * fitDist - fitCamYOff * fitCamYOff, 1));
    }

    function buildBoard(state: number[][]) {
      // clear previous tubes
      for (const n of nodes) {
        n.group.removeFromParent();
        disposeObject(n.group);
      }
      nodes.length = 0;
      growRef.current = [];

      state.forEach((units, i) => {
        const { x, y } = slotBase(i, state.length);

        const group = new THREE.Group();
        group.position.set(x, y, 0);

        const glass = new THREE.Mesh(glassGeo, glassMat);
        glass.position.y = TUBE_H / 2 + 0.08;
        group.add(glass);

        const rim = new THREE.Mesh(new THREE.TorusGeometry(TUBE_R + 0.02, 0.045, 10, 26), rimMat);
        rim.rotation.x = Math.PI / 2;
        rim.position.y = TUBE_H + 0.08;
        group.add(rim);

        const ringMat = new THREE.MeshBasicMaterial({ color: 0xf5b301, transparent: true, opacity: 0 });
        const ring = new THREE.Mesh(ringGeo, ringMat);
        ring.rotation.x = Math.PI / 2;
        ring.position.y = 0.09;
        group.add(ring);

        const hit = new THREE.Mesh(hitGeo, new THREE.MeshBasicMaterial({ transparent: true, opacity: 0, depthWrite: false }));
        hit.position.y = TUBE_H / 2;
        hit.userData.tubeIndex = i;
        group.add(hit);

        const liquid = new THREE.Group();
        group.add(liquid);

        const node: TubeNode = { group, liquid, ring, ringMat, hit, baseX: x, baseY: y, baseZ: 0, floatPhase: i * 0.83 + Math.abs(x) * 0.6, units: [] };
        nodes.push(node);
        boardRoot.add(group);

        // initial units rise with a small stagger
        units.forEach((c, k2) => {
          const m = makeUnit(c, k2);
          m.scale.y = 0.01;
          node.units.push(m);
          node.liquid.add(m);
          growRef.current.push({ mesh: m, p: -k2 * 0.35, k: k2 });
        });
      });

      refitCamera();
    }

    function syncTubes(state: number[][]) {
      state.forEach((target, i) => {
        const node = nodes[i];
        if (!node) return;
        const quiet = quietRef.current.has(i);
        // shrink: remove extras
        while (node.units.length > target.length) {
          const m = node.units.pop();
          if (m) m.removeFromParent();
        }
        // grow: add missing
        while (node.units.length < target.length) {
          const k = node.units.length;
          const m = makeUnit(target[k], k);
          if (quiet) {
            m.scale.y = 1;
          } else {
            m.scale.y = 0.01;
            growRef.current.push({ mesh: m, p: 0, k });
          }
          node.units.push(m);
          node.liquid.add(m);
        }
        // rebuild if colors differ with same length
        if (node.units.length === target.length) {
          const mismatch = target.some((c, k) => node.units[k].material !== liqMats[c % liqMats.length]);
          if (mismatch) {
            node.units.forEach((m) => m.removeFromParent());
            node.units = [];
            target.forEach((c, k) => {
              const m = makeUnit(c, k);
              node.units.push(m);
              node.liquid.add(m);
            });
          }
        }
        // hard guarantee: every kept unit sits EXACTLY on its stack slot so
        // colors never drift or hover after a tube empties and refills
        node.units.forEach((m, k) => {
          m.position.y = bottomY(k);
          if (m.scale.y < 0.99 && m.scale.y > 0.02 && !growRef.current.some((g) => g.mesh === m)) {
            // restore any unit left mid-shrink by an interrupted pour
            m.scale.y = 1;
          }
          m.visible = true;
        });
      });
      quietRef.current.clear();
    }

    function burst(idx: number) {
      const node = nodes[idx];
      if (!node) return;
      const n = 30;
      const positions = new Float32Array(n * 3);
      const vels = new Float32Array(n * 3);
      const origin = new THREE.Vector3(node.baseX, node.baseY + TUBE_H * 0.62, node.baseZ);
      for (let i = 0; i < n; i++) {
        positions[i * 3] = origin.x;
        positions[i * 3 + 1] = origin.y;
        positions[i * 3 + 2] = origin.z;
        const a = (i / n) * Math.PI * 2;
        const r = 0.8 + Math.random() * 1.4;
        vels[i * 3] = Math.cos(a) * r * 0.9;
        vels[i * 3 + 1] = 1.6 + Math.random() * 1.8;
        vels[i * 3 + 2] = Math.sin(a) * r * 0.55;
      }
      const geo = new THREE.BufferGeometry();
      geo.setAttribute("position", new THREE.BufferAttribute(positions, 3));
      const mat = new THREE.PointsMaterial({ color: 0xffd54f, size: 0.13, transparent: true, opacity: 1, depthWrite: false });
      const points = new THREE.Points(geo, mat);
      scene.add(points);
      burstsRef.current.push({ points, mat, vels, born: performance.now(), life: 950 });
    }

    /** small liquid-coloured splash where the stream hits the surface */
    function splash(origin: THREE.Vector3, colorIdx: number) {
      const n = 12;
      const positions = new Float32Array(n * 3);
      const vels = new Float32Array(n * 3);
      for (let i = 0; i < n; i++) {
        positions[i * 3] = origin.x;
        positions[i * 3 + 1] = origin.y;
        positions[i * 3 + 2] = origin.z;
        const a = (i / n) * Math.PI * 2;
        vels[i * 3] = Math.cos(a) * (0.35 + Math.random() * 0.55);
        vels[i * 3 + 1] = 0.8 + Math.random() * 1.0;
        vels[i * 3 + 2] = Math.sin(a) * (0.3 + Math.random() * 0.45);
      }
      const geo = new THREE.BufferGeometry();
      geo.setAttribute("position", new THREE.BufferAttribute(positions, 3));
      const mat = new THREE.PointsMaterial({
        color: new THREE.Color(LIQUIDS[colorIdx % LIQUIDS.length].light),
        size: 0.085,
        transparent: true,
        opacity: 1,
        depthWrite: false,
      });
      const points = new THREE.Points(geo, mat);
      scene.add(points);
      burstsRef.current.push({ points, mat, vels, born: performance.now(), life: 620 });
    }

    apiRef.current = { buildBoard, syncTubes, burst, refit: refitCamera };

    /* ------------------------------ input ------------------------------ */
    const raycaster = new THREE.Raycaster();
    const ndc = new THREE.Vector2();
    let downX = 0;
    let downY = 0;

    const onDown = (e: PointerEvent) => {
      downX = e.clientX;
      downY = e.clientY;
    };
    const onUp = (e: PointerEvent) => {
      if (Math.hypot(e.clientX - downX, e.clientY - downY) > 9) return;
      const rect = canvas.getBoundingClientRect();
      ndc.set(((e.clientX - rect.left) / rect.width) * 2 - 1, -((e.clientY - rect.top) / rect.height) * 2 + 1);
      raycaster.setFromCamera(ndc, camera);
      const hits = raycaster.intersectObjects(nodes.map((n) => n.hit), false);
      if (hits.length > 0) {
        const idx = hits[0].object.userData.tubeIndex as number;
        propsRef.current.onTap(idx);
      }
    };
    canvas.addEventListener("pointerdown", onDown);
    canvas.addEventListener("pointerup", onUp);

    /* ------------------------------ resize ------------------------------ */
    const resize = () => {
      const w = el.clientWidth || 1;
      const h = el.clientHeight || 1;
      renderer.setSize(w, h, false);
      camera.aspect = w / h;
      camera.updateProjectionMatrix();
      refitCamera();
    };
    resize();
    const ro = new ResizeObserver(resize);
    ro.observe(el);

    /* ------------------------------ loop ------------------------------ */
    const clock = new THREE.Clock();
    let raf = 0;
    let running = true;
    let elapsed = 0;
    const prevShkRef = { current: null as number | null };

    const tick = () => {
      if (!running) return;
      raf = requestAnimationFrame(tick);
      const dt = Math.min(clock.getDelta(), 0.05);
      elapsed += dt;
      const now = performance.now();
      const { selected: sel, hinted: hin, shakeIdx: shk } = propsRef.current;

      // unit grow pop (easeOutBack) — liquid rises from the stack base,
      // the bottom edge stays glued to its slot while the column grows
      growRef.current = growRef.current.filter((g) => {
        g.p += dt * 3.4;
        const p = clamp01(g.p);
        const back = 1 + 2.2 * Math.pow(p - 1, 3) + 1.2 * Math.pow(p - 1, 2);
        const s = Math.max(0.01, p < 1 ? back : 1);
        g.mesh.scale.y = s;
        g.mesh.position.y = bottomY(g.k) - HALF_H * (1 - s);
        if (g.p >= 1) {
          g.mesh.scale.y = 1;
          g.mesh.position.y = bottomY(g.k);
          return false;
        }
        return true;
      });

      // per-tube visuals
      nodes.forEach((node, i) => {
        if (pouringRef.current !== i) {
          // gentle idle bob around the tube's own shelf height
          const bob = Math.sin(elapsed * 1.15 + node.floatPhase) * 0.07;
          const targetY = node.baseY + (sel === i ? SEL_LIFT : 0) + bob;
          node.group.position.y += (targetY - node.group.position.y) * Math.min(1, dt * 8);
          // shake (only re-armed when the shake target changes)
          if (shk !== prevShkRef.current) {
            prevShkRef.current = shk;
            if (shk === i) shakeRef.current = { idx: i, until: now + 380 };
          }
          if (shakeRef.current && shakeRef.current.idx === i) {
            const remain = shakeRef.current.until - now;
            if (remain <= 0) {
              shakeRef.current = null;
              node.group.position.x = node.baseX;
            } else {
              const decay = remain / 380;
              node.group.position.x = node.baseX + Math.sin(elapsed * 55) * 0.09 * decay;
            }
          } else {
            node.group.position.x += (node.baseX - node.group.position.x) * Math.min(1, dt * 10);
          }
        }

        // ring state
        const complete = completeRef.current[i] ?? false;
        const isSel = sel === i;
        const isHint = hin !== null && (hin.from === i || hin.to === i);
        if (isSel) {
          node.ringMat.color.setHex(0xf5a623);
          node.ringMat.opacity = 0.7 + Math.sin(elapsed * 7) * 0.25;
          node.ring.scale.setScalar(1 + Math.sin(elapsed * 7) * 0.05);
        } else if (isHint) {
          node.ringMat.color.setHex(0x2dd4a0);
          node.ringMat.opacity = 0.55 + Math.sin(elapsed * 6) * 0.35;
          node.ring.scale.setScalar(1 + Math.sin(elapsed * 6) * 0.07);
        } else if (complete) {
          node.ringMat.color.setHex(0xffd54f);
          node.ringMat.opacity = 0.42 + Math.sin(elapsed * 2.4) * 0.18;
          node.ring.scale.setScalar(1);
        } else {
          node.ringMat.opacity = 0;
        }
      });

      // sparkle bursts
      burstsRef.current = burstsRef.current.filter((b) => {
        const age = now - b.born;
        if (age > b.life) {
          b.points.removeFromParent();
          b.points.geometry.dispose();
          b.mat.dispose();
          return false;
        }
        const pos = b.points.geometry.attributes.position as THREE.BufferAttribute;
        for (let i = 0; i < pos.count; i++) {
          pos.setXYZ(
            i,
            pos.getX(i) + b.vels[i * 3] * dt,
            pos.getY(i) + b.vels[i * 3 + 1] * dt,
            pos.getZ(i) + b.vels[i * 3 + 2] * dt,
          );
          b.vels[i * 3 + 1] -= 2.6 * dt;
        }
        pos.needsUpdate = true;
        b.mat.opacity = 1 - age / b.life;
        return true;
      });

      // ambient dust drift (wraps around the floating board)
      if (dustRef.current) {
        const d = dustRef.current;
        const pos = d.points.geometry.attributes.position as THREE.BufferAttribute;
        for (let i = 0; i < pos.count; i++) {
          let x = pos.getX(i) + d.vels[i * 3] * dt;
          let y = pos.getY(i) + d.vels[i * 3 + 1] * dt;
          let z = pos.getZ(i) + d.vels[i * 3 + 2] * dt;
          if (y > d.bounds.y * 1.45) y = -0.5;
          if (x > d.bounds.x) x = -d.bounds.x;
          else if (x < -d.bounds.x) x = d.bounds.x;
          if (z > d.bounds.z) z = -d.bounds.z;
          else if (z < -d.bounds.z) z = d.bounds.z;
          pos.setXYZ(i, x, y, z);
        }
        pos.needsUpdate = true;
      }

      // gentle camera sway
      camera.position.x = Math.sin(elapsed * 0.4) * 0.14;
      camera.lookAt(lookTargetV);

      renderer.render(scene, camera);
    };

    /* ------------------------------ imperative pour ------------------------------ */
    const tweenMs = (ms: number, onU: (p: number, tMs: number) => void) =>
      new Promise<void>((resolve) => {
        const t0 = performance.now();
        const step = () => {
          const tMs = performance.now() - t0;
          const p = clamp01(tMs / ms);
          onU(p, tMs);
          if (p < 1) requestAnimationFrame(step);
          else resolve();
        };
        requestAnimationFrame(step);
      });

    pourImplRef.current = async (from, to, count, color) => {
      const nodeF = nodes[from];
      const nodeT = nodes[to];
      if (!nodeF || !nodeT) return;
      pouringRef.current = from;

      const home = new THREE.Vector3(nodeF.baseX, nodeF.baseY, nodeF.baseZ);
      const mouth = new THREE.Vector3(nodeT.baseX, nodeT.baseY + TUBE_H + MOUTH_GAP, nodeT.baseZ);
      const startY = nodeF.group.position.y;
      const startX = nodeF.group.position.x;

      /* lean direction: mostly towards the destination's side, blended towards
       * the camera so the hanging tube floats IN FRONT of the board plane and
       * can never sweep through the other tubes while it descends. */
      const dx = nodeT.baseX - nodeF.baseX;
      let sideX: number;
      if (Math.abs(dx) > 0.12) sideX = dx > 0 ? 1 : -1;
      else sideX = nodeT.baseX >= 0 ? 1 : -1; // vertical pour → lean towards board centre
      let lean = new THREE.Vector3(sideX, 0, CAM_LEAN).normalize();
      /* adaptive final tilt: high destinations (bottom row pouring up into the
       * top row) use a shallower hang so the tube never pokes past the top of
       * the viewport. Low destinations keep the full ~130° hang. */
      const tiltMax = Math.acos(THREE.MathUtils.clamp((mouth.y - fitTopY + 0.5) / TUBE_H, -1, 1));
      const tiltFinal = THREE.MathUtils.clamp(tiltMax, TILT_FLY, TILT_POUR);
      const sinF = Math.sin(tiltFinal);
      const hang = new THREE.Vector3(
        mouth.x - TUBE_H * sinF * lean.x,
        mouth.y - TUBE_H * Math.cos(tiltFinal),
        mouth.z - TUBE_H * sinF * lean.z,
      );
      /* keep the hanging base inside the board width — flip the lean if it sticks out */
      const { rows } = layoutFor(Math.max(nodes.length, 1));
      const halfW = ((Math.max(...rows) - 1) / 2) * SPACING + TUBE_R + 0.55;
      if (Math.abs(hang.x) > halfW) {
        lean = new THREE.Vector3(-sideX, 0, CAM_LEAN).normalize();
        hang.set(mouth.x - TUBE_H * sinF * lean.x, hang.y, mouth.z - TUBE_H * sinF * lean.z);
      }
      const maxTop = Math.max(...nodes.map((nd) => nd.baseY)) + TUBE_H;
      let flyY = maxTop + 0.62;
      if (fitTopY - 0.5 < flyY) flyY = Math.max(maxTop + 0.34, fitTopY - 0.5);

      const tiltAxis = new THREE.Vector3().crossVectors(UP, lean).normalize();
      const srcLen = tubesRef.current[from]?.length ?? nodeF.units.length;
      const dstLen = tubesRef.current[to]?.length ?? 0;

      /* liquid staying behind pools towards the mouth while the tube hangs */
      const remaining = srcLen - count;
      const slideMax = remaining > 0 ? Math.max(0, TUBE_H - 0.82 - bottomY(remaining - 1)) : 0;

      /* ghosts grow in the destination at its exact stack slots */
      const ghosts: THREE.Mesh[] = [];
      for (let k = 0; k < count; k++) {
        const m = new THREE.Mesh(unitGeo, liqMats[color % liqMats.length]);
        m.position.y = bottomY(dstLen + k);
        m.scale.y = 0.01;
        m.visible = false;
        nodeT.liquid.add(m);
        ghosts.push(m);
      }

      /* solid vertical stream from the hanging mouth into the destination */
      const streamGeo = new THREE.CylinderGeometry(0.07, 0.105, 1, 10, 1, true);
      const streamMat = new THREE.MeshPhongMaterial({
        color: LIQUIDS[color % LIQUIDS.length].base,
        transparent: true,
        opacity: 0,
        shininess: 100,
        specular: 0xffffff,
        depthWrite: false,
      });
      const stream = new THREE.Mesh(streamGeo, streamMat);
      stream.visible = false;
      scene.add(stream);

      const surfaceY = (len: number) => (len === 0 ? nodeT.baseY + 0.14 : nodeT.baseY + bottomY(len - 1) + HALF_H + 0.05);

      /* --- 1+2. rise above the board and glide over, swinging up as it
       * climbs so the glass never pokes past the viewport ceiling and the
       * body clears the neighbouring tubes while still low --- */
      const RISE_MS = LIFT_MS + TRANSIT_MS;
      const swingSpan = Math.max(0.6, flyY - 1.9);
      await tweenMs(D(RISE_MS), (p) => {
        const sm = p * p * (3 - 2 * p);
        const xg = Math.pow(sm, 1.5); // horizontal motion lags the rise
        const y = startY + (flyY - startY) * (1 - Math.pow(1 - p, 2));
        nodeF.group.position.set(
          startX + (hang.x - startX) * xg,
          y + Math.sin(Math.PI * sm) * 0.1,
          home.z + (hang.z - home.z) * xg,
        );
        const phi = Math.min(TILT_FLY, TILT_FLY * clamp01((y - 1.4) / swingSpan));
        nodeF.group.quaternion.setFromAxisAngle(tiltAxis, phi);
      });

      /* --- 3. swing down into the hanging pour pose --- */
      await tweenMs(D(TIPIN_MS), (p) => {
        const e = 1 - Math.pow(1 - p, 3);
        nodeF.group.position.set(hang.x, flyY + (hang.y - flyY) * e, hang.z);
        nodeF.group.quaternion.setFromAxisAngle(tiltAxis, TILT_FLY + (tiltFinal - TILT_FLY) * e);
        // the remaining block starts pooling towards the mouth
        const slide = slideMax * e;
        for (let k = 0; k < remaining; k++) {
          const m = nodeF.units[k];
          if (m) m.position.y = bottomY(k) + slide;
        }
      });

      /* --- 4. pour: stream + drain + fill --- */
      const pourDur = count * UNIT_MS + 130;
      const t0 = performance.now();
      stream.visible = true;
      splash(new THREE.Vector3(mouth.x, surfaceY(dstLen), mouth.z), color);

      await tweenMs(D(pourDur), (_p, tMs) => {
        const tt = (t0 + tMs) * 0.001;
        nodeF.group.quaternion.setFromAxisAngle(tiltAxis, tiltFinal + Math.sin(tt * 21) * 0.028);
        nodeF.group.position.set(hang.x, hang.y + Math.sin(tt * 17) * 0.02, hang.z);
        const slide = slideMax;
        // drain the source top-down, bottoms glued to their stack slots
        for (let k = 0; k < count; k++) {
          const sp = clamp01((tMs - k * UNIT_MS) / 95);
          const idx = srcLen - 1 - k;
          const m = nodeF.units[idx];
          if (!m) continue;
          const s = Math.max(0.02, 1 - sp * 0.98);
          m.scale.y = s;
          m.position.y = bottomY(idx) + slide - HALF_H * (1 - s);
          m.visible = s > 0.05;
        }
        for (let k = 0; k < remaining; k++) {
          const m = nodeF.units[k];
          if (!m) continue;
          m.position.y = bottomY(k) + slide;
          m.visible = true;
        }
        // fill ghosts at the destination's exact slots, stream rides the surface
        let fillTop = surfaceY(dstLen);
        for (let k = 0; k < count; k++) {
          const gp = clamp01((tMs - 60 - k * UNIT_MS) / 110);
          const g = ghosts[k];
          g.visible = gp > 0.01;
          g.scale.y = Math.max(0.01, gp);
          g.position.y = bottomY(dstLen + k) - HALF_H * (1 - gp);
          if (gp > 0.01) fillTop = Math.max(fillTop, bottomY(dstLen + k) - HALF_H + 1.88 * HALF_H * gp);
        }
        const fade = Math.min(clamp01(tMs / 70), clamp01((pourDur - tMs) / 90));
        streamMat.opacity = 0.92 * fade;
        const mouthY = mouth.y - 0.04;
        const h = Math.max(0.05, mouthY - fillTop);
        const pulse = 1 + Math.sin(tt * 30) * 0.12;
        stream.position.set(mouth.x, mouthY - h / 2, mouth.z);
        stream.scale.set(pulse, h, pulse);
      });

      /* --- 5. arc back home, staying level-high then righting itself on
       * approach so the mouth-end never pokes past the viewport ceiling --- */
      const ctrl = new THREE.Vector3(
        (hang.x + home.x) / 2,
        Math.max(hang.y, flyY) + 0.4,
        (hang.z + home.z) / 2 + 0.12,
      );
      await tweenMs(D(RETURN_MS), (p) => {
        const sm = p * p * (3 - 2 * p);
        const u = 1 - sm;
        nodeF.group.position.set(
          u * u * hang.x + 2 * u * sm * ctrl.x + sm * sm * home.x,
          u * u * hang.y + 2 * u * sm * ctrl.y + sm * sm * home.y,
          u * u * hang.z + 2 * u * sm * ctrl.z + sm * sm * home.z,
        );
        const level = 1 - Math.pow(sm, 1.8); // stays in pour pose while high
        nodeF.group.quaternion.setFromAxisAngle(tiltAxis, tiltFinal * level);
        // the pooled block glides back onto its slots as the tube levels out
        const slide = slideMax * level;
        for (let k = 0; k < remaining; k++) {
          const m = nodeF.units[k];
          if (!m) continue;
          m.position.y = bottomY(k) + slide;
          m.scale.y = 1;
          m.visible = true;
        }
      });

      /* land exactly on the shelf; drained slivers stay hidden */
      nodeF.group.quaternion.identity();
      nodeF.group.position.copy(home);
      nodeF.units.forEach((m, k) => {
        m.position.y = bottomY(k);
        if (k < remaining) {
          m.scale.y = 1;
          m.visible = true;
        } else {
          m.visible = false;
        }
      });
      ghosts.forEach((m) => m.removeFromParent());
      stream.removeFromParent();
      streamGeo.dispose();
      streamMat.dispose();
      pouringRef.current = null;
      // let the state reconciliation place the real destination units quietly
      quietRef.current.add(to);
    };

    buildBoard(tubesRef.current);
    completeRef.current = tubesRef.current.map(isTubeComplete);
    raf = requestAnimationFrame(tick);

    // dev helper: deterministic taps for automated testing
    if (process.env.NODE_ENV !== "production") {
      (window as unknown as { __cmTap?: (i: number) => void }).__cmTap = (i: number) =>
        propsRef.current.onTap(i);
      (window as unknown as { __cmDebug?: () => unknown }).__cmDebug = () => ({
        aspect: camera.aspect,
        cam: camera.position.toArray().map((v) => Math.round(v * 100) / 100),
        look: fitLook.toArray().map((v) => Math.round(v * 100) / 100),
        fitDist: Math.round(fitDist * 100) / 100,
        n: nodes.length,
        tubes: nodes.map((nd) => [Math.round(nd.group.position.x * 100) / 100, Math.round(nd.group.position.y * 100) / 100]),
        units: nodes.map((nd) => nd.units.length),
        state: tubesRef.current.map((t) => t.join(",")),
      });
    }

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
      canvas.removeEventListener("pointerup", onUp);
      ro.disconnect();
      disposables.forEach((o) => disposeObject(o));
      unitGeo.dispose();
      capGeo.dispose();
      glassGeo.dispose();
      ringGeo.dispose();
      hitGeo.dispose();
      liqMats.forEach((m) => m.dispose());
      capMats.forEach((m) => m.dispose());
      glassMat.dispose();
      rimMat.dispose();
      if (dustRef.current) {
        dustRef.current.points.geometry.dispose();
        dustRef.current.mat.dispose();
        dustRef.current = null;
      }
      scene.clear();
      renderer.dispose();
      canvas.remove();
    };
  }, []);

  /* ----------------------- reactive state → scene ----------------------- */
  useEffect(() => {
    apiRef.current?.syncTubes(tubes);
    completeRef.current = tubes.map(isTubeComplete);
  }, [tubes]);

  useEffect(() => {
    const newly = justCompleted.filter((i) => !prevCompletedRef.current.includes(i));
    newly.forEach((i) => apiRef.current?.burst(i));
    prevCompletedRef.current = justCompleted;
  }, [justCompleted]);

  return <div ref={mountRef} className={className ?? "h-72 w-full"} aria-hidden />;
});
