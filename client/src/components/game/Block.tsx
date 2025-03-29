import { useRef, useEffect, useState } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';
import { BlockType, isBlockTransparent } from '../../lib/blocks';
import { useVoxelGame } from '../../lib/stores/useVoxelGame';
import { textureManager } from '../../lib/utils/textureManager';

interface BlockProps {
  position: [number, number, number];
  type: BlockType;
  texture?: THREE.Texture;
}

export default function Block({ position, type, texture }: BlockProps) {
  const meshRef = useRef<THREE.Mesh>(null);
  const [blockTexture, setBlockTexture] = useState<THREE.Texture | null>(null);
  const [color, setColor] = useState<string>('#FFFFFF');
  const selectedBlock = useVoxelGame(state => state.selectedBlock);
  const [isSelected, setIsSelected] = useState(false);
  
  // Block dimensions
  const size = 1;

  // Use effect to load or get texture
  useEffect(() => {
    // Use provided texture if available
    if (texture) {
      setBlockTexture(texture);
      return;
    }
    
    // Otherwise get texture from manager
    const blockTexture = textureManager.getTexture(type);
    if (blockTexture) {
      setBlockTexture(blockTexture);
    }
    
    // Set a fallback color for each block type
    switch (type) {
      case 'grass': setColor('#4CAF50'); break;
      case 'dirt': setColor('#795548'); break;
      case 'stone': setColor('#9E9E9E'); break;
      case 'sand': setColor('#FDD835'); break;
      case 'wood': setColor('#8D6E63'); break;
      case 'leaves': setColor('#81C784'); break;
      case 'water': setColor('#2196F3'); break;
      case 'log': setColor('#5D4037'); break;
      case 'coal': setColor('#263238'); break;
      case 'torch': setColor('#FFB300'); break;
      case 'ice': setColor('#A5D6F6'); break;
      case 'lava': setColor('#FF5722'); break;
      case 'snow': setColor('#FAFAFA'); break;
      case 'cactus': setColor('#2E7D32'); break;
      case 'glass': setColor('#E0F7FA'); break;
      default: setColor('#FFFFFF');
    }
  }, [type, texture]);
  
  // Handle selection highlighting
  useEffect(() => {
    if (!selectedBlock) {
      setIsSelected(false);
      return;
    }
    
    const [sx, sy, sz] = selectedBlock;
    const [px, py, pz] = position;
    setIsSelected(sx === px && sy === py && sz === pz);
  }, [selectedBlock, position]);
  
  // Skip rendering for air blocks
  if (type === 'air') {
    return null;
  }
  
  // Special rendering for water
  if (type === 'water') {
    return (
      <mesh position={position} receiveShadow castShadow>
        <boxGeometry args={[size, size * 0.9, size]} /> {/* Water is slightly shorter */}
        <meshStandardMaterial 
          color="#2196F3" 
          transparent={true}
          opacity={0.7}
          roughness={0.1}
          metalness={0.3}
          map={blockTexture || undefined}
        />
      </mesh>
    );
  }
  
  // Special rendering for torch
  if (type === 'torch') {
    return (
      <group position={position}>
        {/* Torch stick */}
        <mesh position={[0, -0.3, 0]} castShadow>
          <boxGeometry args={[0.1, 0.7, 0.1]} />
          <meshStandardMaterial color="#8D6E63" map={blockTexture || undefined} />
        </mesh>
        
        {/* Torch fire */}
        <mesh position={[0, 0.2, 0]} castShadow>
          <boxGeometry args={[0.2, 0.2, 0.2]} />
          <meshStandardMaterial 
            color="#FFEB3B" 
            emissive="#FF9800"
            emissiveIntensity={1}
          />
          
          {/* Point light for torch */}
          <pointLight
            position={[0, 0, 0]}
            distance={7}
            intensity={1}
            color="#FF9800"
          />
        </mesh>
      </group>
    );
  }
  
  // Special rendering for leaves (transparent)
  if (type === 'leaves') {
    return (
      <mesh position={position} ref={meshRef} receiveShadow castShadow>
        <boxGeometry args={[size, size, size]} />
        <meshStandardMaterial 
          color={color}
          transparent={true}
          opacity={0.9}
          map={blockTexture || undefined}
        />
      </mesh>
    );
  }
  
  // Special rendering for lava
  if (type === 'lava') {
    // Create animated lava effect
    const lavaRef = useRef<THREE.Mesh>(null);
    const bubbleRefs = useRef<THREE.Mesh[]>([]);
    
    // Create bubble positions for animation
    const [bubbles] = useState(() => {
      return Array(5).fill(0).map(() => ({
        x: (Math.random() - 0.5) * 0.7,
        z: (Math.random() - 0.5) * 0.7,
        speed: 0.2 + Math.random() * 0.3,
        delay: Math.random() * 5,
        size: 0.05 + Math.random() * 0.1
      }));
    });
    
    useFrame(({ clock }) => {
      if (lavaRef.current) {
        // Gentle pulsing emission effect
        const emission = 0.8 + Math.sin(clock.getElapsedTime() * 2) * 0.2;
        (lavaRef.current.material as THREE.MeshStandardMaterial).emissiveIntensity = emission;
        
        // Bubbles animation
        bubbleRefs.current.forEach((bubble, i) => {
          if (bubble) {
            const time = clock.getElapsedTime() - bubbles[i].delay;
            // Cycle the animation
            const cycleTime = time % 4;
            // Move bubble up and fade out at top
            const y = (cycleTime * bubbles[i].speed) - 0.4;
            const opacity = y > 0.3 ? 1 - (y - 0.3) * 3 : 1;
            
            bubble.position.y = y;
            (bubble.material as THREE.MeshStandardMaterial).opacity = opacity;
          }
        });
      }
    });
    
    return (
      <group position={position}>
        <mesh ref={lavaRef} receiveShadow castShadow>
          <boxGeometry args={[size, size * 0.9, size]} />
          <meshStandardMaterial
            color="#FF5722"
            emissive="#FFEB3B"
            emissiveIntensity={0.8}
            transparent={true}
            opacity={0.9}
            map={blockTexture || undefined}
          />
        </mesh>
        
        {/* Lava bubbles */}
        {bubbles.map((bubble, i) => (
          <mesh 
            key={`bubble-${i}`}
            position={[bubble.x, -0.3, bubble.z]}
            ref={el => {
              if (el) bubbleRefs.current[i] = el;
            }}
          >
            <sphereGeometry args={[bubble.size, 8, 8]} />
            <meshStandardMaterial
              color="#FFCC80"
              emissive="#FFEB3B"
              emissiveIntensity={1}
              transparent={true}
              opacity={0.8}
            />
          </mesh>
        ))}
        
        {/* Lava light */}
        <pointLight
          position={[0, 0.5, 0]}
          distance={8}
          intensity={0.7}
          color="#FF9800"
        />
      </group>
    );
  }
  
  // Special rendering for ice
  if (type === 'ice') {
    const iceRef = useRef<THREE.Mesh>(null);
    
    useFrame(({ clock }) => {
      if (iceRef.current) {
        // Subtle shimmer effect
        const shimmer = 0.75 + Math.sin(clock.getElapsedTime() * 1.5) * 0.1;
        (iceRef.current.material as THREE.MeshStandardMaterial).opacity = shimmer;
        
        // Slight color variation
        const hue = 0.6 + Math.sin(clock.getElapsedTime() * 0.5) * 0.05;
        (iceRef.current.material as THREE.MeshStandardMaterial).color.setHSL(hue, 0.5, 0.7);
      }
    });
    
    return (
      <group position={position}>
        {/* Base ice block */}
        <mesh ref={iceRef} receiveShadow castShadow>
          <boxGeometry args={[size, size, size]} />
          <meshStandardMaterial
            color="#A5D6F6"
            transparent={true}
            opacity={0.8}
            roughness={0.1}
            metalness={0.2}
            map={blockTexture || undefined}
          />
        </mesh>
        
        {/* Internal "crystalline" structure */}
        <mesh position={[0, 0, 0]}>
          <boxGeometry args={[size * 0.7, size * 0.7, size * 0.7]} />
          <meshStandardMaterial
            color="#E1F5FE"
            transparent={true}
            opacity={0.4}
            roughness={0}
            metalness={0.5}
          />
        </mesh>
      </group>
    );
  }
  
  // Special rendering for glass
  if (type === 'glass') {
    return (
      <mesh position={position} receiveShadow castShadow>
        <boxGeometry args={[size, size, size]} />
        <meshStandardMaterial
          color="#E0F7FA"
          transparent={true}
          opacity={0.3}
          roughness={0.05}
          metalness={0.1}
          map={blockTexture || undefined}
        />
      </mesh>
    );
  }
  
  // Special rendering for snow
  if (type === 'snow') {
    const snowRef = useRef<THREE.Mesh>(null);
    
    // Create snow particles/flakes on the surface
    const [snowflakes] = useState(() => {
      return Array(20).fill(0).map(() => ({
        x: (Math.random() - 0.5) * 0.9,
        y: 0.5 + Math.random() * 0.1, // Slightly above surface
        z: (Math.random() - 0.5) * 0.9,
        size: 0.02 + Math.random() * 0.04,
      }));
    });
    
    return (
      <group position={position}>
        {/* Main snow block - slightly shorter */}
        <mesh ref={snowRef} receiveShadow castShadow>
          <boxGeometry args={[size, size * 0.95, size]} />
          <meshStandardMaterial
            color="#FAFAFA"
            roughness={0.9}
            metalness={0.1}
            map={blockTexture || undefined}
          />
        </mesh>
        
        {/* Snow flakes on top - for visual detail */}
        {snowflakes.map((flake, i) => (
          <mesh 
            key={`flake-${i}`} 
            position={[flake.x, flake.y, flake.z]}
          >
            <sphereGeometry args={[flake.size, 6, 6]} />
            <meshStandardMaterial 
              color="#FFFFFF" 
              transparent={true}
              opacity={0.8}
              roughness={0.3}
            />
          </mesh>
        ))}
      </group>
    );
  }
  
  // Special rendering for cactus
  if (type === 'cactus') {
    return (
      <group position={position}>
        {/* Main cactus body */}
        <mesh position={[0, 0, 0]} castShadow receiveShadow>
          <boxGeometry args={[0.8, size, 0.8]} />
          <meshStandardMaterial 
            color="#2E7D32"
            map={blockTexture || undefined} 
          />
        </mesh>
        
        {/* Cactus spikes */}
        {[0, 90, 180, 270].map((rotation, i) => (
          <mesh 
            key={`spike-${i}`}
            position={[
              Math.sin(rotation * Math.PI / 180) * 0.45,
              0,
              Math.cos(rotation * Math.PI / 180) * 0.45
            ]} 
            castShadow
          >
            <boxGeometry args={[0.1, 0.1, 0.1]} />
            <meshStandardMaterial color="#BDBDBD" />
          </mesh>
        ))}
      </group>
    );
  }
  
  // Regular block rendering
  return (
    <mesh position={position} ref={meshRef} receiveShadow castShadow>
      <boxGeometry args={[size, size, size]} />
      <meshStandardMaterial 
        color={isSelected ? '#FFFFFF' : color} 
        emissive={isSelected ? '#FFEB3B' : undefined}
        emissiveIntensity={isSelected ? 0.5 : 0}
        transparent={isBlockTransparent(type)}
        map={blockTexture || undefined}
      />
    </mesh>
  );
}