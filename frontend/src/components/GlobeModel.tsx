"use client";

import React, { useRef, useMemo, Suspense } from "react";
import { Canvas, useFrame, useLoader } from "@react-three/fiber";
import { OrbitControls, Stars, Sphere } from "@react-three/drei";
import * as THREE from "three";

function Earth() {
  const earthRef = useRef<THREE.Group>(null);
  
  // Load high-res clear earth texture showing continents (daylight texture for maximum visibility)
  const colorMap = useLoader(THREE.TextureLoader, 'https://raw.githubusercontent.com/mrdoob/three.js/master/examples/textures/planets/earth_atmos_2048.jpg');

  // Rotate earth slowly
  useFrame(() => {
    if (earthRef.current) {
      earthRef.current.rotation.y += 0.0015;
    }
  });

  return (
    <group ref={earthRef}>
      {/* Core Planet with Continents & Oceans */}
      <Sphere args={[2, 64, 64]}>
        <meshStandardMaterial 
          map={colorMap}
          roughness={0.7} 
          metalness={0.1}
          emissive="#111111"
        />
      </Sphere>

      {/* Explicit Latitudes & Longitudes Grid */}
      <Sphere args={[2.02, 36, 18]}>
        <meshBasicMaterial 
          color="#06b6d4" 
          wireframe 
          transparent 
          opacity={0.35}
          blending={THREE.AdditiveBlending}
        />
      </Sphere>
      
      {/* Atmosphere Glow */}
      <Sphere args={[2.2, 64, 64]}>
        <meshBasicMaterial 
          color="#3b82f6" 
          transparent 
          opacity={0.05} 
          side={THREE.BackSide}
          blending={THREE.AdditiveBlending}
          depthWrite={false}
        />
      </Sphere>

      {/* Node: Chennai */}
      <Node position={[1.4, 0.8, 1.1]} color="#ef4444" label="CHN" />
      
      {/* Node: Singapore */}
      <Node position={[1.7, 0.4, 0.8]} color="#3b82f6" label="SGP" />

      {/* Holographic Connecting Arc */}
      <ConnectingArc start={new THREE.Vector3(1.7, 0.4, 0.8)} end={new THREE.Vector3(1.4, 0.8, 1.1)} />
    </group>
  );
}

function Node({ position, color, label }: { position: [number, number, number], color: string, label: string }) {
  const meshRef = useRef<THREE.Mesh>(null);
  const time = useRef(0);
  
  useFrame((state, delta) => {
    if (meshRef.current) {
      time.current += delta;
      const scale = 1 + Math.sin(time.current * 5) * 0.2;
      meshRef.current.scale.set(scale, scale, scale);
    }
  });

  return (
    <group position={position}>
      {/* Core */}
      <mesh ref={meshRef}>
        <sphereGeometry args={[0.05, 16, 16]} />
        <meshBasicMaterial color={color} />
      </mesh>
      {/* Glow */}
      <mesh>
        <sphereGeometry args={[0.12, 16, 16]} />
        <meshBasicMaterial color={color} transparent opacity={0.3} blending={THREE.AdditiveBlending} depthWrite={false} />
      </mesh>
    </group>
  );
}

function ConnectingArc({ start, end }: { start: THREE.Vector3, end: THREE.Vector3 }) {
  const { geometry, dashMat } = useMemo(() => {
    const points = [];
    const segments = 50;
    
    for (let i = 0; i <= segments; i++) {
      const t = i / segments;
      const p = new THREE.Vector3().lerpVectors(start, end, t);
      // Create a nice parabola arc
      const arcHeight = Math.sin(t * Math.PI) * 0.4;
      p.normalize().multiplyScalar(2.02 + arcHeight); 
      points.push(p);
    }
    
    const curve = new THREE.CatmullRomCurve3(points);
    const tubeGeometry = new THREE.TubeGeometry(curve, 64, 0.015, 8, false);
    
    const dashMat = new THREE.MeshBasicMaterial({
      color: "#06b6d4",
      transparent: true,
      opacity: 0.8,
      blending: THREE.AdditiveBlending
    });
    
    return { geometry: tubeGeometry, dashMat };
  }, [start, end]);
  
  const meshRef = useRef<THREE.Mesh>(null);
  
  return (
    <mesh ref={meshRef} geometry={geometry} material={dashMat} />
  );
}

export default function GlobeModel() {
  return (
    <div className="w-full h-full min-h-[300px] relative rounded-xl overflow-hidden glass-panel bg-black/60 shadow-[0_0_30px_rgba(6,182,212,0.1)] border border-cyan-900/30">
      <div className="absolute inset-x-0 top-4 text-center z-10 pointer-events-none">
        <p className="text-xs font-mono text-teal-400 tracking-widest neon-text-cyan flex items-center justify-center gap-2">
          <span className="w-2 h-2 rounded-full bg-teal-400 animate-pulse hidden sm:inline-block"></span>
          GLOBAL ASSET TRACKING
        </p>
      </div>
      <Canvas camera={{ position: [0, 0, 5], fov: 45 }}>
        <color attach="background" args={['#01030a']} />
        <ambientLight intensity={0.2} />
        <directionalLight position={[5, 3, 5]} intensity={2.5} color="#8b5cf6" />
        <directionalLight position={[-5, -3, -5]} intensity={2} color="#14b8a6" />
        <pointLight position={[0, 0, 0]} intensity={1} color="#06b6d4" distance={5} />
        <Stars radius={100} depth={50} count={5000} factor={4} saturation={1} fade speed={1.5} />
        <Suspense fallback={null}>
           <Earth />
        </Suspense>
        <OrbitControls 
          enableZoom={false} 
          enablePan={false} 
          autoRotate 
          autoRotateSpeed={0.8}
        />
      </Canvas>
    </div>
  );
}
