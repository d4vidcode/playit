"use client";

import { useEffect, useRef, useState } from "react";
import * as THREE from "three";

export default function MonedaPage() {
  const containerRef = useRef<HTMLDivElement>(null);
  const [flipping, setFlipping] = useState(false);

  useEffect(() => {
    if (!containerRef.current) return;
    const scene = new THREE.Scene();
    const camera = new THREE.PerspectiveCamera(45, 1, 0.1, 1000);
    const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
    renderer.setSize(300, 300);
    renderer.setClearColor(0x000000, 0);
    containerRef.current.appendChild(renderer.domElement);

    const light1 = new THREE.DirectionalLight(0xffffff, 1.5);
    light1.position.set(5, 5, 5);
    scene.add(light1);
    const light2 = new THREE.AmbientLight(0xffffff, 0.4);
    scene.add(light2);

    const group = new THREE.Group();
    scene.add(group);

    const cylinder = new THREE.CylinderGeometry(1.5, 1.5, 0.15, 64);
    const canvas1 = document.createElement('canvas');
    canvas1.width = 512; canvas1.height = 512;
    const ctx1 = canvas1.getContext('2d')!;
    ctx1.fillStyle = '#ffd700';
    ctx1.beginPath(); ctx1.arc(256,256,256,0,Math.PI*2); ctx1.fill();
    ctx1.fillStyle = '#1a0e00';
    ctx1.font = 'bold 200px Arial';
    ctx1.textAlign = 'center';
    ctx1.fillText('€', 256, 320);
    const mat1 = new THREE.MeshStandardMaterial({ map: new THREE.CanvasTexture(canvas1), metalness: 0.8, roughness: 0.2 });

    const canvas2 = document.createElement('canvas');
    canvas2.width = 512; canvas2.height = 512;
    const ctx2 = canvas2.getContext('2d')!;
    ctx2.fillStyle = '#c0c0c0';
    ctx2.beginPath(); ctx2.arc(256,256,256,0,Math.PI*2); ctx2.fill();
    ctx2.fillStyle = '#1a1a1a';
    ctx2.font = 'bold 120px Arial';
    ctx2.textAlign = 'center';
    ctx2.fillText('CRUZ', 256, 290);
    const mat2 = new THREE.MeshStandardMaterial({ map: new THREE.CanvasTexture(canvas2), metalness: 0.8, roughness: 0.2 });

    const coin = new THREE.Mesh(cylinder, [new THREE.MeshStandardMaterial({color:0x8b7355}), mat1, mat2]);
    coin.rotation.x = Math.PI / 2;
    group.add(coin);

    camera.position.z = 4.5;

    let animId: number;
    const animate = () => {
      animId = requestAnimationFrame(animate);
      if (!flipping) coin.rotation.y += 0.01;
      else coin.rotation.y += 0.5;
      renderer.render(scene, camera);
    };
    animate();

    return () => {
      cancelAnimationFrame(animId);
      if (containerRef.current?.contains(renderer.domElement)) containerRef.current.removeChild(renderer.domElement);
      renderer.dispose();
    };
  }, [flipping]);

  const flip = () => {
    setFlipping(true);
    setTimeout(() => setFlipping(false), 1500);
  };

  return (
    <div style={{ padding: "40px", maxWidth: 600, margin: "0 auto", textAlign: "center" }}>
      <h1 style={{ margin: "0 0 8px", fontSize: 32, fontWeight: 700 }}>Moneda 3D</h1>
      <p style={{ margin: "0 0 40px", color: "var(--muted)" }}>Con Three.js</p>

      <div style={{ background: "var(--panel)", border: "1px solid var(--border)", borderRadius: 16, padding: 40 }}>
        <div ref={containerRef} style={{ display: "flex", justifyContent: "center", marginBottom: 32 }} />
        <button className="btn btn-primary btn-lg" onClick={flip} disabled={flipping}>{flipping ? "Lanzando..." : "Lanzar moneda"}</button>
      </div>
    </div>
  );
}
