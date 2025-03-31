import { useMemo } from 'react';
import * as THREE from 'three';
import { BlockType } from '../../lib/blocks';

interface ChunkProps {
  chunkX: number;
  chunkZ: number;
  blocks: Record<string, BlockType>;
}

// Constants for chunk dimensions
export const CHUNK_SIZE = 16;
export const CHUNK_HEIGHT = 128;

// SUPER-EMERGENCY PERFORMANCE MODE: Most basic rendering possible
export default function Chunk({ chunkX, chunkZ, blocks }: ChunkProps) {
  // Calculate chunk boundaries
  const minX = chunkX * CHUNK_SIZE;
  const minZ = chunkZ * CHUNK_SIZE;
  const maxX = minX + CHUNK_SIZE;
  const maxZ = minZ + CHUNK_SIZE;
  
  // Emergency distance-based culling - only render chunks close to origin
  const chunkDistance = Math.sqrt(chunkX * chunkX + chunkZ * chunkZ);
  if (chunkDistance > 2) { // Only render chunks very close to the player
    return null;
  }
  
  // Get all blocks in this chunk
  const chunkBlocks = useMemo(() => {
    // Filter blocks in this chunk - SKIP instancedMesh and just render regular meshes
    const result: { position: [number, number, number], type: BlockType }[] = [];
    
    Object.entries(blocks).forEach(([key, type]) => {
      // Skip air and water blocks
      if (type === 'air' || type === 'water') return;
      
      const [x, y, z] = key.split(',').map(Number);
      
      // Only include blocks in this chunk
      if (x >= minX && x < maxX && z >= minZ && z < maxZ) {
        // Simple position and type
        result.push({
          position: [x, y, z],
          type
        });
      }
    });
    
    // Allow more blocks now that we've verified it works
    return result.slice(0, 200); // Render up to 200 blocks per chunk
  }, [blocks, minX, minZ, maxX, maxZ]);
  
  // No visible blocks
  if (chunkBlocks.length === 0) {
    return null;
  }
  
  // Use color mapping for super simplified block rendering
  const blockColors: Record<string, string> = {
    'grass': '#55AA55',
    'dirt': '#8B4513',
    'stone': '#888888',
    'wood': '#A0522D',
    'leaves': '#7CAF50',
    'sand': '#FFFF99'
  };
  
  // Render using extremely simple individual meshes
  return (
    <group>
      {chunkBlocks.map(({ position, type }, index) => {
        // Get color - use default if not defined
        const color = blockColors[type] || '#FF00FF';
        
        // Render as individual mesh
        return (
          <mesh 
            key={`${index}-${position.join(',')}`}
            position={[position[0] + 0.5, position[1] + 0.5, position[2] + 0.5]}
          >
            <boxGeometry args={[1, 1, 1]} />
            <meshStandardMaterial color={color} />
          </mesh>
        );
      })}
    </group>
  );
}
