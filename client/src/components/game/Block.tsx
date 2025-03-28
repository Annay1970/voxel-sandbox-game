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
  
  // Determine opacity and color based on block type - using bright, distinct colors
  let opacity = 1;
  let color = '#ff00ff'; // Default bright magenta to easily spot problems
  
  switch (type) {
    case 'water':
      opacity = 0.7;
      color = '#0088ff'; // Brighter blue for water
      break;
    case 'leaves':
      opacity = 0.9;
      color = '#00ff00'; // Bright green for leaves
      break;
    case 'grass':
      color = '#44ff44'; // Bright green for grass
      break;
    case 'stone':
      color = '#aaaaaa'; // Lighter gray for stone
      break;
    case 'sand':
      color = '#ffff00'; // Yellow for sand
      break;
    case 'dirt':
      color = '#aa5522'; // Brown for dirt
      break;
    case 'wood':
      color = '#cc8844'; // Light brown for planks
      break;
    case 'log':
      color = '#885522'; // Dark brown for log
      break;
    case 'craftingTable':
      color = '#cc9966'; // Light brown for crafting table
      break;
    case 'torch':
      color = '#ffaa00'; // Orange for torch
      break;
  }
  
  // Determine if block needs to be transparent
  const isTransparent = opacity < 1;
  
  // Create a simpler material for better performance and compatibility
  return (
    <mesh position={position} castShadow receiveShadow>
      <boxGeometry args={[1, 1, 1]} />
      <meshLambertMaterial 
        color={color}
        transparent={isTransparent}
        opacity={opacity}
        emissive={type === 'torch' ? '#ffcc00' : '#000000'}
        emissiveIntensity={type === 'torch' ? 0.5 : 0}
      />
    </mesh>
  );
}
