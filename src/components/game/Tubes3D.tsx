"use client";

/**
 * Tubes3D — the water-sort puzzle rendered as a real 3D scene.
 * Glass tubes on a wooden table, banded toon liquids, tap-to-select via
 * raycasting, lift-on-select, a full pour flight (fly out → tilt → unit
 * transfer with droplet arc → fly back), hint/selected glowing rings and
 * gold sparkle bursts when a tube completes.
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
  fitBoardCamera,
  hasWebGL,
  makeToonGradient,
  toonMat,
} from "@/game/three-kit";
import { FLY_BACK, FLY_OUT, UNIT_MS, rowSplit, type TubeBoardApi } from "@/game/board-anim";

/* ----------------------------- world metrics ----------------------------- */
const UNIT_H = 0.52;
const TUBE_R = 0.42;
const TUBE_H = UNIT_H * 4 + 0.45;
const SPACING = 1.14;
const ROW_Z = 0.98;
const UP = new THREE.Vector3(0, 1, 0);

const TILT = 1.92; // rad, mouth towards destination
const clamp01 = (v: number) => Math.min(Math.max(v, 0), 1);

interface TubeNode {
  group: THREE.Group;
  liquid: THREE.Group;
  ring: THREE.Mesh;
  ringMat: THREE.MeshBasicMaterial;
  hit: THREE.Mesh;
  baseX: number;
  baseZ: number;
  units: THREE.Mesh[];
}

interface ScaleFx {
  mesh: THREE.Mesh;
  from: number;
  to: number;
  t0: number;
  dur: number;
}

interface Burst {
  points: THREE.Points;
  mat: THREE.PointsMaterial;
  vels: Float32Array;
  born: number;
  life: number;
}

interface Droplets {
  points: THREE.Points;
  mat: THREE.PointsMaterial;
  src: THREE.Vector3;
  dst: THREE.Vector3;
  born: number;
  dur: number;
  n: number;
}

function bezierArc(a: THREE.Vector3, b: THREE.Vector3, apex: number, t: number, out: THREE.Vector3): THREE.Vector3 {
  const midX = (a.x + b.x) / 2;
  const midY = Math.max(a.y, b.y) + apex;
  const midZ = (a.z + b.z) / 2;
  const u = 1 - t;
  out.set(
    u * u * a.x + 2 * u * t * midX + t * t * b.x,
    u * u * a.y + 2 * u * t * midY + t * t * b.y,
    u * u * a.z + 2 * u * t * midZ + t * t * b.z,
  );
  return out;
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
  const scaleFxRef = useRef<ScaleFx[]>([]);
  const burstsRef = useRef<Burst[]>([]);
  const dropsRef = useRef<Droplets[]>([]);
  const growRef = useRef<{ mesh: THREE.Mesh; p: number }[]>([]);
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
    const glassGeo = new THREE.CylinderGeometry(TUBE_R, TUBE_R * 0.9, TUBE_H, 26, 1, false);
    const baseGeo = new THREE.CylinderGeometry(TUBE_R + 0.18, TUBE_R + 0.26, 0.14, 20);
    const ringGeo = new THREE.TorusGeometry(TUBE_R + 0.17, 0.035, 8, 30);
    const hitGeo = new THREE.CylinderGeometry(TUBE_R + 0.16, TUBE_R + 0.16, TUBE_H + 0.35, 10);
    const liqMats = LIQUIDS.map(
      (c) => new THREE.MeshToonMaterial({ color: new THREE.Color(c.base), gradientMap: gradient, emissive: new THREE.Color(c.dark).multiplyScalar(0.12) }),
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

    function makeUnit(color: number, k: number): THREE.Mesh {
      const m = new THREE.Mesh(unitGeo, liqMats[color % liqMats.length]);
      m.position.y = bottomY(k);
      m.castShadow = true;
      return m;
    }

    /* table */
    const boardRoot = new THREE.Group();
    scene.add(track(boardRoot));

    let tableW = 8;
    let tableD = 3.4;
    const table = new THREE.Mesh(new THREE.BoxGeometry(1, 0.22, 1), toonMat(0xc99c6b, gradient));
    table.position.y = -0.12;
    table.receiveShadow = true;
    boardRoot.add(track(table));
    const tableEdge = new THREE.Mesh(new THREE.BoxGeometry(1, 0.1, 1), toonMat(0xa97c4b, gradient));
    tableEdge.position.y = -0.26;
    tableEdge.receiveShadow = true;
    boardRoot.add(track(tableEdge));

    function buildBoard(state: number[][]) {
      // clear previous tubes
      for (const n of nodes) {
        n.group.removeFromParent();
        disposeObject(n.group);
      }
      nodes.length = 0;
      scaleFxRef.current = [];
      growRef.current = [];

      // portrait screens: split into two depth rows so the board uses the
      // vertical space instead of shrinking into a distant single row
      const aspect = camera.aspect || (el.clientWidth || 1) / (el.clientHeight || 1);
      const twoRows = aspect < 1.0 && state.length >= 4;
      const rows = twoRows
        ? [Math.ceil(state.length / 2), Math.floor(state.length / 2)]
        : rowSplit(state.length);
      const maxCount = Math.max(...rows);
      tableW = (maxCount - 1) * SPACING + TUBE_R * 2 + 1.7;
      tableD = (rows.length - 1) * ROW_Z * 2 + 2.1;
      table.scale.set(tableW, 1, tableD);
      tableEdge.scale.set(tableW + 0.24, 1, tableD + 0.24);

      state.forEach((units, i) => {
        const rowIdx = rows[0] && i < rows[0] ? 0 : 1;
        const countInRow = rows[rowIdx];
        const startInRow = rowIdx === 0 ? 0 : rows[0];
        const k = i - startInRow;
        const x = (k - (countInRow - 1) / 2) * SPACING;
        const z = rowIdx === 0 ? -ROW_Z : ROW_Z;

        const group = new THREE.Group();
        group.position.set(x, 0, z);

        const glass = new THREE.Mesh(glassGeo, glassMat);
        glass.position.y = TUBE_H / 2 + 0.08;
        group.add(glass);

        const rim = new THREE.Mesh(new THREE.TorusGeometry(TUBE_R + 0.02, 0.045, 10, 26), rimMat);
        rim.rotation.x = Math.PI / 2;
        rim.position.y = TUBE_H + 0.08;
        group.add(rim);

        const base = new THREE.Mesh(baseGeo, toonMat(0x9c6538, gradient));
        base.position.y = 0.07;
        base.castShadow = true;
        group.add(base);

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

        const node: TubeNode = { group, liquid, ring, ringMat, hit, baseX: x, baseZ: z, units: [] };
        nodes.push(node);
        boardRoot.add(group);

        // initial units rise with a small stagger
        units.forEach((c, k2) => {
          const m = makeUnit(c, k2);
          m.scale.y = 0.01;
          node.units.push(m);
          node.liquid.add(m);
          growRef.current.push({ mesh: m, p: -k2 * 0.35 });
        });
      });

      // camera fit
      const width = (maxCount - 1) * SPACING + TUBE_R * 2 + 0.8;
      const height = TUBE_H + 1.0;
      const depth = (rows.length - 1) * ROW_Z * 2 + 1.4;
      const fit = fitBoardCamera(camera, width, height, depth, new THREE.Vector3(0, height * 0.42, 0), {
        headroom: 1.35,
        margin: 1.04,
        lookBias: -0.05,
      });
      lookTargetV.copy(fit.lookAt);
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
            growRef.current.push({ mesh: m, p: 0 });
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
      });
      quietRef.current.clear();
    }

    function burst(idx: number) {
      const node = nodes[idx];
      if (!node) return;
      const n = 30;
      const positions = new Float32Array(n * 3);
      const vels = new Float32Array(n * 3);
      const origin = new THREE.Vector3(node.baseX, TUBE_H * 0.62, node.baseZ);
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

    apiRef.current = { buildBoard, syncTubes, burst };

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
    };
    resize();
    const ro = new ResizeObserver(resize);
    ro.observe(el);

    /* ------------------------------ loop ------------------------------ */
    const clock = new THREE.Clock();
    let raf = 0;
    let running = true;
    let elapsed = 0;
    const lookTargetV = new THREE.Vector3(0, 1.2, 0);
    const prevShkRef = { current: null as number | null };

    const tick = () => {
      if (!running) return;
      raf = requestAnimationFrame(tick);
      const dt = Math.min(clock.getDelta(), 0.05);
      elapsed += dt;
      const now = performance.now();
      const { selected: sel, hinted: hin, shakeIdx: shk } = propsRef.current;

      // unit grow pop (easeOutBack)
      growRef.current = growRef.current.filter((g) => {
        g.p += dt * 3.4;
        const p = clamp01(g.p);
        const back = 1 + 2.2 * Math.pow(p - 1, 3) + 1.2 * Math.pow(p - 1, 2);
        g.mesh.scale.y = Math.max(0.01, p < 1 ? back : 1);
        if (g.p >= 1) {
          g.mesh.scale.y = 1;
          return false;
        }
        return true;
      });

      // scale fx (source shrink handled by pour tween, kept generic)
      scaleFxRef.current = scaleFxRef.current.filter((fx) => {
        const p = clamp01((now - fx.t0) / fx.dur);
        fx.mesh.scale.y = fx.from + (fx.to - fx.from) * p;
        return p < 1;
      });

      // per-tube visuals
      nodes.forEach((node, i) => {
        if (pouringRef.current !== i) {
          const targetLift = sel === i ? 0.42 : 0;
          node.group.position.y += (targetLift - node.group.position.y) * Math.min(1, dt * 10);
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

      // droplet arcs
      dropsRef.current = dropsRef.current.filter((d) => {
        const age = now - d.born;
        if (age > d.dur) {
          d.points.removeFromParent();
          d.points.geometry.dispose();
          d.mat.dispose();
          return false;
        }
        const pos = d.points.geometry.attributes.position as THREE.BufferAttribute;
        for (let i = 0; i < d.n; i++) {
          const local = clamp01((age - i * (d.dur / d.n) * 0.5) / (d.dur * 0.55));
          if (local <= 0 || local >= 1) {
            pos.setXYZ(i, d.src.x, -10, d.src.z);
          } else {
            bezierArc(d.src, d.dst, 0.55, local, V3);
            pos.setXYZ(i, V3.x, V3.y, V3.z);
          }
        }
        pos.needsUpdate = true;
        return true;
      });

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
        const basePos = nodeF.group.position.clone();
        const liftY = 1.25;
        const destMouthTop = TUBE_H + 0.72;

        // --- phase A: fly out ---
        await tweenMs(FLY_OUT, (p) => {
          const e = 1 - Math.pow(1 - p, 3);
          nodeF.group.position.x = THREE.MathUtils.lerp(basePos.x, nodeT.baseX, e);
          nodeF.group.position.z = THREE.MathUtils.lerp(basePos.z, nodeT.baseZ, e);
          nodeF.group.position.y = basePos.y + liftY * Math.sin(p * Math.PI * 0.5) + Math.sin(p * Math.PI) * 0.22;
        });

        // --- phase B: tilt + transfer ---
        const dir = new THREE.Vector3(nodeT.baseX - nodeF.baseX, 0, nodeT.baseZ - nodeF.baseZ);
        if (dir.lengthSq() < 1e-6) dir.set(0.01, 0, 0.05);
        const axis = new THREE.Vector3().crossVectors(UP, dir).normalize();
        const pourDur = count * UNIT_MS + 110;
        const srcLen = tubesRef.current[from]?.length ?? nodeF.units.length;
        const dstLen = tubesRef.current[to]?.length ?? 0;

        // ghosts in the destination
        const ghosts: THREE.Mesh[] = [];
        for (let k = 0; k < count; k++) {
          const m = new THREE.Mesh(unitGeo, liqMats[color % liqMats.length]);
          m.position.y = bottomY(dstLen + k);
          m.scale.y = 0.01;
          nodeT.liquid.add(m);
          ghosts.push(m);
        }

        // droplet arc
        const mouthSrc = nodeF.group.localToWorld(new THREE.Vector3(0, TUBE_H, 0));
        const mouthDst = new THREE.Vector3(nodeT.baseX, destMouthTop - 0.35, nodeT.baseZ);
        const dN = 9;
        const dGeo = new THREE.BufferGeometry();
        dGeo.setAttribute("position", new THREE.BufferAttribute(new Float32Array(dN * 3), 3));
        const dMat = new THREE.PointsMaterial({ color: LIQUIDS[color % LIQUIDS.length].base, size: 0.1, transparent: true, opacity: 0.95, depthWrite: false });
        const dPoints = new THREE.Points(dGeo, dMat);
        scene.add(dPoints);
        dropsRef.current.push({ points: dPoints, mat: dMat, src: mouthSrc, dst: mouthDst, born: performance.now(), dur: pourDur + 60, n: dN });

        await tweenMs(pourDur, (_p, tMs) => {
          // tilt in during the first 45% of the pour
          const tiltP = clamp01(tMs / (pourDur * 0.45));
          nodeF.group.quaternion.setFromAxisAngle(axis, TILT * (tiltP * tiltP * (3 - 2 * tiltP)));
          // source units drain sequentially
          for (let k = 0; k < count; k++) {
            const sp = clamp01((tMs - k * UNIT_MS) / 95);
            const m = nodeF.units[srcLen - 1 - k];
            if (m) m.scale.y = Math.max(0.02, 1 - sp * 0.98);
          }
          // destination ghosts fill sequentially
          for (let k = 0; k < count; k++) {
            const gp = clamp01((tMs - 90 - k * UNIT_MS) / 110);
            ghosts[k].scale.y = Math.max(0.01, gp);
          }
        });

        // --- phase C: untilt + fly back ---
        await tweenMs(FLY_BACK, (p) => {
          const e = p * p * (3 - 2 * p);
          nodeF.group.quaternion.setFromAxisAngle(axis, TILT * (1 - e));
          nodeF.group.position.x = THREE.MathUtils.lerp(nodeT.baseX, basePos.x, e);
          nodeF.group.position.z = THREE.MathUtils.lerp(nodeT.baseZ, basePos.z, e);
          nodeF.group.position.y = THREE.MathUtils.lerp(basePos.y + liftY, basePos.y, e);
        });
        nodeF.group.quaternion.identity();
        nodeF.group.position.copy(basePos);

        ghosts.forEach((m) => m.removeFromParent());
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
      glassGeo.dispose();
      baseGeo.dispose();
      ringGeo.dispose();
      hitGeo.dispose();
      liqMats.forEach((m) => m.dispose());
      glassMat.dispose();
      rimMat.dispose();
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

const V3 = new THREE.Vector3();
