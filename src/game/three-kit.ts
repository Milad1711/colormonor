/**
 * three-kit — small helpers shared by the WebGL scenes (manor, tube board).
 * Keeps the cartoon look consistent: banded toon shading, soft warm lights,
 * and disciplined disposal so screens can mount/unmount freely.
 */

import * as THREE from "three";

/** 4-step luminance ramp for MeshToonMaterial banding. */
export function makeToonGradient(): THREE.DataTexture {
  const data = new Uint8Array([96, 150, 210, 255]);
  const tex = new THREE.DataTexture(data, 4, 1, THREE.RedFormat);
  tex.minFilter = THREE.NearestFilter;
  tex.magFilter = THREE.NearestFilter;
  tex.generateMipmaps = false;
  tex.needsUpdate = true;
  return tex;
}

export function toonMat(color: THREE.ColorRepresentation, gradient: THREE.DataTexture, extra?: Partial<THREE.MeshToonMaterialParameters>): THREE.MeshToonMaterial {
  return new THREE.MeshToonMaterial({ color, gradientMap: gradient, ...extra });
}

/** Recursively dispose geometries + materials (+ their textures). */
export function disposeObject(root: THREE.Object3D): void {
  root.traverse((obj) => {
    const mesh = obj as THREE.Mesh;
    if (mesh.geometry) mesh.geometry.dispose();
    const mat = (mesh as unknown as { material?: THREE.Material | THREE.Material[] }).material;
    if (Array.isArray(mat)) {
      mat.forEach((m) => disposeMaterial(m));
    } else if (mat) {
      disposeMaterial(mat);
    }
  });
}

function disposeMaterial(m: THREE.Material): void {
  const rec = m as unknown as Record<string, unknown>;
  for (const key of ["map", "gradientMap", "alphaMap", "envMap"]) {
    const tex = rec[key] as THREE.Texture | undefined;
    if (tex && typeof tex.dispose === "function") tex.dispose();
  }
  m.dispose();
}

export interface FitOptions {
  /** extra world units above the box top that must stay visible (pour flights) */
  headroom?: number;
  margin?: number;
  /** vertical offset of the look-at point relative to the box center */
  lookBias?: number;
}

export interface FitResult {
  /** the point the camera should keep looking at (for per-frame lookAt) */
  lookAt: THREE.Vector3;
}

/**
 * Position the camera so a box of the given size fits both axes.
 * The camera looks slightly downward (fixed angle) to keep the board readable.
 */
export function fitBoardCamera(
  camera: THREE.PerspectiveCamera,
  width: number,
  height: number,
  depth: number,
  center: THREE.Vector3,
  opts: FitOptions = {},
): FitResult {
  const { headroom = 1.2, margin = 1.1, lookBias = -0.28 } = opts;
  const vFov = (camera.fov * Math.PI) / 180;
  const aspect = Math.max(camera.aspect, 0.35);
  const effH = height + headroom;
  const distV = (effH * margin) / (2 * Math.tan(vFov / 2));
  const distH2 = (width * margin) / (2 * Math.tan(vFov / 2) * aspect);
  const dist = Math.max(distV, distH2) + depth * 0.22;
  camera.position.set(center.x, center.y + effH * 0.42 + 1.1, center.z + dist);
  const look = new THREE.Vector3(center.x, center.y + effH * lookBias, center.z);
  camera.lookAt(look);
  return { lookAt: look };
}

/** Create the renderer with mobile-friendly defaults. Throws if WebGL is unavailable. */
export function createRenderer(canvas: HTMLCanvasElement): THREE.WebGLRenderer {
  const renderer = new THREE.WebGLRenderer({
    canvas,
    alpha: true,
    antialias: true,
    powerPreference: "high-performance",
  });
  renderer.setClearColor(0x000000, 0);
  const dpr = typeof window === "undefined" ? 1 : Math.min(window.devicePixelRatio || 1, 2);
  renderer.setPixelRatio(dpr);
  renderer.shadowMap.enabled = true;
  renderer.shadowMap.type = THREE.PCFSoftShadowMap;
  return renderer;
}

export function hasWebGL(): boolean {
  if (typeof window === "undefined") return false;
  try {
    const canvas = document.createElement("canvas");
    return !!(window.WebGLRenderingContext && (canvas.getContext("webgl2") || canvas.getContext("webgl")));
  } catch {
    return false;
  }
}

/** Standard warm cartoon light rig: hemisphere + key directional with shadows. */
export function createLightRig(shadowBounds = 9): { hemi: THREE.HemisphereLight; key: THREE.DirectionalLight; fill: THREE.DirectionalLight } {
  const hemi = new THREE.HemisphereLight(0xfff2d8, 0x9cc97f, 1.05);
  const key = new THREE.DirectionalLight(0xffe3b0, 2.1);
  key.position.set(-7, 11, 6);
  key.castShadow = true;
  key.shadow.mapSize.set(1024, 1024);
  key.shadow.camera.left = -shadowBounds;
  key.shadow.camera.right = shadowBounds;
  key.shadow.camera.top = shadowBounds;
  key.shadow.camera.bottom = -shadowBounds;
  key.shadow.camera.near = 1;
  key.shadow.camera.far = 40;
  key.shadow.bias = -0.0005;
  const fill = new THREE.DirectionalLight(0xffd9ec, 0.55);
  fill.position.set(8, 5, -7);
  return { hemi, key, fill };
}
