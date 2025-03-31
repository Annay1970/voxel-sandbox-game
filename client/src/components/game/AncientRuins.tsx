import { useRef, useMemo } from 'react';
import * as THREE from 'three';
import { useFrame } from '@react-three/fiber';
import { useTexture } from '@react-three/drei';

interface AncientRuinsProps {
  position: [number, number, number];
  scale?: [number, number, number];
}

/**
 * Ancient Ruins landmark with mystical glowing elements
 */
export default function AncientRuins({ 
  position = [0, 0, 0], 
  scale = [1, 1, 1] 
}: AncientRuinsProps) {
  // References for animation
  const ruinsRef = useRef<THREE.Group>(null);
  const glowRef = useRef<THREE.PointLight>(null);
  
  // Load textures
  const stoneTex = useTexture('/textures/stone.png');
  const mossyTex = useTexture('/textures/mossy_stone.png');
  
  // Configure stone materials
  const stoneMaterial = useMemo(() => {
    return new THREE.MeshStandardMaterial({ 
      map: stoneTex,
      roughness: 0.8,
      metalness: 0.2
    });
  }, [stoneTex]);
  
  const mossyMaterial = useMemo(() => {
    return new THREE.MeshStandardMaterial({ 
      map: mossyTex,
      roughness: 0.9,
      metalness: 0.1
    });
  }, [mossyTex]);
  
  // Glowing rune material
  const glowingRuneMaterial = useMemo(() => {
    return new THREE.MeshStandardMaterial({
      color: new THREE.Color(0x64ffda),
      emissive: new THREE.Color(0x64ffda),
      emissiveIntensity: 0.6,
      roughness: 0.3,
      metalness: 0.8
    });
  }, []);

  // Animate the glow effect and subtle movement
  useFrame(({ clock }) => {
    if (glowRef.current) {
      // Pulsating light intensity
      glowRef.current.intensity = 1.5 + Math.sin(clock.getElapsedTime() * 0.5) * 0.5;
    }
    
    if (ruinsRef.current) {
      // Very subtle swaying effect for mystical feel
      ruinsRef.current.rotation.y = Math.sin(clock.getElapsedTime() * 0.05) * 0.02;
    }
  });

  return (
    <group position={position} scale={scale} ref={ruinsRef}>
      {/* Central stone circle */}
      <mesh receiveShadow castShadow position={[0, 0.5, 0]} rotation={[0, 0, 0]} material={stoneMaterial}>
        <cylinderGeometry args={[5, 5, 1, 16]} />
      </mesh>
      
      {/* Mossy ground beneath */}
      <mesh receiveShadow position={[0, 0.1, 0]} rotation={[0, 0, 0]} material={mossyMaterial}>
        <cylinderGeometry args={[6, 6, 0.2, 16]} />
      </mesh>
      
      {/* Surrounding stone pillars */}
      {Array.from({ length: 7 }).map((_, i) => {
        const angle = (i / 7) * Math.PI * 2;
        const radius = 4.5;
        const x = Math.sin(angle) * radius;
        const z = Math.cos(angle) * radius;
        const height = 2 + Math.sin(i * 1.5) * 1.5; // Varied heights
        const isIntact = i % 3 !== 0; // Some pillars are broken
        
        return (
          <group key={i} position={[x, 0, z]}>
            {/* Pillar */}
            <mesh 
              receiveShadow 
              castShadow 
              position={[0, height / 2, 0]} 
              material={i % 2 === 0 ? stoneMaterial : mossyMaterial}
            >
              <cylinderGeometry args={[0.5, 0.6, height, 8]} />
            </mesh>
            
            {/* Top cap for intact pillars */}
            {isIntact && (
              <mesh 
                receiveShadow 
                castShadow 
                position={[0, height + 0.25, 0]} 
                material={stoneMaterial}
              >
                <cylinderGeometry args={[0.7, 0.5, 0.5, 8]} />
              </mesh>
            )}
            
            {/* Rune engravings (glowing) - only on some pillars */}
            {i % 2 === 0 && (
              <mesh 
                position={[0, height / 2, 0.51]} 
                material={glowingRuneMaterial}
              >
                <planeGeometry args={[0.5, height * 0.7]} />
              </mesh>
            )}
          </group>
        );
      })}
      
      {/* Central altar stone */}
      <mesh receiveShadow castShadow position={[0, 1.5, 0]} material={stoneMaterial}>
        <boxGeometry args={[2, 1, 2]} />
      </mesh>
      
      {/* Mystical glowing artifact */}
      <mesh position={[0, 2.2, 0]} material={glowingRuneMaterial}>
        <dodecahedronGeometry args={[0.5, 0]} />
      </mesh>
      
      {/* Glowing point light */}
      <pointLight 
        ref={glowRef} 
        position={[0, 3, 0]} 
        color="#64ffda" 
        intensity={2} 
        distance={15} 
        decay={2} 
      />
      
      {/* Fallen debris and rubble */}
      {Array.from({ length: 12 }).map((_, i) => {
        const angle = Math.random() * Math.PI * 2;
        const radius = 2 + Math.random() * 3;
        const x = Math.sin(angle) * radius;
        const z = Math.cos(angle) * radius;
        const size = 0.2 + Math.random() * 0.5;
        
        return (
          <mesh 
            key={`debris-${i}`} 
            position={[x, size / 2, z]} 
            rotation={[
              Math.random() * Math.PI,
              Math.random() * Math.PI,
              Math.random() * Math.PI
            ]}
            material={Math.random() > 0.5 ? stoneMaterial : mossyMaterial}
            castShadow
          >
            <boxGeometry args={[size, size, size]} />
          </mesh>
        );
      })}
    </group>
  );
}