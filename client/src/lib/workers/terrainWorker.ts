// Web worker for efficient chunk generation without blocking the main thread
// This separates terrain calculation from rendering for better performance

import { BlockType } from '../blocks';

interface ChunkGenerationMessage {
  type: 'generateChunk';
  payload: {
    chunkX: number;
    chunkZ: number;
    seed: number;
  };
}

// Respond to messages from the main thread
self.onmessage = (e: MessageEvent<ChunkGenerationMessage>) => {
  const { type, payload } = e.data;
  
  if (type === 'generateChunk') {
    const { chunkX, chunkZ, seed } = payload;
    
    // Generate and return the chunk data
    const chunkData = generateChunkData(chunkX, chunkZ, seed);
    
    // Send the generated chunk back to main thread
    self.postMessage({
      type: 'chunkGenerated',
      payload: {
        chunkX,
        chunkZ,
        blocks: chunkData
      }
    });
  }
};

// Improved terrain generation with better biome transitions
function generateChunkData(chunkX: number, chunkZ: number, seed: number): Record<string, BlockType> {
  const blocks: Record<string, BlockType> = {};
  const chunkSize = 16;
  const seaLevel = 5;
  
  // Use seed for deterministic generation
  const random = mulberry32(seed + chunkX * 65536 + chunkZ);
  
  // Pre-calculate noise values for better performance
  const noiseValues: number[][] = [];
  for (let x = 0; x < chunkSize; x++) {
    noiseValues[x] = [];
    for (let z = 0; z < chunkSize; z++) {
      const worldX = chunkX * chunkSize + x;
      const worldZ = chunkZ * chunkSize + z;
      
      // Improved terrain noise using multiple octaves for more natural terrain
      noiseValues[x][z] = (
        Math.sin(worldX * 0.1) * 2 + 
        Math.cos(worldZ * 0.1) * 2 +
        simplex2(worldX * 0.05, worldZ * 0.05) * 4 +
        simplex2(worldX * 0.01, worldZ * 0.01) * 8
      ) * 0.5 + seaLevel;
    }
  }
  
  // Generate the actual blocks based on noise
  for (let x = 0; x < chunkSize; x++) {
    for (let z = 0; z < chunkSize; z++) {
      const worldX = chunkX * chunkSize + x;
      const worldZ = chunkZ * chunkSize + z;
      
      // Get height from noise
      const height = Math.floor(noiseValues[x][z]);
      
      // Simplified biome determination (can be expanded)
      const temperature = simplex2(worldX * 0.01, worldZ * 0.01);
      const humidity = simplex2(worldX * 0.01 + 500, worldZ * 0.01 + 500);
      
      // Determine biome type
      let biome = 'plains';
      if (temperature > 0.5 && humidity < -0.3) biome = 'desert';
      else if (temperature < -0.5) biome = 'snow';
      else if (humidity > 0.5) biome = 'jungle';
      else if (temperature > 0.3 && humidity > 0.2) biome = 'forest';

      // Generate ground blocks
      for (let y = 0; y < 40; y++) {
        let blockType: BlockType = 'air';
        
        // Determine block type based on depth and biome
        if (y < height - 4) {
          blockType = 'stone';
          // Randomly add ores
          const oreRandom = random();
          if (oreRandom < 0.01 && y < 20) blockType = 'ironOre';
          else if (oreRandom < 0.005 && y < 15) blockType = 'goldOre';
          else if (oreRandom < 0.002 && y < 10) blockType = 'diamond';
        } else if (y < height - 1) {
          if (biome === 'desert') {
            blockType = 'sand';
          } else {
            blockType = 'dirt';
          }
        } else if (y === height - 1) {
          // Surface block based on biome
          if (biome === 'desert') {
            blockType = 'sand';
          } else if (biome === 'snow') {
            blockType = 'snow';
          } else {
            blockType = 'grass';
          }
        } else if (y < seaLevel) {
          blockType = 'water';
        }
        
        // Only add non-air blocks to reduce memory usage
        if (blockType !== 'air') {
          blocks[`${worldX},${y},${worldZ}`] = blockType;
        }
      }
      
      // Add features based on biome (trees, cacti, etc.)
      if (height > seaLevel) {
        // Trees in forests and jungles
        if ((biome === 'forest' || biome === 'jungle') && random() < 0.05) {
          addTree(blocks, worldX, height, worldZ, biome === 'jungle' ? 6 : 4, random);
        }
        
        // Cacti in deserts
        else if (biome === 'desert' && random() < 0.02) {
          const cactusHeight = Math.floor(random() * 2) + 2;
          for (let y = 0; y < cactusHeight; y++) {
            blocks[`${worldX},${height + y},${worldZ}`] = 'cactus';
          }
        }
        
        // Flowers in plains
        else if (biome === 'plains' && random() < 0.1) {
          const flowerType = random() < 0.5 ? 'flower' : 'roseflower';
          blocks[`${worldX},${height},${worldZ}`] = flowerType;
        }
      }
    }
  }
  
  return blocks;
}

// Helper for adding trees
function addTree(
  blocks: Record<string, BlockType>, 
  x: number, 
  baseHeight: number, 
  z: number, 
  height: number,
  random: () => number
) {
  // Tree trunk
  for (let y = 0; y < height; y++) {
    blocks[`${x},${baseHeight + y},${z}`] = 'log';
  }
  
  // Tree leaves
  const leafRadius = 2;
  for (let lx = -leafRadius; lx <= leafRadius; lx++) {
    for (let lz = -leafRadius; lz <= leafRadius; lz++) {
      for (let ly = -1; ly <= 2; ly++) {
        // Skip corners for a more rounded shape
        if (Math.abs(lx) === leafRadius && Math.abs(lz) === leafRadius && ly < 1) continue;
        
        // Add some randomness to leaf shape
        if (Math.abs(lx) === leafRadius && Math.abs(lz) === leafRadius && random() < 0.5) continue;
        
        const leafX = x + lx;
        const leafY = baseHeight + height + ly;
        const leafZ = z + lz;
        
        // Skip if there's already a trunk block at this position
        if (lx === 0 && lz === 0 && ly < 0) continue;
        
        blocks[`${leafX},${leafY},${leafZ}`] = 'leaves';
      }
    }
  }
  
  // Top leaf
  blocks[`${x},${baseHeight + height + 2},${z}`] = 'leaves';
}

// Optimized pseudo-random number generator
function mulberry32(seed: number): () => number {
  return function() {
    seed += 0x6D2B79F5;
    let t = seed;
    t = Math.imul(t ^ t >>> 15, t | 1);
    t ^= t + Math.imul(t ^ t >>> 7, t | 61);
    return ((t ^ t >>> 14) >>> 0) / 4294967296;
  };
}

// Simplex noise function for better terrain generation
function simplex2(x: number, y: number): number {
  // A simple approximation of simplex noise for this example
  return Math.sin(x * 1.5) * Math.cos(y * 1.5) * 0.5 +
         Math.sin(x * 3.0 + y * 2.0) * 0.25 +
         Math.sin(y * 5.0) * Math.cos(x * 4.0) * 0.125;
}

export {}; // Required for TypeScript to recognize this as a module