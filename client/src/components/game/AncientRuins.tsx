import { useRef, useEffect, useState, Suspense } from "react";
import { useFrame } from "@react-three/fiber";
import { useGLTF } from "@react-three/drei";
import * as THREE from "three";
import { GLTF } from "three-stdlib";

interface AncientRuinsProps {
  position: [number, number, number];
  scale?: [number, number, number];
  rotation?: [number, number, number];
}

export default function AncientRuins({ 
  position, 
  scale = [3, 3, 3], 
  rotation = [0, 0, 0] 
}: AncientRuinsProps) {
  // Load the ruins model
  const { scene: ruinsModel } = useGLTF('/models/ancient_ruins.glb') as GLTF & {
    scene: THREE.Group
  };
  
  // Track loading state
  const [modelLoaded, setModelLoaded] = useState(false);
  const modelRef = useRef<THREE.Group>(null);
  
  // Particle system for mystical atmosphere
  const particlesRef = useRef<THREE.Points>(null);
  const particleCount = 100;
  const particlePositions = useRef<Float32Array>(new Float32Array(particleCount * 3));
  
  // Update loading state
  useEffect(() => {
    if (ruinsModel) {
      setModelLoaded(true);
      console.log("Ancient Ruins model loaded successfully");
      
      // Add some ambient glow to the ruins
      ruinsModel.traverse((child) => {
        if (child instanceof THREE.Mesh) {
          // Make some parts of the ruins slightly glowing
          if (Math.random() > 0.7) {
            child.material = new THREE.MeshStandardMaterial({
              color: new THREE.Color(0x88aaff),
              emissive: new THREE.Color(0x225588),
              emissiveIntensity: 0.3,
              roughness: 0.5,
              metalness: 0.7
            });
          }
        }
      });
    }
    
    // Initialize particle system
    for (let i = 0; i < particleCount; i++) {
      const i3 = i * 3;
      // Randomize particle positions around the structure
      particlePositions.current[i3] = (Math.random() * 10 - 5);
      particlePositions.current[i3 + 1] = (Math.random() * 8);
      particlePositions.current[i3 + 2] = (Math.random() * 10 - 5);
    }
  }, [ruinsModel]);
  
  // Preload the model
  useGLTF.preload('/models/ancient_ruins.glb');
  
  // Animate mystical particles
  useFrame(({ clock }) => {
    if (particlesRef.current) {
      const positions = particlesRef.current.geometry.attributes.position.array as Float32Array;
      
      for (let i = 0; i < particleCount; i++) {
        const i3 = i * 3;
        
        // Add gentle flowing motion to particles
        positions[i3 + 1] += Math.sin(clock.getElapsedTime() * 0.5 + i * 0.1) * 0.01;
        
        // Reset particles that fall too low
        if (positions[i3 + 1] < 0) {
          positions[i3 + 1] = 8;
        } else if (positions[i3 + 1] > 8) {
          positions[i3 + 1] = 0;
        }
      }
      
      particlesRef.current.geometry.attributes.position.needsUpdate = true;
    }
    
    // Add very subtle movement to the ruins to make them feel magical
    if (modelRef.current && modelLoaded) {
      // Very slow, subtle oscillation
      modelRef.current.rotation.y = rotation[1] + Math.sin(clock.getElapsedTime() * 0.05) * 0.01;
    }
  });
  
  return (
    <group 
      position={position}
      rotation={[rotation[0], rotation[1], rotation[2]]}
      scale={scale}
      ref={modelRef}
    >
      {/* Ancient Ruins model */}
      {modelLoaded && ruinsModel ? (
        <Suspense fallback={
          <mesh castShadow>
            <boxGeometry args={[3, 2, 3]} />
            <meshStandardMaterial color="#6b6b6b" />
          </mesh>
        }>
          <primitive 
            object={ruinsModel.clone()} 
            castShadow 
            receiveShadow
          />
        </Suspense>
      ) : (
        <mesh castShadow>
          <boxGeometry args={[3, 2, 3]} />
          <meshStandardMaterial color="#6b6b6b" />
        </mesh>
      )}
      
      {/* Mystical particle effects */}
      <points ref={particlesRef}>
        <bufferGeometry>
          <bufferAttribute
            attach="attributes-position"
            count={particleCount}
            array={particlePositions.current}
            itemSize={3}
          />
        </bufferGeometry>
        <pointsMaterial
          size={0.2}
          color="#88aaff"
          transparent
          opacity={0.6}
          blending={THREE.AdditiveBlending}
        />
      </points>
      
      {/* Add a soft point light to illuminate the ruins */}
      <pointLight
        position={[0, 3, 0]}
        intensity={0.8}
        distance={10}
        color="#6688ff"
      />
    </group>
  );
}