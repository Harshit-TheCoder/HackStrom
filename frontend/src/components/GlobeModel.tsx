"use client";

import React, { useRef, useMemo, Suspense } from "react";
import { Canvas, useFrame, useLoader } from "@react-three/fiber";
import { OrbitControls, Stars, Sphere } from "@react-three/drei";
import * as THREE from "three";

function latLongToVector3(lat: number, lon: number, radius: number): THREE.Vector3 {
  const phi = (90 - lat) * (Math.PI / 180);
  const theta = (lon + 180) * (Math.PI / 180);

  const x = -(radius * Math.sin(phi) * Math.cos(theta));
  const z = (radius * Math.sin(phi) * Math.sin(theta));
  const y = (radius * Math.cos(phi));

  return new THREE.Vector3(x, y, z);
}

const PRESET_LOCATIONS: Record<string, [number, number]> = {
    "Singapore": [1.3521, 103.8198],
    "Mumbai": [19.0760, 72.8777],
    "Mumbai Port": [18.9400, 72.8300],
    "Approaching Chennai Port": [13.0827, 80.2707],
    "Chennai": [13.0827, 80.2707],
    "UAE Port": [25.2769, 55.2962],
    "Gujarat Port": [22.7300, 69.7300],
    "Vishakapatnam Port": [17.6800, 83.2100],
    "Shanghai": [31.2304, 121.4737],
    "Rotterdam": [51.9244, 4.4777],
    "New York": [40.7128, -74.0060],
    "Arabian Sea": [15.0, 65.0],
    "Bay of Bengal": [15.0, 88.0],
    "Malacca Strait": [4.0, 100.0],
    "Red Sea": [20.0, 38.0],
    "Mediterranean": [35.0, 18.0],
    "Suez Canal": [29.97, 32.55],
    "Panama Canal": [9.08, -79.68],
    "Global Hub": [0, 0],
    "Crisis Zone": [10, 10]
};

function Earth({ state }: { state?: any }) {
  const earthRef = useRef<THREE.Group>(null);
  const colorMap = useLoader(THREE.TextureLoader, 'https://raw.githubusercontent.com/mrdoob/three.js/master/examples/textures/planets/earth_atmos_2048.jpg');

  useFrame(() => {
    if (earthRef.current) {
      earthRef.current.rotation.y += 0.0015;
    }
  });

  const originName = state?.shipment?.origin || "Singapore";
  const destName = state?.shipment?.destination || "Mumbai";
  const currName = state?.shipment?.current_location || "Approaching Chennai Port";

  const [originLat, originLon] = PRESET_LOCATIONS[originName] || PRESET_LOCATIONS["Singapore"];
  const [destLat, destLon] = PRESET_LOCATIONS[destName] || PRESET_LOCATIONS["Mumbai"];
  
  let currentCoord = PRESET_LOCATIONS[currName] || PRESET_LOCATIONS["Chennai"];
  if (state?.weather_data?.coord) {
       currentCoord = [state.weather_data.coord.lat, state.weather_data.coord.lon];
  }

  const vOrigin = latLongToVector3(originLat, originLon, 2.0);
  const vDest = latLongToVector3(destLat, destLon, 2.0);
  const vCurr = latLongToVector3(currentCoord[0], currentCoord[1], 2.0);

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

      {/* Dynamic Nodes */}
      <Node position={[vDest.x, vDest.y, vDest.z]} color="#d946ef" label="DEST" />
      <Node position={[vOrigin.x, vOrigin.y, vOrigin.z]} color="#3b82f6" label="ORIG" />
      <Node position={[vCurr.x, vCurr.y, vCurr.z]} color="#14b8a6" label="CURR" />

      {/* 1. Original Baseline Route (Muted Blue Arc) */}
      <ConnectingArc 
        start={vOrigin} 
        end={vDest} 
        color="#3b82f6" 
        opacity={0.3} 
        arcHeight={0.3} 
      />

      {/* 2. Suggested Reroute (Vibrant Teal Segments) */}
      {state?.decision_result?.alternative_route?.length > 0 && (
        (() => {
          const altNodes = state.decision_result.alternative_route;
          const segments = [];
          let prevVec = vCurr;
          
          altNodes.forEach((nodeName: string, i: number) => {
            const coord = PRESET_LOCATIONS[nodeName] || [0, 0];
            const nextVec = latLongToVector3(coord[0], coord[1], 2.0);
            segments.push(
              <ConnectingArc 
                key={`alt-${i}`}
                start={prevVec} 
                end={nextVec} 
                color="#14b8a6" 
                opacity={0.9} 
                arcHeight={0.5} 
                thickness={0.02}
              />
            );
            prevVec = nextVec;
          });
          return segments;
        })()
      )}
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

function ConnectingArc({ 
  start, 
  end, 
  color = "#06b6d4", 
  opacity = 0.8, 
  arcHeight = 0.4,
  thickness = 0.015
}: { 
  start: THREE.Vector3, 
  end: THREE.Vector3, 
  color?: string,
  opacity?: number,
  arcHeight?: number,
  thickness?: number
}) {
  const { geometry, dashMat } = useMemo(() => {
    const points = [];
    const segments = 50;
    
    for (let i = 0; i <= segments; i++) {
      const t = i / segments;
      const p = new THREE.Vector3().lerpVectors(start, end, t);
      // Create a nice parabola arc
      const lift = Math.sin(t * Math.PI) * arcHeight;
      p.normalize().multiplyScalar(2.02 + lift); 
      points.push(p);
    }
    
    const curve = new THREE.CatmullRomCurve3(points);
    const tubeGeometry = new THREE.TubeGeometry(curve, 64, thickness, 8, false);
    
    const dashMat = new THREE.MeshBasicMaterial({
      color: color,
      transparent: true,
      opacity: opacity,
      blending: THREE.AdditiveBlending
    });
    
    return { geometry: tubeGeometry, dashMat };
  }, [start, end, color, opacity, arcHeight, thickness]);
  
  const meshRef = useRef<THREE.Mesh>(null);
  
  return (
    <mesh ref={meshRef} geometry={geometry} material={dashMat} />
  );
}

export default function GlobeModel({ state }: { state?: any }) {
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
           <Earth state={state} />
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
