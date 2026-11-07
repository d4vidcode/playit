"use client";

import { useEffect, useRef, useState } from "react";
import * as THREE from "three";

function createDiceFace(number: number, size: number) {
  const canvas = document.createElement('canvas');
  canvas.width = 512;
  canvas.height = 512;
  const ctx = canvas.getContext('2d')!;
  ctx.fillStyle = '#ffffff';
  ctx.fillRect(0, 0, 512, 512);
  ctx.fillStyle = '#000000';
  const dotSize = 80;
  
  const positions: Record<number, [number,number][]> = {
    1: [[256,256]],
    2: [[128,128],[384,384]],
    3: [[128,128],[256,256],[384,384]],
    4: [[128,128],[384,128],[128,384],[384,384]],
    5: [[128,128],[384,128],[256,256],[128,384],[384,384]],
    6: [[128,128],[128,256],[128,384],[384,128],[384,256],[384,384]]
  };
  
  positions[number].forEach(([x,y]) => {
    ctx.beginPath();
    ctx.arc(x,y,dotSize/2,0,Math.PI*2);
    ctx.fill();
  });
  
  const texture = new THREE.CanvasTexture(canvas);
  return new THREE.MeshStandardMaterial({ map: texture });
}

export default function DadosPage() {
  const containerRef = useRef<HTMLDivElement>(null);
  const [rolling, setRolling] = useState(false);

  useEffect(() => {
    if (!containerRef.current) return;
    const scene = new THREE.Scene();
    const camera = new THREE.PerspectiveCamera(45, 1, 0.1, 1000);
    const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
    renderer.setSize(350, 350);
    renderer.setClearColor(0x000000, 0);
    containerRef.current.appendChild(renderer.domElement);

    const light1 = new THREE.DirectionalLight(0xffffff, 1.2);
    light1.position.set(10, 10, 10);
    scene.add(light1);
    const light2 = new THREE.AmbientLight(0xffffff, 0.6);
    scene.add(light2);

    const geometry = new THREE.BoxGeometry(2, 2, 2);
    const materials = [
      createDiceFace(1, 2),
      createDiceFace(6, 2),
      createDiceFace(2, 2),
      createDiceFace(5, 2),
      createDiceFace(3, 2),
      createDiceFace(4, 2),
    ];
    const cube = new THREE.Mesh(geometry, materials);
    scene.add(cube);
    camera.position.z = 5;

    let animId: number;
    const animate = () => {
      animId = requestAnimationFrame(animate);
      if (!rolling) {
        cube.rotation.x += 0.008;
        cube.rotation.y += 0.012;
      } else {
        cube.rotation.x += 0.3;
        cube.rotation.y += 0.4;
      }
      renderer.render(scene, camera);
    };
    animate();

    return () => {
      cancelAnimationFrame(animId);
      if (containerRef.current?.contains(renderer.domElement)) {
        containerRef.current.removeChild(renderer.domElement);
      }
      renderer.dispose();
    };
  }, [rolling]);

  const roll = () => {
    setRolling(true);
    setTimeout(() => setRolling(false), 1000);
  };

  return (
    <div style={{ padding: "40px", maxWidth: 900, margin: "0 auto" }}>
      <h1 style={{ margin: "0 0 8px", fontSize: 32, fontWeight: 700 }}>Dados 3D</h1>
      <p style={{ margin: "0 0 40px", color: "var(--muted)" }}>Lanza el dado</p>

      <div style={{ background: "var(--panel)", border: "1px solid var(--border)", borderRadius: 16, padding: 40, textAlign: "center" }}>
        <div ref={containerRef} style={{ display: "flex", justifyContent: "center", marginBottom: 32 }} />
        <button className="btn btn-primary btn-lg" onClick={roll} disabled={rolling}>{rolling ? "Tirando..." : "Tirar dado"}</button>
      </div>
    </div>
  );
}
