import { useRef, useMemo } from 'react';
import * as THREE from 'three';
import { useFrame } from '@react-three/fiber';
import { useTexture } from '@react-three/drei';

interface WatchtowerProps {
  position: [number, number, number];
  scale?: [number, number, number];
}

/**
 * Medieval stone watchtower landmark
 */
export default function Watchtower({ 
  position = [0, 0, 0], 
  scale = [1, 1, 1] 
}: WatchtowerProps) {
  // Reference for animation
  const towerRef = useRef<THREE.Group>(null);
  const flagRef = useRef<THREE.Mesh>(null);
  
  // Load textures
  const stoneTex = useTexture('/textures/stone.png');
  const woodTex = useTexture('/textures/wood.png');
  
  // Configure materials
  const stoneMaterial = useMemo(() => {
    return new THREE.MeshStandardMaterial({ 
      map: stoneTex,
      roughness: 0.8,
      metalness: 0.2
    });
  }, [stoneTex]);
  
  const woodMaterial = useMemo(() => {
    return new THREE.MeshStandardMaterial({ 
      map: woodTex,
      roughness: 0.9,
      metalness: 0.1
    });
  }, [woodTex]);
  
  // Flag material
  const flagMaterial = useMemo(() => {
    return new THREE.MeshStandardMaterial({
      color: new THREE.Color(0xdb4437), // Red flag
      side: THREE.DoubleSide,
      roughness: 0.7
    });
  }, []);

  // Animate the flag waving
  useFrame(({ clock }) => {
    if (flagRef.current) {
      // Wave the flag in the wind
      const vertices = (flagRef.current.geometry as THREE.BufferGeometry).attributes.position;
      const originalPositions = flagRef.current.userData.originalPositions;
      
      for (let i = 0; i < vertices.count; i++) {
        const x = originalPositions[i * 3];
        const y = originalPositions[i * 3 + 1];
        const z = originalPositions[i * 3 + 2];
        
        // Apply wave effect based on x position (distance from pole)
        const waveStrength = (x + 0.5) * 0.2; // Stronger wave at the end of the flag
        const waveFactor = Math.sin(clock.getElapsedTime() * 5 + x * 5) * waveStrength;
        
        vertices.setY(i, y + waveFactor);
        vertices.setZ(i, z + waveFactor * 0.3);
      }
      
      vertices.needsUpdate = true;
    }
  });

  // Create and store original flag vertices for animation
  const createFlagGeometry = () => {
    const geometry = new THREE.PlaneGeometry(1, 0.6, 10, 5);
    const positions = geometry.attributes.position.array.slice(); // Clone original positions
    
    return {
      geometry,
      positions
    };
  };
  
  const { geometry: flagGeometry, positions: flagPositions } = useMemo(createFlagGeometry, []);

  return (
    <group position={position} scale={scale} ref={towerRef}>
      {/* Base of the tower */}
      <mesh receiveShadow castShadow position={[0, 1, 0]} material={stoneMaterial}>
        <cylinderGeometry args={[2.2, 2.5, 2, 8]} />
      </mesh>
      
      {/* Main tower body */}
      <mesh receiveShadow castShadow position={[0, 5, 0]} material={stoneMaterial}>
        <cylinderGeometry args={[2, 2.2, 8, 8]} />
      </mesh>
      
      {/* Top of tower with battlements */}
      <mesh receiveShadow castShadow position={[0, 9.5, 0]} material={stoneMaterial}>
        <cylinderGeometry args={[2.5, 2, 1, 8]} />
      </mesh>
      
      {/* Generate battlements (merlons) */}
      {Array.from({ length: 8 }).map((_, i) => {
        const angle = (i / 8) * Math.PI * 2;
        const radius = 2.3;
        const x = Math.sin(angle) * radius;
        const z = Math.cos(angle) * radius;
        
        return (
          <mesh 
            key={`merlon-${i}`} 
            receiveShadow 
            castShadow 
            position={[x, 10.5, z]} 
            material={stoneMaterial}
          >
            <boxGeometry args={[0.5, 0.8, 0.5]} />
          </mesh>
        );
      })}
      
      {/* Window openings */}
      {Array.from({ length: 4 }).map((_, i) => {
        const height = 3 + i * 2;
        const angle = (i / 4) * Math.PI * 2;
        const radius = 2.01; // Slightly outside the wall
        const x = Math.sin(angle) * radius;
        const z = Math.cos(angle) * radius;
        
        return (
          <mesh 
            key={`window-${i}`} 
            position={[x, height, z]} 
            rotation={[0, Math.PI - angle, 0]}
          >
            <planeGeometry args={[0.6, 1]} />
            <meshBasicMaterial color="black" />
          </mesh>
        );
      })}
      
      {/* Wooden door at the base */}
      <mesh 
        receiveShadow 
        castShadow 
        position={[0, 1, 2.01]} 
        rotation={[0, 0, 0]} 
        material={woodMaterial}
      >
        <planeGeometry args={[1.2, 1.8]} />
      </mesh>
      
      {/* Flagpole */}
      <mesh 
        receiveShadow 
        castShadow 
        position={[0, 11.5, 0]} 
        rotation={[0, 0, 0]} 
        material={woodMaterial}
      >
        <cylinderGeometry args={[0.05, 0.05, 2, 6]} />
      </mesh>
      
      {/* Flag */}
      <mesh 
        ref={flagRef} 
        position={[0.5, 11.5, 0]} 
        rotation={[0, Math.PI / 2, 0]} 
        material={flagMaterial}
        geometry={flagGeometry}
        userData={{ originalPositions: flagPositions }}
      />
      
      {/* Stone staircase spiraling up */}
      {Array.from({ length: 8 }).map((_, i) => {
        const height = 0.5 + i * 1;
        const angle = (i / 8) * Math.PI * 4; // 2 full rotations
        const radius = 1.5; // Inside the tower
        const x = Math.sin(angle) * radius;
        const z = Math.cos(angle) * radius;
        
        return (
          <mesh 
            key={`stair-${i}`} 
            receiveShadow 
            castShadow 
            position={[x, height, z]} 
            rotation={[0, angle + Math.PI/2, 0]} 
            material={stoneMaterial}
          >
            <boxGeometry args={[0.8, 0.2, 1.5]} />
          </mesh>
        );
      })}
    </group>
  );
}