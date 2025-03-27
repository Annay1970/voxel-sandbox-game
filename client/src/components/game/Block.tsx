import * as THREE from 'three';
import { useTexture } from '@react-three/drei';
import { BlockType, isBlockSolid } from '../../lib/blocks';

interface BlockProps {
  position: [number, number, number];
  type: BlockType;
  texture?: THREE.Texture;
}

export default function Block({ position, type, texture }: BlockProps) {
  // Skip rendering air blocks
  if (type === 'air') return null;
  
  // Minecraft-style texture mapping
  let blockTexture;
  try {
    // Try to load texture based on block type - fallback to custom colors if fails
    blockTexture = texture || useTexture(`/textures/${type}.png`);
  } catch (error) {
    // If texture loading fails, we'll use colors
    blockTexture = null;
  }
  
  // Determine opacity and color based on block type
  let opacity = 1;
  let color = '#ffffff';
  
  switch (type) {
    case 'water':
      opacity = 0.7;
      color = '#3498db';
      break;
    case 'leaves':
      opacity = 0.9;
      color = '#2ecc71';
      break;
    case 'grass':
      color = '#5D9F42'; // Minecraft-like grass color
      break;
    case 'stone':
      color = '#888888'; // Minecraft-like stone
      break;
    case 'sand':
      color = '#E6C88C'; // Minecraft-like sand
      break;
    case 'dirt':
      color = '#8B4513'; // Minecraft-like dirt
      break;
    case 'wood':
      color = '#8B5A2B'; // Minecraft-like planks
      break;
    case 'log':
      color = '#6B4226'; // Minecraft-like log
      break;
    case 'craftingTable':
      color = '#9E6C4B'; // Minecraft-like crafting table
      break;
    case 'torch':
      color = '#FFA500'; // Minecraft-like torch
      break;
  }
  
  // Determine if block needs to be transparent
  const isTransparent = opacity < 1;
  
  // Add a small pixel-style roughness to mimic Minecraft look
  const roughness = 1.0;
  const metalness = 0.0;
  
  // Create a pixel-ish flat material effect
  return (
    <mesh position={position} castShadow receiveShadow>
      <boxGeometry args={[1, 1, 1]} />
      <meshStandardMaterial 
        map={blockTexture} 
        color={color}
        transparent={isTransparent}
        opacity={opacity}
        roughness={roughness}
        metalness={metalness}
        flatShading={true}
      />
    </mesh>
  );
}
