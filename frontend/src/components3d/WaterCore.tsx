import { useRef, useMemo } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';

const WaterCore = () => {
  const sphereRef = useRef<THREE.Mesh>(null);
  const ringRef = useRef<THREE.Mesh>(null);
  const particlesRef = useRef<THREE.Points>(null);

  // Generate orbital particles around the water core
  const particlesCount = 240;
  const positions = useMemo(() => {
    const pos = new Float32Array(particlesCount * 3);
    for (let i = 0; i < particlesCount; i++) {
      const radius = 2.4 + Math.random() * 1.8;
      const theta = Math.random() * 2 * Math.PI;
      const phi = Math.acos(Math.random() * 2 - 1);

      pos[i * 3] = radius * Math.sin(phi) * Math.cos(theta);
      pos[i * 3 + 1] = radius * Math.sin(phi) * Math.sin(theta);
      pos[i * 3 + 2] = radius * Math.cos(phi);
    }
    return pos;
  }, [particlesCount]);

  useFrame((state) => {
    const time = state.clock.getElapsedTime();
    if (sphereRef.current) {
      sphereRef.current.rotation.y = time * 0.15;
      sphereRef.current.rotation.x = Math.sin(time * 0.2) * 0.1;
    }
    if (ringRef.current) {
      ringRef.current.rotation.z = time * 0.25;
      ringRef.current.rotation.x = Math.PI / 3 + Math.sin(time * 0.15) * 0.1;
    }
    if (particlesRef.current) {
      particlesRef.current.rotation.y = time * 0.08;
    }
  });

  return (
    <group>
      <ambientLight intensity={0.6} />
      <directionalLight position={[10, 10, 8]} intensity={1.8} color="#38bdf8" />
      <pointLight position={[-10, -10, -5]} intensity={1.2} color="#06b6d4" />
      <pointLight position={[0, 5, -5]} intensity={0.8} color="#22d3ee" />

      {/* Central Water Sphere (Standard Three.js material for max reliability) */}
      <mesh ref={sphereRef}>
        <sphereGeometry args={[2, 48, 48]} />
        <meshPhysicalMaterial
          color="#0284c7"
          roughness={0.12}
          metalness={0.1}
          transmission={0.85}
          ior={1.333} // Water index of refraction
          transparent={true}
          opacity={0.88}
          wireframe={false}
        />
      </mesh>

      {/* Holographic scanning ring */}
      <mesh ref={ringRef}>
        <ringGeometry args={[2.8, 2.88, 64]} />
        <meshBasicMaterial color="#22d3ee" side={THREE.DoubleSide} transparent opacity={0.4} />
      </mesh>

      {/* Ambient Water Particles */}
      <points ref={particlesRef}>
        <bufferGeometry>
          <bufferAttribute
            attach="attributes-position"
            args={[positions, 3]}
          />
        </bufferGeometry>
        <pointsMaterial size={0.06} color="#38bdf8" transparent opacity={0.7} sizeAttenuation />
      </points>
    </group>
  );
};

export default WaterCore;
