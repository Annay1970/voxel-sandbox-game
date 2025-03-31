import React, { useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';
import { BlockType, isBlockTransparent } from '../../lib/blocks';

interface BlockProps {
  position: [number, number, number];
  type: BlockType;
  neighbors?: {
    front?: BlockType;
    back?: BlockType;
    left?: BlockType;
    right?: BlockType;
    top?: BlockType;
    bottom?: BlockType;
  };
  onClick?: (e: THREE.Intersection) => void;
  onRightClick?: (e: THREE.Intersection) => void;
  selected?: boolean;
}

// Block colors
const blockColors: Record<BlockType, string> = {
  'air': 'transparent',
  'grass': '#5db85d',
  'dirt': '#8B4513',
  'stone': '#818181',
  'sand': '#f2d398',
  'wood': '#966F33',
  'leaves': '#228B22',
  'water': '#1e90ff',
  'log': '#6d4c41',
  'stick': '#a1887f',
  'craftingTable': '#6d4c41',
  'woodenPickaxe': '#a1887f',
  'stonePickaxe': '#757575',
  'woodenAxe': '#a1887f',
  'woodenShovel': '#a1887f',
  'coal': '#2d2d2d',
  'torch': '#ffd54f',
  'ice': '#add8e6',
  'lava': '#ff4500',
  'snow': '#f5f5f5',
  'cactus': '#2e7d32',
  'glass': '#e0f7fa'
};

// Function to get color with transparency
const getBlockColor = (type: BlockType): THREE.Color | null => {
  if (type === 'air') return null;
  return new THREE.Color(blockColors[type] || '#ffffff');
};

// Function to determine opacity
const getBlockOpacity = (type: BlockType): number => {
  if (type === 'air') return 0;
  if (type === 'glass' || type === 'water' || type === 'ice') return 0.7;
  return 1;
};

export default function Block({ 
  position, 
  type,
  neighbors,
  onClick,
  onRightClick,
  selected = false
}: BlockProps) {
  // Reference to the mesh
  const meshRef = useRef<THREE.Mesh>(null);
  
  // Highlight the block when selected
  useFrame(() => {
    if (meshRef.current && selected) {
      const time = Date.now() * 0.001;
      const hue = (Math.sin(time) * 0.1) + 0.5;
      // Make sure we're dealing with a MeshStandardMaterial
      if (meshRef.current.material instanceof THREE.MeshStandardMaterial) {
        meshRef.current.material.emissive = new THREE.Color(hue, hue, hue);
      }
    } else if (meshRef.current && meshRef.current.material instanceof THREE.MeshStandardMaterial) {
      meshRef.current.material.emissive = new THREE.Color(0, 0, 0);
    }
  });
  
  // Skip rendering air blocks
  if (type === 'air') return null;
  
  // Get color for this block type
  const color = getBlockColor(type);
  if (!color) return null;
  
  // Get opacity
  const opacity = getBlockOpacity(type);
  const transparent = opacity < 1 || isBlockTransparent(type);
  
  // Special cases for different block types
  const renderWater = type === 'water';
  const renderFire = type === 'lava';
  
  return (
    <mesh 
      ref={meshRef}
      position={position}
      castShadow
      receiveShadow
      onClick={onClick}
      onContextMenu={onRightClick}
    >
      <boxGeometry args={[1, 1, 1]} />
      <meshStandardMaterial 
        color={color} 
        transparent={transparent}
        opacity={opacity}
        // Special material properties for different block types
        emissive={renderFire ? new THREE.Color('#ff2000') : undefined}
        emissiveIntensity={renderFire ? 0.5 : 0}
        metalness={type === 'stone' || type === 'stonePickaxe' ? 0.1 : 0}
        roughness={type === 'ice' || type === 'glass' ? 0.1 : 0.8}
        wireframe={false}
      />
      
      {/* Additional elements for special block types */}
      {renderWater && (
        <mesh position={[0, -0.4, 0]} scale={[0.99, 0.2, 0.99]}>
          <boxGeometry />
          <meshStandardMaterial
            color="#1e90ff"
            transparent={true}
            opacity={0.7}
          />
        </mesh>
      )}
    </mesh>
  );
}