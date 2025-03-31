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

// EMERGENCY PERFORMANCE MODE: Significantly simplified chunk rendering
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
  
  // Simplified filtering and instanced rendering - group blocks by type for performance
  const blocksByType = useMemo(() => {
    // Group positions by block type
    const groupedBlocks: Record<string, THREE.Vector3[]> = {};
    
    // Process only visible blocks in this chunk
    Object.entries(blocks).forEach(([key, type]) => {
      // Skip air blocks
      if (type === 'air' || type === 'water') return; // Simplified: skip water too
      
      const [x, y, z] = key.split(',').map(Number);
      
      // Only include blocks in this chunk
      if (x >= minX && x < maxX && z >= minZ && z < maxZ) {
        // Group by type
        if (!groupedBlocks[type]) {
          groupedBlocks[type] = [];
        }
        
        // Store position
        groupedBlocks[type].push(new THREE.Vector3(x, y, z));
      }
    });
    
    return groupedBlocks;
  }, [blocks, minX, minZ, maxX, maxZ]);
  
  // Only render a single type of block for extreme performance mode
  const blockTypeCount = Object.keys(blocksByType).length;
  
  // No visible blocks
  if (blockTypeCount === 0) {
    return null;
  }
  
  // Use color mapping for super simplified block rendering
  const blockColors = {
    'grass': '#55AA55',
    'dirt': '#8B4513',
    'stone': '#888888',
    'wood': '#A0522D',
    'leaves': '#7CAF50',
    'sand': '#FFFF99',
    'water': '#5555FF',
    'snow': '#FFFFFF',
    'coal': '#333333',
    'ice': '#AADDFF',
    'lava': '#FF5500',
    'cactus': '#00AA00'
  };
  
  // Render using instanced meshes for better performance
  return (
    <group>
      {Object.entries(blocksByType).map(([type, positions]) => {
        // Skip if no positions
        if (positions.length === 0) return null;
        
        // Get color - use default if not defined
        const color = blockColors[type as keyof typeof blockColors] || '#FF00FF';
        
        // Use instanced mesh for better performance
        return (
          <instancedMesh 
            key={type}
            args={[undefined, undefined, positions.length]}
            count={positions.length}
          >
            <boxGeometry args={[1, 1, 1]} />
            <meshStandardMaterial color={color} />
            {positions.map((pos, i) => {
              // Create a temporary matrix to set the instance position
              const matrix = new THREE.Matrix4();
              matrix.setPosition(pos.x + 0.5, pos.y + 0.5, pos.z + 0.5);
              return (
                <primitive
                  key={i}
                  object={matrix}
                  attach={`instanceMatrix-${i}`}
                />
              );
            })}
          </instancedMesh>
        );
      })}
    </group>
  );
}
