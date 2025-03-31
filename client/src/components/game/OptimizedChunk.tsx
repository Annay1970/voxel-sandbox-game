import { useMemo, useRef, useEffect } from 'react';
import * as THREE from 'three';
import { useFrame } from '@react-three/fiber';
import { BlockType, isBlockTransparent, isBlockLiquid } from '../../lib/blocks';
import { useVoxelGame } from '../../lib/stores/useVoxelGame';
import { useTexture, Instance, Instances } from '@react-three/drei';
import { ChunkData } from '../../lib/services/ChunkManager';

interface OptimizedChunkProps {
  chunkData: ChunkData;
  playerChunkX: number;
  playerChunkZ: number;
}

/**
 * LOD levels for different chunk distances
 */
type LODLevel = 'high' | 'medium' | 'low';

/**
 * Material cache to prevent recreation
 */
const materialCache = new Map<string, THREE.Material>();

/**
 * OptimizedChunk with instanced rendering and LOD
 */
export default function OptimizedChunk({ 
  chunkData, 
  playerChunkX, 
  playerChunkZ 
}: OptimizedChunkProps) {
  // References for instance matrices update
  const chunkRef = useRef<THREE.Group>(null);
  
  // Calculate chunk distance from player
  const chunkDistanceX = Math.abs(chunkData.x - playerChunkX);
  const chunkDistanceZ = Math.abs(chunkData.z - playerChunkZ);
  const chunkDistance = Math.sqrt(
    chunkDistanceX * chunkDistanceX + chunkDistanceZ * chunkDistanceZ
  );
  
  // Determine LOD level based on distance
  const HIGH_DETAIL_DISTANCE = 2; // Chunks to render in high detail
  const MED_DETAIL_DISTANCE = 3; // Chunks to render in medium detail
  
  const lodLevel: LODLevel = chunkDistance <= HIGH_DETAIL_DISTANCE ? 'high' : 
                            chunkDistance <= MED_DETAIL_DISTANCE ? 'medium' : 'low';
  
  // Load common block textures
  const textures = useTexture({
    dirt: '/textures/dirt.png',
    grass: '/textures/grass.png',
    stone: '/textures/stone.png',
    sand: '/textures/sand.png',
    water: '/textures/water.png',
    log: '/textures/log.png',
    leaves: '/textures/leaves.png',
    glass: '/textures/glass.png'
  });
  
  // Process blocks in this chunk with optimized data structures
  const {
    opaqueBlocks,
    transparentBlocks,
    typeGroups
  } = useMemo(() => {
    // Keep track of all block types for instancing by type
    const typeGroups: Record<string, { x: number, y: number, z: number }[]> = {};
    
    // Results divided by category for optimization
    const opaqueBlocks: { x: number, y: number, z: number, type: BlockType }[] = [];
    const transparentBlocks: { x: number, y: number, z: number, type: BlockType }[] = [];
    
    // First pass - collect blocks by visibility categories
    Object.entries(chunkData.blocks).forEach(([key, type]) => {
      // Skip air blocks entirely
      if (type === 'air') return;
      
      const [x, y, z] = key.split(',').map(Number);
      
      // Add to type group for instanced rendering
      if (!typeGroups[type]) {
        typeGroups[type] = [];
      }
      typeGroups[type].push({ x, y, z });
      
      // Categorize block for optimized rendering
      if (isBlockTransparent(type) || isBlockLiquid(type)) {
        transparentBlocks.push({ x, y, z, type });
      } else {
        opaqueBlocks.push({ x, y, z, type });
      }
    });
    
    return { 
      opaqueBlocks, 
      transparentBlocks,
      typeGroups
    };
  }, [chunkData.blocks]);
  
  // Create materials based on textures - reuse cached materials when possible
  const getMaterial = (type: BlockType, isTransparent: boolean): THREE.Material => {
    const cacheKey = `${type}-${isTransparent ? 'transparent' : 'opaque'}`;
    
    if (materialCache.has(cacheKey)) {
      return materialCache.get(cacheKey)!;
    }
    
    // Get texture based on block type
    const textureKey = type as keyof typeof textures;
    const texture = textures[textureKey] || textures.stone;
    
    // Configure texture
    if (texture) {
      texture.wrapS = texture.wrapT = THREE.RepeatWrapping;
      texture.magFilter = THREE.NearestFilter;
      texture.minFilter = THREE.LinearMipmapLinearFilter;
    }
    
    // Create material based on block properties
    let material: THREE.Material;
    
    if (isTransparent) {
      material = new THREE.MeshStandardMaterial({
        map: texture,
        transparent: true,
        opacity: type === 'water' ? 0.6 : 0.8,
        side: THREE.DoubleSide,
      });
    } else {
      material = new THREE.MeshStandardMaterial({
        map: texture,
        roughness: 0.8,
      });
    }
    
    // Cache material
    materialCache.set(cacheKey, material);
    return material;
  };
  
  // Log rendering stats in development
  useEffect(() => {
    if (process.env.NODE_ENV === 'development') {
      console.log(
        `Chunk [${chunkData.x},${chunkData.z}] - ${Object.keys(chunkData.blocks).length} blocks, ` +
        `LOD: ${lodLevel}, Distance: ${chunkDistance.toFixed(1)}`
      );
    }
  }, [chunkData, lodLevel, chunkDistance]);
  
  // For extremely distant chunks (low LOD), use a simplified representation
  if (lodLevel === 'low') {
    return renderLowLODChunk();
  }
  
  // Render low detail chunks as a simplified mesh
  function renderLowLODChunk() {
    // Combine all opaque blocks into a single simplified mesh
    // We don't need individual blocks at this distance
    
    // Find the highest point in the chunk for a simple representation
    const highestPoints = new Map<string, number>();
    
    Object.entries(chunkData.blocks).forEach(([key, type]) => {
      if (type === 'air' || isBlockTransparent(type)) return;
      
      const [x, y, z] = key.split(',').map(Number);
      const columnKey = `${x},${z}`;
      
      const currentHighest = highestPoints.get(columnKey) || -Infinity;
      if (y > currentHighest) {
        highestPoints.set(columnKey, y);
      }
    });
    
    // Create a simple terrain mesh based on highest points
    return (
      <group>
        <mesh castShadow receiveShadow>
          <boxGeometry args={[16, 1, 16]} />
          <meshStandardMaterial color="#5d8a68" />
        </mesh>
      </group>
    );
  }
  
  // Only render block types that actually exist in this chunk
  const visibleBlockTypes = Object.keys(typeGroups).filter(
    type => typeGroups[type].length > 0
  );
  
  // Medium LOD uses instanced rendering with more simplified materials
  if (lodLevel === 'medium') {
    return (
      <group ref={chunkRef}>
        {/* Render opaque blocks by type using instancing */}
        {visibleBlockTypes.filter(type => !isBlockTransparent(type as BlockType)).map(type => (
          <Instances key={`${chunkData.x},${chunkData.z}-${type}`} limit={typeGroups[type].length}>
            <boxGeometry args={[1, 1, 1]} />
            <meshStandardMaterial color={getColorForType(type as BlockType)} />
            
            {typeGroups[type].map((block, i) => (
              <Instance 
                key={i} 
                position={[block.x, block.y, block.z]} 
                scale={[0.95, 0.95, 0.95]} 
              />
            ))}
          </Instances>
        ))}
        
        {/* Transparent blocks still need their own instances */}
        {visibleBlockTypes.filter(type => isBlockTransparent(type as BlockType)).map(type => (
          <Instances 
            key={`${chunkData.x},${chunkData.z}-${type}-transparent`} 
            limit={typeGroups[type].length}
          >
            <boxGeometry args={[1, 1, 1]} />
            <meshStandardMaterial 
              color={getColorForType(type as BlockType)} 
              transparent={true} 
              opacity={0.7} 
            />
            
            {typeGroups[type].map((block, i) => (
              <Instance 
                key={i} 
                position={[block.x, block.y, block.z]} 
              />
            ))}
          </Instances>
        ))}
      </group>
    );
  }
  
  // High LOD uses textured instanced rendering for maximum quality
  return (
    <group ref={chunkRef}>
      {/* Opaque blocks with textures */}
      {visibleBlockTypes.filter(type => !isBlockTransparent(type as BlockType)).map(type => (
        <Instances 
          key={`${chunkData.x},${chunkData.z}-${type}-high`} 
          limit={typeGroups[type].length}
          castShadow
          receiveShadow
        >
          <boxGeometry args={[1, 1, 1]} />
          <meshStandardMaterial>
            <primitive object={getMaterial(type as BlockType, false)} attach="material" />
          </meshStandardMaterial>
          
          {typeGroups[type].map((block, i) => (
            <Instance 
              key={i} 
              position={[block.x, block.y, block.z]} 
              scale={[0.98, 0.98, 0.98]}
            />
          ))}
        </Instances>
      ))}
      
      {/* Transparent blocks with textures */}
      {visibleBlockTypes.filter(type => isBlockTransparent(type as BlockType)).map(type => (
        <Instances 
          key={`${chunkData.x},${chunkData.z}-${type}-high-transparent`} 
          limit={typeGroups[type].length}
          castShadow
        >
          <boxGeometry args={[1, 1, 1]} />
          <meshStandardMaterial>
            <primitive object={getMaterial(type as BlockType, true)} attach="material" />
          </meshStandardMaterial>
          
          {typeGroups[type].map((block, i) => (
            <Instance 
              key={i} 
              position={[block.x, block.y, block.z]} 
            />
          ))}
        </Instances>
      ))}
    </group>
  );
}

// Helper function to get colors for different block types
function getColorForType(type: BlockType): string {
  switch(type) {
    case 'grass': return '#55AA55';
    case 'dirt': return '#8B4513';
    case 'stone': return '#888888';
    case 'sand': return '#EECC77';
    case 'water': return '#3333AA';
    case 'log': return '#8B4513';
    case 'leaves': return '#55AA55';
    case 'ironOre': return '#AAAAAA';
    case 'goldOre': return '#DDCC55';
    case 'diamond': return '#55FFFF';
    case 'coal': return '#333333';
    case 'glass': return '#AADDFF';
    case 'tallGrass': return '#55AA55';
    case 'flower': return '#FFFFFF';
    case 'roseflower': return '#FF5555';
    case 'blueflower': return '#5555FF';
    case 'snow': return '#FFFFFF';
    case 'cactus': return '#55AA55';
    default: return '#AAAAAA';
  }
}