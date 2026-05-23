import { useEffect, useRef } from "react";
import * as THREE from "three";
import { SlabSolution } from "../physics/slabModel";

type ThreeScenePanelProps = {
  solution: SlabSolution;
};

const heatColor = (ratio: number) => {
  const t = Math.max(0, Math.min(1, ratio));
  return new THREE.Color().setHSL(0.72 - 0.72 * t, 0.78, 0.34 + 0.18 * t);
};

export function ThreeScenePanel({ solution }: ThreeScenePanelProps) {
  const hostRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    const host = hostRef.current;
    if (!host) return;

    const scene = new THREE.Scene();
    scene.background = new THREE.Color("#fbfcff");

    const camera = new THREE.PerspectiveCamera(34, 1, 0.1, 100);
    camera.position.set(4.4, 2.6, 4.8);
    camera.lookAt(0, 0, 0);

    const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: false });
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    host.appendChild(renderer.domElement);

    scene.add(new THREE.AmbientLight(0xffffff, 1.15));
    const key = new THREE.DirectionalLight(0xffffff, 1.8);
    key.position.set(3, 5, 4);
    scene.add(key);

    const group = new THREE.Group();
    scene.add(group);

    const maxHeat = Math.max(...solution.points.map((point) => point.heat), 1e-30);
    const segments = Math.min(80, solution.points.length - 1);
    const slabLength = 4.6;
    const slabWidth = 1.15;

    for (let i = 0; i < segments; i += 1) {
      const p0 = solution.points[Math.floor((i / segments) * (solution.points.length - 1))];
      const p1 = solution.points[Math.floor(((i + 1) / segments) * (solution.points.length - 1))];
      const x0 = p0.xOverA;
      const x1 = p1.xOverA;
      const centerX = ((x0 + x1) / 2) * (slabLength / 2);
      const thickness = Math.max(0.008, (x1 - x0) * (slabLength / 2));
      const material = new THREE.MeshStandardMaterial({
        color: heatColor(Math.max(p0.heat, p1.heat) / maxHeat),
        roughness: 0.55,
        metalness: 0.12,
      });
      const slice = new THREE.Mesh(new THREE.BoxGeometry(thickness, slabWidth, 0.72), material);
      slice.position.x = centerX;
      group.add(slice);
    }

    const edge = new THREE.LineSegments(
      new THREE.EdgesGeometry(new THREE.BoxGeometry(slabLength, slabWidth, 0.72)),
      new THREE.LineBasicMaterial({ color: "#273244", transparent: true, opacity: 0.52 }),
    );
    group.add(edge);

    const arrowMaterial = new THREE.MeshStandardMaterial({ color: "#172033", roughness: 0.4 });
    const arrowCount = 9;
    const maxJ = Math.max(...solution.points.map((point) => point.jAbs), 1e-30);
    for (let i = 0; i < arrowCount; i += 1) {
      const index = Math.round((i / (arrowCount - 1)) * (solution.points.length - 1));
      const point = solution.points[index];
      const x = point.xOverA * (slabLength / 2);
      const length = 0.32 + 0.88 * (point.jAbs / maxJ);
      const shaft = new THREE.Mesh(new THREE.CylinderGeometry(0.025, 0.025, length, 16), arrowMaterial);
      shaft.rotation.x = Math.PI / 2;
      shaft.position.set(x, 0, 0.55 + length / 2);
      const tip = new THREE.Mesh(new THREE.ConeGeometry(0.07, 0.18, 20), arrowMaterial);
      tip.rotation.x = Math.PI / 2;
      tip.position.set(x, 0, 0.55 + length + 0.09);
      group.add(shaft, tip);
    }

    const leftH = new THREE.ArrowHelper(new THREE.Vector3(0, 1, 0), new THREE.Vector3(-slabLength / 2 - 0.25, -0.65, 0), 1.05, 0x007c89, 0.18, 0.08);
    const rightH = new THREE.ArrowHelper(new THREE.Vector3(0, 1, 0), new THREE.Vector3(slabLength / 2 + 0.25, -0.65, 0), 1.05, 0x007c89, 0.18, 0.08);
    group.add(leftH, rightH);

    const labelCanvas = document.createElement("canvas");
    labelCanvas.width = 512;
    labelCanvas.height = 128;
    const ctx = labelCanvas.getContext("2d");
    if (ctx) {
      ctx.fillStyle = "#172033";
      ctx.font = "28px Segoe UI, Microsoft YaHei, sans-serif";
      ctx.fillText("颜色：热源 q'''", 12, 42);
      ctx.fillText("黑箭头：Jz 方向与相对幅值", 12, 88);
    }
    const texture = new THREE.CanvasTexture(labelCanvas);
    const label = new THREE.Sprite(new THREE.SpriteMaterial({ map: texture, transparent: true }));
    label.scale.set(2.35, 0.58, 1);
    label.position.set(-1.1, -1.05, 1.0);
    group.add(label);

    const resize = () => {
      const rect = host.getBoundingClientRect();
      renderer.setSize(rect.width, rect.height, false);
      camera.aspect = rect.width / Math.max(rect.height, 1);
      camera.updateProjectionMatrix();
    };

    let frame = 0;
    const animate = () => {
      frame = requestAnimationFrame(animate);
      group.rotation.y += 0.0025;
      group.rotation.x = -0.05;
      renderer.render(scene, camera);
    };

    resize();
    const observer = new ResizeObserver(resize);
    observer.observe(host);
    animate();

    return () => {
      cancelAnimationFrame(frame);
      observer.disconnect();
      renderer.dispose();
      host.removeChild(renderer.domElement);
      scene.traverse((object) => {
        const mesh = object as THREE.Mesh;
        if (mesh.geometry) mesh.geometry.dispose();
        const material = mesh.material;
        if (Array.isArray(material)) material.forEach((item) => item.dispose());
        else if (material) material.dispose();
      });
    };
  }, [solution]);

  return (
    <section className="panel three-panel">
      <h2>三维直观展示</h2>
      <p className="panel-subtitle">平板厚度方向按热源着色，电流密度用沿 z 方向的箭头表示。</p>
      <div ref={hostRef} className="three-host" aria-label="三维导体板热源与电流密度示意图" />
    </section>
  );
}
