import { SimplexNoise } from './utils/noise';
import { BlockType } from './blocks';
import { CHUNK_SIZE } from '../components/game/Chunk';

// Generate initial terrain for the world
export function generateTerrain() {
  console.log("Generating terrain with ultra-lite settings...");
  
  try {
    // Create noise generators with seeds for reproducibility 
    const seed1 = Math.random();
    const seed2 = Math.random();
    console.log(`Using terrain seeds: ${seed1.toFixed(4)}, ${seed2.toFixed(4)}`);
    
    const simplex = new SimplexNoise(seed1);
    const simplex2 = new SimplexNoise(seed2);
  
    // ULTRA-LITE terrain parameters for guaranteed performance
    const WORLD_SIZE = 4; // Extremely small world size (4 chunks = 64x64 blocks total)
    const WATER_LEVEL = 8;
    const MOUNTAIN_HEIGHT = 30; // Smaller mountains 
    const BASE_HEIGHT = 15;
    
    // Data structures to store generated world
    const chunks: Record<string, { x: number, z: number }> = {};
    const blocks: Record<string, BlockType> = {};
    
    // Generate chunks around origin
    const chunkRadius = Math.floor(WORLD_SIZE / 2);
  
    // Track total operations for progress updates
    const totalOperations = (2 * chunkRadius + 1) * (2 * chunkRadius + 1) * CHUNK_SIZE * CHUNK_SIZE;
    let completedOperations = 0;
    
    console.log(`Generating ${(2 * chunkRadius + 1) * (2 * chunkRadius + 1)} chunks...`);
  
    for (let cx = -chunkRadius; cx <= chunkRadius; cx++) {
      for (let cz = -chunkRadius; cz <= chunkRadius; cz++) {
        // Register chunk
        const chunkKey = `${cx},${cz}`;
        chunks[chunkKey] = { x: cx, z: cz };
      
        // Generate all blocks in this chunk
        for (let x = 0; x < CHUNK_SIZE; x++) {
          for (let z = 0; z < CHUNK_SIZE; z++) {
            // World coordinates
            const worldX = cx * CHUNK_SIZE + x;
            const worldZ = cz * CHUNK_SIZE + z;
            
            // SIMPLIFIED height calculation with fewer noise samples
            const frequency1 = 0.01; // Primary terrain frequency
            
            // Simplified terrain shape with just one noise function for hills
            const hillValue = simplex.noise2D(worldX * frequency1, worldZ * frequency1);
            
            // Generate altitude using simplified formula
            let height = BASE_HEIGHT + (hillValue * MOUNTAIN_HEIGHT);
            height = Math.max(1, Math.floor(height)); // Ensure at least 1 block of ground
            
            // Simplified biome with just one noise function
            const biomeValue = simplex2.noise2D(worldX * 0.005, worldZ * 0.005);
            const biomeType = (biomeValue + 1) / 2; // 0-1 range
            
            // Extremely simplified biome determination (just 3 biomes)
            let biome: 'plains' | 'desert' | 'forest';
            
            if (biomeType < 0.33) {
              biome = 'desert';
            } else if (biomeType < 0.66) {
              biome = 'plains';
            } else {
              biome = 'forest';
            }
            
            // SIMPLIFIED: Base layer is always stone
            blocks[`${worldX},0,${worldZ}`] = 'stone';
            
            // OPTIMIZED: Skip generating internal blocks we can't see
            // Only create stone below terrain surface - 3 blocks deep
            blocks[`${worldX},${height-3},${worldZ}`] = 'stone';
            blocks[`${worldX},${height-2},${worldZ}`] = 'stone';
            
            // Just one layer of dirt/sand
            let underSurfaceBlock: BlockType = 'dirt';
            if (biome === 'desert') {
              underSurfaceBlock = 'sand';
            }
            blocks[`${worldX},${height-1},${worldZ}`] = underSurfaceBlock;
            
            // Top layer depends on biome (extremely simplified)
            let surfaceBlock: BlockType = 'grass';
            if (biome === 'desert') {
              surfaceBlock = 'sand';
            }
            
            // Set the surface block
            blocks[`${worldX},${height},${worldZ}`] = surfaceBlock;
            
            // Add water where height is below water level
            if (height < WATER_LEVEL) {
              blocks[`${worldX},${WATER_LEVEL},${worldZ}`] = 'water';
            }
            
            // SIMPLIFIED: Very rare tree generation 
            if (biome === 'forest' && Math.random() < 0.03 && height > WATER_LEVEL) {
              // Fixed height trees to reduce complexity
              const treeHeight = 4;
              
              // Simple trunk
              for (let y = height + 1; y < height + treeHeight; y++) {
                blocks[`${worldX},${y},${worldZ}`] = 'wood';
              }
              
              // Minimal cube of leaves
              for (let lx = -1; lx <= 1; lx++) {
                for (let ly = 0; ly <= 1; ly++) {
                  for (let lz = -1; lz <= 1; lz++) {
                    // Skip trunk space
                    if (lx === 0 && lz === 0) continue;
                    
                    const leafX = worldX + lx;
                    const leafY = height + treeHeight + ly;
                    const leafZ = worldZ + lz;
                    
                    blocks[`${leafX},${leafY},${leafZ}`] = 'leaves';
                  }
                }
              }
            }
            
            // Update progress counter
            completedOperations++;
          }
        }
      }
    }
  
    console.log(`Generated ${Object.keys(chunks).length} chunks with ${Object.keys(blocks).length} blocks`);
    
    return { generatedChunks: chunks, generatedBlocks: blocks };
  } catch (error) {
    console.error("Failed to generate terrain:", error);
    
    // Create a minimal fallback terrain (flat platform) to prevent game from crashing
    const fallbackChunks: Record<string, { x: number, z: number }> = { 
      '0,0': { x: 0, z: 0 } 
    };
    const fallbackBlocks: Record<string, BlockType> = {};
    
    // Create a small 16x16 flat platform at y=15
    for (let x = 0; x < CHUNK_SIZE; x++) {
      for (let z = 0; z < CHUNK_SIZE; z++) {
        // Add stone base
        fallbackBlocks[`${x},13,${z}`] = 'stone';
        
        // Add dirt layer
        fallbackBlocks[`${x},14,${z}`] = 'dirt';
        
        // Add grass top
        fallbackBlocks[`${x},15,${z}`] = 'grass';
      }
    }
    
    console.log("Generated fallback terrain as emergency measure");
    return { generatedChunks: fallbackChunks, generatedBlocks: fallbackBlocks };
  }
}

// Get appropriate block type based on height and biome
function getBlockType(height: number, y: number, biome: string, waterLevel: number): BlockType {
  // Below ground
  if (y < height - 3) {
    return 'stone';
  }
  
  // Underground
  if (y < height) {
    if (biome === 'desert' || biome === 'beach' || biome === 'cactus') {
      return 'sand';
    }
    return 'dirt';
  }
  
  // Surface
  if (y === height) {
    if (biome === 'desert' || biome === 'beach' || biome === 'cactus') {
      return 'sand';
    }
    if (biome === 'snow') {
      return 'snow';
    }
    if (biome === 'mountains') {
      if (height > 40) {
        return 'snow';
      } else if (height > 25) {
        return 'stone';
      }
    }
    return 'grass';
  }
  
  // Water - potentially frozen in cold biomes
  if (y <= waterLevel) {
    if (biome === 'snow' && y === waterLevel) {
      return 'ice';
    }
    return 'water';
  }
  
  // Air
  return 'air';
}
