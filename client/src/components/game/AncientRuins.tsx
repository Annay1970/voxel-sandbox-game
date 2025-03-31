import React, { useRef, useEffect, useState, useMemo, Suspense } from "react";
import { useFrame } from "@react-three/fiber";
import { useGLTF } from "@react-three/drei";
import * as THREE from "three";
import { GLTF } from "three-stdlib";

interface AncientRuinsProps {
  position: [number, number, number];
  scale?: [number, number, number];
  rotation?: [number, number, number];
}

// Preload the model
useGLTF.preload('/models/ancient_ruins.glb');

export default function AncientRuins({ 
  position, 
  scale = [1, 1, 1], 
  rotation = [0, 0, 0]
}: AncientRuinsProps) {
  // References
  const ruinsRef = useRef<THREE.Group>(null);
  const particlesRef = useRef<THREE.Points>(null);
  
  // Load the 3D model
  const { scene: ruinsModel } = useGLTF('/models/ancient_ruins.glb') as GLTF & {
    scene: THREE.Group
  };
  
  // Model loading state
  const [modelLoaded, setModelLoaded] = useState(false);
  
  // Track when model is loaded
  useEffect(() => {
    if (ruinsModel) {
      setModelLoaded(true);
      console.log("Ancient Ruins model loaded successfully");
      
      // Find glowing elements in the model and make them emit light
      ruinsModel.traverse((child) => {
        if (child instanceof THREE.Mesh) {
          // Check if this is a glowing part by name or material properties
          const isGlowing = 
            child.name.toLowerCase().includes('glow') || 
            child.name.toLowerCase().includes('rune') ||
            (child.material instanceof THREE.MeshStandardMaterial && 
            child.material.emissive && 
            child.material.emissiveIntensity > 0);
          
          if (isGlowing) {
            // Make the material emit light
            if (child.material instanceof THREE.MeshStandardMaterial) {
              child.material.emissive = new THREE.Color(0x00ffff);
              child.material.emissiveIntensity = 2;
              child.material.needsUpdate = true;
            }
          }
          
          // Cast and receive shadows for all meshes
          child.castShadow = true;
          child.receiveShadow = true;
        }
      });
    }
  }, [ruinsModel]);
  
  // Particle system for mystical effects
  const particleCount = 300;
  const particlePositions = useMemo(() => {
    const positions = new Float32Array(particleCount * 3);
    const radius = 5;
    
    for (let i = 0; i < particleCount; i++) {
      const i3 = i * 3;
      // Distribute particles in a sphere around the ruins
      const theta = Math.random() * Math.PI * 2;
      const phi = Math.acos(2 * Math.random() - 1);
      const r = radius * Math.cbrt(Math.random()); // Cube root for more uniform distribution
      
      positions[i3] = r * Math.sin(phi) * Math.cos(theta);
      positions[i3 + 1] = r * Math.sin(phi) * Math.sin(theta) + 2; // Lift particles a bit
      positions[i3 + 2] = r * Math.cos(phi);
    }
    
    return positions;
  }, []);
  
  // Particle system animation
  useFrame((state, delta) => {
    if (particlesRef.current) {
      // Rotate particle system slowly
      particlesRef.current.rotation.y += delta * 0.1;
      
      // Update particle positions for ethereal movement
      const positions = particlesRef.current.geometry.attributes.position.array as Float32Array;
      
      for (let i = 0; i < particleCount; i++) {
        const i3 = i * 3;
        
        // Apply simplex noise or other pattern for interesting movement
        const time = state.clock.elapsedTime;
        positions[i3 + 1] += Math.sin(time * 0.5 + i * 0.1) * 0.01;
        
        // Keep particles within bounds
        if (positions[i3 + 1] > 6) positions[i3 + 1] = 0;
        if (positions[i3 + 1] < 0) positions[i3 + 1] = 6;
      }
      
      particlesRef.current.geometry.attributes.position.needsUpdate = true;
    }
    
    // Pulsate the glowing elements
    if (ruinsRef.current && modelLoaded) {
      ruinsRef.current.traverse((child) => {
        if (child instanceof THREE.Mesh && 
            child.material instanceof THREE.MeshStandardMaterial && 
            child.material.emissiveIntensity > 0) {
          
          // Subtle pulsating effect
          const intensity = 1.5 + Math.sin(state.clock.elapsedTime * 2) * 0.5;
          child.material.emissiveIntensity = intensity;
          child.material.needsUpdate = true;
        }
      });
    }
  });
  
  return (
    <group 
      position={position} 
      rotation={[rotation[0], rotation[1], rotation[2]]}
      scale={scale}
    >
      {/* The ruins structure */}
      <group ref={ruinsRef}>
        {modelLoaded && ruinsModel ? (
          <Suspense fallback={
            <mesh>
              <boxGeometry args={[2, 1, 2]} />
              <meshStandardMaterial color="#777777" />
            </mesh>
          }>
            <primitive 
              object={ruinsModel.clone()} 
              castShadow 
              receiveShadow 
            />
          </Suspense>
        ) : (
          // Fallback if model isn't loaded yet
          <mesh>
            <boxGeometry args={[2, 1, 2]} />
            <meshStandardMaterial color="#777777" />
          </mesh>
        )}
      </group>
      
      {/* Particle effects */}
      <points ref={particlesRef}>
        <bufferGeometry>
          <bufferAttribute 
            attach="attributes-position" 
            count={particleCount} 
            array={particlePositions} 
            itemSize={3} 
          />
        </bufferGeometry>
        <pointsMaterial 
          size={0.1} 
          color="#00ffff" 
          transparent 
          opacity={0.6}
          blending={THREE.AdditiveBlending}
          sizeAttenuation
        />
      </points>
      
      {/* Add subtle point light to illuminate the area */}
      <pointLight 
        position={[0, 3, 0]} 
        color="#00ffff" 
        intensity={0.8} 
        distance={15}
        castShadow
      />
    </group>
  );
}