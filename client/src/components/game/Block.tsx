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
  
  // Use provided texture or load based on type
  const blockTexture = texture || useTexture('/textures/grass.png');
  
  // Determine opacity and color based on block type
  let opacity = 1;
  let color = '#ffffff';
  
  switch (type) {
    case 'water':
      opacity = 0.7;
      color = '#3498db';
      break;
    case 'leaves':
      opacity = 0.8;
      color = '#2ecc71';
      break;
    case 'grass':
      color = '#7cac5d';
      break;
    case 'stone':
      color = '#aaaaaa';
      break;
    case 'sand':
      color = '#e5b962';
      break;
    case 'dirt':
      color = '#9b7653';
      break;
    case 'wood':
      color = '#8c6e4b';
      break;
  }
  
  // Determine if block needs to be transparent
  const isTransparent = opacity < 1;
  
  return (
    <mesh position={position} castShadow receiveShadow>
      <boxGeometry args={[1, 1, 1]} />
      <meshStandardMaterial 
        map={blockTexture} 
        color={color}
        transparent={isTransparent}
        opacity={opacity}
      />
    </mesh>
  );
}
