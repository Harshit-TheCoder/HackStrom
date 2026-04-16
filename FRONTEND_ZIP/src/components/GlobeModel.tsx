"use client";

import React, { useRef } from "react";
import { Canvas, useFrame } from "@react-three/fiber";
import { OrbitControls, Stars, Sphere } from "@react-three/drei";
import * as THREE from "three";

function Earth() {
  const earthRef = useRef<THREE.Mesh>(null);

  // Rotate earth slowly
  useFrame(() => {
    if (earthRef.current) {
      earthRef.current.rotation.y += 0.001;
    }
  });

  return (
    <group ref={earthRef}>
      {/* Core Planet */}
      <Sphere args={[2, 64, 64]}>
        <meshStandardMaterial 
          color="#0f172a" 
          roughness={0.7} 
          metalness={0.1} 
          emissive="#020617"
        />
      </Sphere>

      {/* Wireframe Outline Effect */}
      <Sphere args={[2.01, 32, 32]}>
        <meshBasicMaterial 
          color="#14b8a6" 
          wireframe 
          transparent 
          opacity={0.15} 
        />
      </Sphere>

      {/* Chennai Node */}
      <mesh position={[1.4, 0.8, 1.1]}>
        <sphereGeometry args={[0.04, 16, 16]} />
        <meshBasicMaterial color="#ef4444" />
      </mesh>
      
      {/* Origin Node (Singapore proxy) */}
      <mesh position={[1.7, 0.4, 0.8]}>
        <sphereGeometry args={[0.03, 16, 16]} />
        <meshBasicMaterial color="#3b82f6" />
      </mesh>

      {/* Connecting Arc - simple curved line representation */}
      <Curve />
    </group>
  );
}

function Curve() {
  const points = [];
  // Calculate points for a curve between origin and destination
  const v1 = new THREE.Vector3(1.7, 0.4, 0.8);
  const v2 = new THREE.Vector3(1.4, 0.8, 1.1);
  
  for (let i = 0; i <= 20; i++) {
    const t = i / 20;
    const p = new THREE.Vector3().lerpVectors(v1, v2, t);
    p.normalize().multiplyScalar(2.05 + Math.sin(t * Math.PI) * 0.1); 
    points.push(p);
  }
  
  const curveGeometry = new THREE.BufferGeometry().setFromPoints(points);
  
  return (
    <line geometry={curveGeometry}>
      <lineBasicMaterial color="#06b6d4" transparent opacity={0.6} />
    </line>
  );
}

export default function GlobeModel() {
  return (
    <div className="w-full h-full min-h-[300px] relative rounded-xl overflow-hidden glass-panel bg-black/40">
      <div className="absolute inset-x-0 top-4 text-center z-10 pointer-events-none">
        <p className="text-xs font-mono text-teal-400 tracking-widest neon-text-cyan">LIVE TELEMETRY</p>
      </div>
      <Canvas camera={{ position: [0, 0, 5], fov: 45 }}>
        <ambientLight intensity={0.5} />
        <directionalLight position={[5, 3, 5]} intensity={2} color="#8b5cf6" />
        <directionalLight position={[-5, -3, -5]} intensity={1.5} color="#14b8a6" />
        <Stars radius={100} depth={50} count={3000} factor={4} saturation={0} fade speed={1} />
        <Earth />
        <OrbitControls 
          enableZoom={false} 
          enablePan={false} 
          autoRotate 
          autoRotateSpeed={0.5}
        />
      </Canvas>
    </div>
  );
}
