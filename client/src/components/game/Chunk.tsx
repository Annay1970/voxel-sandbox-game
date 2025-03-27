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
  const textureMap = useMemo(() => {
    const baseMap: Partial<Record<BlockType, THREE.Texture>> = {
      'grass': grassTexture,
      'dirt': grassTexture,
      'stone': grassTexture,
      'sand': sandTexture,
      'wood': woodTexture,
      'leaves': grassTexture,
      'water': grassTexture,
      'log': woodTexture,
      'stick': woodTexture,
      'craftingTable': woodTexture,
      'woodenPickaxe': woodTexture, 
      'stonePickaxe': grassTexture,
      'woodenAxe': woodTexture,
      'woodenShovel': woodTexture,
      'coal': grassTexture,
      'torch': woodTexture,
      'air': grassTexture, // Fallback but not actually used
    };
    return baseMap as Record<BlockType, THREE.Texture>;
  }, [grassTexture, sandTexture, woodTexture]);
  
  // Use instanced mesh for better performance with many blocks
  const instances = useMemo(() => {
    // Create an initial record with all block types as empty arrays
    const blocksByType: Partial<Record<BlockType, THREE.Matrix4[]>> = {
      'air': [],
      'grass': [],
      'dirt': [],
      'stone': [],
      'sand': [],
      'wood': [],
      'leaves': [],
      'water': [],
      'log': [],
      'stick': [],
      'craftingTable': [],
      'woodenPickaxe': [],
      'stonePickaxe': [],
      'woodenAxe': [],
      'woodenShovel': [],
      'coal': [],
      'torch': [],
    };
    
    // Group blocks by type
    chunkBlocks.forEach(([x, y, z, type]) => {
      // Skip air blocks
      if (type === 'air') return;
      
      const matrix = new THREE.Matrix4().setPosition(x, y, z);
      if (blocksByType[type]) {
        blocksByType[type]!.push(matrix);
      }
    });
    
    return blocksByType as Record<BlockType, THREE.Matrix4[]>;
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
  
  // For now, let's just use individual blocks instead of instanced meshes
  // since we're having an issue with the instanced mesh implementation
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
