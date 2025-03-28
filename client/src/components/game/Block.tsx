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