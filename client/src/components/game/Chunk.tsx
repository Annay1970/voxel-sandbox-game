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
  
  // Add debugging for chunk blocks
  const totalBlocks = chunkBlocks.length;
  const blocksNotAir = chunkBlocks.filter(([,,,type]) => type !== 'air').length;
  
  // Log out helpful info only for the center chunk around world origin for debugging
  if (chunkX === 0 && chunkZ === 0) {
    console.log(`Center chunk (0,0) contains ${blocksNotAir} visible blocks out of ${totalBlocks} total blocks`);
    // Log the first few blocks in the center chunk to see what's actually there
    chunkBlocks.filter(([,,,type]) => type !== 'air').slice(0, 5).forEach(([x, y, z, type]) => {
      console.log(`Block at ${x},${y},${z}: ${type}`);
    });
  }
  
  // If this chunk has no visible blocks, don't render anything
  if (blocksNotAir === 0) {
    return null;
  }
  
  // Use this basic approach with individual blocks that doesn't use textures
  // We're focusing on just getting the blocks to appear first
  return (
    <group>
      {chunkBlocks.map(([x, y, z, type]) => {
        // Skip rendering air blocks
        if (type === 'air') return null;
        
        // Render each block individually
        return (
          <Block
            key={`${x},${y},${z}`}
            position={[x, y, z]}
            type={type}
          />
        );
      })}
    </group>
  );
}
