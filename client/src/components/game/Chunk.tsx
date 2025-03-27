import { useMemo } from 'react';
import * as THREE from 'three';
import { useTexture } from '@react-three/drei';
import Block from './Block';
import { BlockType } from '../../lib/blocks';

interface ChunkProps {
  chunkX: number;
  chunkZ: number;
  blocks: Record<string, BlockType>;
}

// Constants for chunk dimensions
export const CHUNK_SIZE = 16;
export const CHUNK_HEIGHT = 128;

export default function Chunk({ chunkX, chunkZ, blocks }: ChunkProps) {
  // Calculate chunk boundaries
  const minX = chunkX * CHUNK_SIZE;
  const minZ = chunkZ * CHUNK_SIZE;
  const maxX = minX + CHUNK_SIZE;
  const maxZ = minZ + CHUNK_SIZE;
  
  // Filter blocks that belong to this chunk
  const chunkBlocks = useMemo(() => {
    const result: [number, number, number, BlockType][] = [];
    
    Object.entries(blocks).forEach(([key, type]) => {
      const [x, y, z] = key.split(',').map(Number);
      
      if (x >= minX && x < maxX && z >= minZ && z < maxZ) {
        result.push([x, y, z, type]);
      }
    });
    
    return result;
  }, [blocks, minX, minZ, maxX, maxZ]);
  
  // Load textures
  const grassTexture = useTexture('/textures/grass.png');
  const sandTexture = useTexture('/textures/sand.jpg');
  const woodTexture = useTexture('/textures/wood.jpg');
  
  // Create a texture map for block types
  const textureMap = useMemo(() => ({
    'grass': grassTexture,
    'dirt': grassTexture,
    'stone': grassTexture,
    'sand': sandTexture,
    'wood': woodTexture,
    'leaves': grassTexture,
    'water': grassTexture,
  }), [grassTexture, sandTexture, woodTexture]);
  
  // Use instanced mesh for better performance with many blocks
  const instances = useMemo(() => {
    const blocksByType: Record<BlockType, THREE.Matrix4[]> = {
      'grass': [],
      'dirt': [],
      'stone': [],
      'sand': [],
      'wood': [],
      'leaves': [],
      'water': [],
    };
    
    // Group blocks by type
    chunkBlocks.forEach(([x, y, z, type]) => {
      // Skip air blocks
      if (type === 'air') return;
      
      const matrix = new THREE.Matrix4().setPosition(x, y, z);
      if (blocksByType[type]) {
        blocksByType[type].push(matrix);
      }
    });
    
    return blocksByType;
  }, [chunkBlocks]);
  
  // For small numbers of blocks, render individually instead of instanced meshes
  const shouldUseIndividualBlocks = Object.values(instances).reduce(
    (sum, matrices) => sum + matrices.length, 
    0
  ) < 20;
  
  if (shouldUseIndividualBlocks) {
    return (
      <group>
        {chunkBlocks.map(([x, y, z, type]) => {
          if (type === 'air') return null;
          return (
            <Block
              key={`${x},${y},${z}`}
              position={[x, y, z]}
              type={type}
              texture={textureMap[type]}
            />
          );
        })}
      </group>
    );
  }
  
  // Render instanced meshes for better performance
  return (
    <group>
      {Object.entries(instances).map(([type, matrices]) => {
        if (matrices.length === 0) return null;
        
        return (
          <instancedMesh
            key={type}
            args={[undefined, undefined, matrices.length]}
            count={matrices.length}
          >
            <boxGeometry args={[1, 1, 1]} />
            <meshStandardMaterial 
              map={textureMap[type as BlockType]} 
              color={type === 'water' ? '#3498db' : '#ffffff'}
              transparent={type === 'water' || type === 'leaves'}
              opacity={type === 'water' ? 0.7 : type === 'leaves' ? 0.8 : 1}
            />
            {matrices.forEach((matrix, i) => {
              instancedMesh.setMatrixAt(i, matrix);
            })}
          </instancedMesh>
        );
      })}
    </group>
  );
}
