import { useMemo, useRef } from 'react';
import * as THREE from 'three';
import { useFrame } from '@react-three/fiber';
import { BlockType, isBlockTransparent, isBlockLiquid } from '../../lib/blocks';
import { useVoxelGame } from '../../lib/stores/useVoxelGame';
import Block from './Block';
import { useTexture } from '@react-three/drei';

interface ChunkProps {
  chunkX: number;
  chunkZ: number;
  blocks: Record<string, BlockType>;
}

// Constants for chunk dimensions
export const CHUNK_SIZE = 16;
export const CHUNK_HEIGHT = 128;

// Global instance cache for geometries and materials
const geometryCache = new Map<string, THREE.BufferGeometry>();
const materialCache = new Map<string, THREE.Material>();

// Optimized Chunk component with instancing and LOD
export default function Chunk({ chunkX, chunkZ, blocks }: ChunkProps) {
  // Get player position from store to determine LOD
  const playerPosition = useVoxelGame(state => state.player.position);
  
  // Calculate chunk boundaries
  const minX = chunkX * CHUNK_SIZE;
  const minZ = chunkZ * CHUNK_SIZE;
  const maxX = minX + CHUNK_SIZE;
  const maxZ = minZ + CHUNK_SIZE;
  
  // References for instance meshes
  const solidMeshRef = useRef<THREE.InstancedMesh>(null);
  const transparentMeshRef = useRef<THREE.InstancedMesh>(null);
  const chunkRef = useRef<THREE.Group>(null);
  
  // Calculate chunk distance from player
  const playerChunkX = Math.floor(playerPosition[0] / CHUNK_SIZE);
  const playerChunkZ = Math.floor(playerPosition[2] / CHUNK_SIZE);
  const chunkDistanceX = Math.abs(chunkX - playerChunkX);
  const chunkDistanceZ = Math.abs(chunkZ - playerChunkZ);
  const chunkDistance = Math.sqrt(chunkDistanceX * chunkDistanceX + chunkDistanceZ * chunkDistanceZ);
  
  // Improved LOD system
  const VIEW_DISTANCE = 5; // Maximum chunks to render
  const HIGH_DETAIL_DISTANCE = 2; // Chunks to render in high detail
  const MED_DETAIL_DISTANCE = 3; // Chunks to render in medium detail
  
  // Don't render chunks outside view distance
  if (chunkDistance > VIEW_DISTANCE) {
    return null;
  }
  
  // Determine LOD level based on distance
  const lodLevel = chunkDistance <= HIGH_DETAIL_DISTANCE ? 'high' : 
                  chunkDistance <= MED_DETAIL_DISTANCE ? 'medium' : 'low';
  
  // Process blocks for this chunk with culling
  const { chunkBlocks, instancedBlocks, transparentBlocks } = useMemo(() => {
    // Results
    const result: { position: [number, number, number], type: BlockType }[] = [];
    const instanced: { position: [number, number, number], type: BlockType }[] = [];
    const transparent: { position: [number, number, number], type: BlockType }[] = [];
    
    // For optimization, pre-calculate which blocks need to be rendered
    const blockMap = new Map<string, BlockType>();
    
    // First pass - collect all blocks in this chunk
    Object.entries(blocks).forEach(([key, type]) => {
      // Skip air blocks entirely
      if (type === 'air') return;
      
      const [x, y, z] = key.split(',').map(Number);
      
      // Only include blocks in this chunk
      if (x >= minX && x < maxX && z >= minZ && z < maxZ) {
        blockMap.set(`${x},${y},${z}`, type);
      }
    });
    
    // Second pass - determine visibility and neighbor status
    blockMap.forEach((type, key) => {
      const [x, y, z] = key.split(',').map(Number);
      
      // Check if block is surrounded by non-transparent blocks
      const isHidden = 
        blockMap.has(`${x+1},${y},${z}`) && !isBlockTransparent(blockMap.get(`${x+1},${y},${z}`)!) &&
        blockMap.has(`${x-1},${y},${z}`) && !isBlockTransparent(blockMap.get(`${x-1},${y},${z}`)!) &&
        blockMap.has(`${x},${y+1},${z}`) && !isBlockTransparent(blockMap.get(`${x},${y+1},${z}`)!) &&
        blockMap.has(`${x},${y-1},${z}`) && !isBlockTransparent(blockMap.get(`${x},${y-1},${z}`)!) &&
        blockMap.has(`${x},${y},${z+1}`) && !isBlockTransparent(blockMap.get(`${x},${y},${z+1}`)!) &&
        blockMap.has(`${x},${y},${z-1}`) && !isBlockTransparent(blockMap.get(`${x},${y},${z-1}`)!);
      
      // Skip blocks that are completely surrounded
      if (isHidden) return;
      
      // Handle transparent and special blocks separately
      if (isBlockTransparent(type) || isBlockLiquid(type) || 
          type === 'torch' || type === 'glowstone' || type === 'lava') {
        transparent.push({
          position: [x, y, z],
          type
        });
      } else {
        // For solid blocks, use instanced rendering
        instanced.push({
          position: [x, y, z],
          type
        });
      }
      
      // For high detail level, add all blocks to individual rendering
      if (lodLevel === 'high') {
        result.push({
          position: [x, y, z],
          type
        });
      }
    });
    
    return { 
      chunkBlocks: result, 
      instancedBlocks: instanced,
      transparentBlocks: transparent
    };
  }, [blocks, minX, minZ, maxX, maxZ, lodLevel]);
  
  // Set up colors for instanced mesh
  const blockColors: Record<string, string> = {
    'grass': '#55AA55',
    'dirt': '#8B4513',
    'stone': '#888888',
    'wood': '#A0522D',
    'leaves': '#7CAF50',
    'sand': '#FFFF99',
    'log': '#8B4513',
    'torch': '#FFDD55',
    'glass': '#FFFFFF',
    'glowstone': '#FFFF77'
  };
  
  // Update instance matrices
  useFrame(() => {
    if (solidMeshRef.current && instancedBlocks.length > 0) {
      const mesh = solidMeshRef.current;
      let idx = 0;
      
      // Only update instances if they might be visible
      instancedBlocks.forEach(({ position, type }) => {
        if (idx >= mesh.count) return;
        
        const matrix = new THREE.Matrix4().setPosition(
          position[0] + 0.5, 
          position[1] + 0.5, 
          position[2] + 0.5
        );
        mesh.setMatrixAt(idx, matrix);
        idx++;
      });
      
      mesh.instanceMatrix.needsUpdate = true;
    }
    
    if (transparentMeshRef.current && transparentBlocks.length > 0) {
      const mesh = transparentMeshRef.current;
      let idx = 0;
      
      transparentBlocks.forEach(({ position, type }) => {
        if (idx >= mesh.count) return;
        
        const matrix = new THREE.Matrix4().setPosition(
          position[0] + 0.5, 
          position[1] + 0.5, 
          position[2] + 0.5
        );
        mesh.setMatrixAt(idx, matrix);
        idx++;
      });
      
      mesh.instanceMatrix.needsUpdate = true;
    }
  });
  
  // Optimization - if no blocks are in this chunk, don't render anything
  if (instancedBlocks.length === 0 && transparentBlocks.length === 0 && chunkBlocks.length === 0) {
    return null;
  }
  
  // Determine if we use high quality rendering based on distance
  const useHighQuality = lodLevel === 'high';
  const useMediumQuality = lodLevel === 'medium';
  
  return (
    <group ref={chunkRef}>
      {/* For nearby chunks, render high-quality individual blocks */}
      {useHighQuality && chunkBlocks.map(({ position, type }, index) => {
        // Skip rendering thousands of blocks
        if (index > 150) return null;
        
        // Special blocks should always be rendered individually
        const isSpecial = type === 'torch' || type === 'glowstone' || 
                          type === 'lava' || isBlockTransparent(type);
        
        // Skip non-special blocks beyond a certain distance
        if (!isSpecial && index > 100) return null;
        
        return (
          <Block
            key={`${index}-${position.join(',')}`}
            position={position}
            type={type}
          />
        );
      })}
      
      {/* For medium distance chunks, use limited individual blocks */}
      {useMediumQuality && transparentBlocks.length > 0 && transparentBlocks.slice(0, 50).map(({ position, type }, index) => (
        <Block
          key={`trans-${index}-${position.join(',')}`}
          position={position}
          type={type}
        />
      ))}
      
      {/* For all chunks, use instanced mesh for solid blocks */}
      {instancedBlocks.length > 0 && (
        <instancedMesh 
          ref={solidMeshRef}
          args={[undefined, undefined, Math.min(instancedBlocks.length, 500)]}
          castShadow
          receiveShadow
        >
          <boxGeometry args={[1, 1, 1]} />
          <meshStandardMaterial 
            color={blockColors['stone']} 
            roughness={0.8}
          />
        </instancedMesh>
      )}
      
      {/* For far chunks, use instanced mesh for transparent blocks */}
      {!useHighQuality && !useMediumQuality && transparentBlocks.length > 0 && (
        <instancedMesh 
          ref={transparentMeshRef}
          args={[undefined, undefined, Math.min(transparentBlocks.length, 100)]}
          castShadow
          transparent
        >
          <boxGeometry args={[1, 1, 1]} />
          <meshStandardMaterial 
            color={blockColors['glass']} 
            roughness={0.2}
            transparent={true}
            opacity={0.7}
          />
        </instancedMesh>
      )}
    </group>
  );
}
