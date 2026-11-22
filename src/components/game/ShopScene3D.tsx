"use client";

/**
 * ShopScene3D — a cartoon market kiosk rendered in WebGL for the shop
 * header: striped awning, wooden counter, shelves with colorful goods,
 * crates and a big spinning golden coin. Purely decorative.
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

const AWN_COLORS = [0xe2725b, 0xfff6e4];

export function ShopScene3D({ className }: { className?: string }) {
  const mountRef = useRef<HTMLDivElement>(null);

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

    const camera = new THREE.PerspectiveCamera(36, 1, 0.1, 60);
    camera.position.set(0, 2.6, 8.2);
    camera.lookAt(0, 1.35, 0);

    const { hemi, key, fill } = createLightRig(6);
    scene.add(hemi, key, fill);

    const disposables: THREE.Object3D[] = [];
    const track = <T extends THREE.Object3D>(o: T): T => {
      disposables.push(o);
      return o;
    };

    // floor
    const floor = new THREE.Mesh(new THREE.CylinderGeometry(5.2, 5.2, 0.3, 40), toonMat(0xe9d5af, gradient));
    floor.position.y = -0.15;
    floor.receiveShadow = true;
    scene.add(track(floor));

    const stall = new THREE.Group();
    scene.add(track(stall));

    // counter
    const counter = new THREE.Mesh(new THREE.BoxGeometry(5.4, 1.15, 1.7), toonMat(0xc99c6b, gradient));
    counter.position.set(0, 0.62, 0.9);
    counter.castShadow = true;
    stall.add(track(counter));
    const counterTop = new THREE.Mesh(new THREE.BoxGeometry(5.7, 0.16, 1.95), toonMat(0xa97c4b, gradient));
    counterTop.position.set(0, 1.26, 0.9);
    stall.add(track(counterTop));

    // posts
    const postGeo = new THREE.CylinderGeometry(0.09, 0.11, 2.6, 10);
    for (const x of [-2.55, 2.55]) {
      const post = new THREE.Mesh(postGeo, toonMat(0x8a5a33, gradient));
      post.position.set(x, 1.4, 0.4);
      post.castShadow = true;
      stall.add(track(post));
    }

    // striped awning (slight arc of alternating slats)
    const slatGeo = new THREE.BoxGeometry(0.72, 0.1, 1.5);
    const slats: THREE.Mesh[] = [];
    for (let i = 0; i < 8; i++) {
      const slat = new THREE.Mesh(slatGeo, toonMat(AWN_COLORS[i % 2], gradient));
      const x = -2.52 + i * 0.72;
      slat.position.set(x, 2.72 - Math.pow(x / 3.2, 2) * 0.22, 0.42);
      slat.rotation.z = (x / 3.2) * 0.14;
      slat.castShadow = true;
      stall.add(track(slat));
      slats.push(slat);
    }
    const awningBack = new THREE.Mesh(new THREE.BoxGeometry(5.9, 0.12, 1.2), toonMat(0xd9bf98, gradient));
    awningBack.position.set(0, 2.62, -0.35);
    awningBack.rotation.x = -0.35;
    stall.add(track(awningBack));

    // shelves with goods
    const goodsColors = [0xe94f4f, 0xf5d23f, 0x55b85b, 0x3ec5b0, 0x5a8fde, 0xa267d8, 0xf06ea9, 0xf59e42];
    for (const [sy, sz] of [[2.0, -0.28], [1.45, -0.28]] as Array<[number, number]>) {
      const shelf = new THREE.Mesh(new THREE.BoxGeometry(4.4, 0.1, 0.7), toonMat(0x9c6538, gradient));
      shelf.position.set(0, sy, sz);
      stall.add(track(shelf));
      for (let i = 0; i < 6; i++) {
        const kind = i % 3;
        const col = goodsColors[(i + sy) % goodsColors.length];
        let item: THREE.Mesh;
        if (kind === 0) {
          item = new THREE.Mesh(new THREE.CylinderGeometry(0.14, 0.17, 0.34, 12), toonMat(col, gradient));
        } else if (kind === 1) {
          item = new THREE.Mesh(new THREE.BoxGeometry(0.28, 0.3, 0.24), toonMat(col, gradient));
        } else {
          item = new THREE.Mesh(new THREE.SphereGeometry(0.16, 12, 10), toonMat(col, gradient));
        }
        item.position.set(-1.75 + i * 0.7, sy + 0.24, sz);
        item.castShadow = true;
        stall.add(track(item));
      }
    }

    // items on the counter
    const pot = new THREE.Mesh(new THREE.CylinderGeometry(0.3, 0.36, 0.5, 16), toonMat(0x3ec5b0, gradient));
    pot.position.set(-1.7, 1.6, 0.9);
    pot.castShadow = true;
    stall.add(track(pot));
    const vase = new THREE.Mesh(new THREE.SphereGeometry(0.24, 14, 12), toonMat(0xa267d8, gradient));
    vase.position.set(1.55, 1.55, 0.85);
    vase.castShadow = true;
    stall.add(track(vase));

    // crates at the side
    for (const [x, y, r] of [[3.4, 0.35, 0.2], [3.75, 0.9, -0.15]] as Array<[number, number, number]>) {
      const crate = new THREE.Mesh(new THREE.BoxGeometry(0.75, 0.6, 0.75), toonMat(0xb98a55, gradient));
      crate.position.set(x, y, 0.7);
      crate.rotation.y = r;
      crate.castShadow = true;
      stall.add(track(crate));
    }

    // golden coin spinning above the counter
    const coin = new THREE.Group();
    const coinBody = new THREE.Mesh(new THREE.CylinderGeometry(0.52, 0.52, 0.12, 28), toonMat(0xf5b301, gradient));
    coinBody.rotation.x = Math.PI / 2;
    coin.add(track(coinBody));
    const coinFace = new THREE.Mesh(new THREE.CylinderGeometry(0.36, 0.36, 0.14, 24), toonMat(0xffd54f, gradient));
    coinFace.rotation.x = Math.PI / 2;
    coin.add(track(coinFace));
    coin.position.set(0, 3.35, 0.5);
    stall.add(track(coin));

    // little price flags on the counter edge
    for (let i = 0; i < 5; i++) {
      const flag = new THREE.Mesh(new THREE.PlaneGeometry(0.3, 0.2), new THREE.MeshBasicMaterial({ color: goodsColors[(i * 2) % goodsColors.length], side: THREE.DoubleSide }));
      flag.position.set(-1.6 + i * 0.8, 1.5, 1.88);
      stall.add(track(flag));
    }

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

      coin.rotation.y = elapsed * 1.6;
      coin.position.y = 3.35 + Math.sin(elapsed * 1.8) * 0.12;
      slats.forEach((s, i) => {
        s.rotation.x = Math.sin(elapsed * 1.4 + i * 0.4) * 0.05;
      });
      camera.position.x = Math.sin(elapsed * 0.3) * 0.35;
      camera.lookAt(0, 1.35, 0);

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
      ro.disconnect();
      disposables.forEach((o) => disposeObject(o));
      scene.clear();
      renderer.dispose();
      canvas.remove();
    };
  }, []);

  return <div ref={mountRef} className={className} aria-hidden />;
}
