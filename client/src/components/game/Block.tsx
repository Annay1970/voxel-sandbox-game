import * as THREE from 'three';
import { useTexture } from '@react-three/drei';
import { BlockType, isBlockSolid } from '../../lib/blocks';
import { useEffect, useState } from 'react';
import { textureManager } from '../../lib/utils/textureManager';

interface BlockProps {
  position: [number, number, number];
  type: BlockType;
  texture?: THREE.Texture;
}

export default function Block({ position, type, texture }: BlockProps) {
  // Skip rendering air blocks
  if (type === 'air') return null;
  
  // State to hold the texture
  const [blockTexture, setBlockTexture] = useState<THREE.Texture | null>(null);
  
  // Determine opacity based on block type
  let opacity = 1;
  let isEmissive = false;
  let emissiveColor = '#000000';
  let emissiveIntensity = 0;
  
  if (type === 'water') {
    opacity = 0.7;
  } else if (type === 'leaves') {
    opacity = 0.9;
  } else if (type === 'torch') {
    isEmissive = true;
    emissiveColor = '#ffcc00';
    emissiveIntensity = 0.5;
  }
  
  // Determine if block needs to be transparent
  const isTransparent = opacity < 1;
  
  // Fallback colors (used if texture loading fails)
  const fallbackColors: Record<BlockType, string> = {
    'water': '#0088ff',
    'leaves': '#00ff00',
    'grass': '#44ff44',
    'stone': '#aaaaaa',
    'sand': '#ffff00',
    'dirt': '#aa5522',
    'wood': '#cc8844',
    'log': '#885522',
    'craftingTable': '#cc9966',
    'torch': '#ffaa00',
    'air': '#ffffff',
    'stick': '#885522',
    'woodenPickaxe': '#885522',
    'stonePickaxe': '#777777',
    'woodenAxe': '#885522',
    'woodenShovel': '#885522',
    'coal': '#333333'
  };
  
  // Load the texture for this block
  useEffect(() => {
    const loadBlockTexture = async () => {
      // Make sure textures are loaded
      await textureManager.loadTextures();
      
      // Get the texture from the manager
      const tex = textureManager.getTexture(type);
      if (tex) {
        setBlockTexture(tex);
      }
    };
    
    loadBlockTexture();
  }, [type]);
  
  // Use texture if available, otherwise use color
  const material = blockTexture ? (
    <meshStandardMaterial
      map={blockTexture}
      transparent={isTransparent}
      opacity={opacity}
      emissive={isEmissive ? emissiveColor : undefined}
      emissiveIntensity={emissiveIntensity}
    />
  ) : (
    <meshLambertMaterial 
      color={fallbackColors[type] || '#ff00ff'}
      transparent={isTransparent}
      opacity={opacity}
      emissive={isEmissive ? emissiveColor : undefined}
      emissiveIntensity={emissiveIntensity}
    />
  );
  
  // Create the block mesh
  return (
    <mesh position={position} castShadow receiveShadow>
      <boxGeometry args={[1, 1, 1]} />
      {material}
    </mesh>
  );
}
