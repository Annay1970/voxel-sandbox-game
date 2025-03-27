import { SimplexNoise } from './utils/noise';
import { BlockType } from './blocks';
import { CHUNK_SIZE } from '../components/game/Chunk';

// Generate initial terrain for the world
export function generateTerrain() {
  console.log("Generating terrain...");
  
  // Create noise generators
  const simplex = new SimplexNoise(Math.random());
  const simplex2 = new SimplexNoise(Math.random());
  const simplex3 = new SimplexNoise(Math.random());
  
  // Terrain parameters
  const WORLD_SIZE = 8; // in chunks (16x16 each)
  const WATER_LEVEL = 10;
  const MOUNTAIN_HEIGHT = 60;
  const BASE_HEIGHT = 20;
  const CAVE_FREQUENCY = 0.03; // Controls how often caves appear
  
  // Data structures to store generated world
  const chunks: Record<string, boolean> = {};
  const blocks: Record<string, BlockType> = {};
  
  // Generate chunks around origin
  const chunkRadius = Math.floor(WORLD_SIZE / 2);
  
  for (let cx = -chunkRadius; cx <= chunkRadius; cx++) {
    for (let cz = -chunkRadius; cz <= chunkRadius; cz++) {
      // Register chunk
      const chunkKey = `${cx},${cz}`;
      chunks[chunkKey] = true;
      
      // Generate all blocks in this chunk
      for (let x = 0; x < CHUNK_SIZE; x++) {
        for (let z = 0; z < CHUNK_SIZE; z++) {
          // World coordinates
          const worldX = cx * CHUNK_SIZE + x;
          const worldZ = cz * CHUNK_SIZE + z;
          
          // Get height map using multiple noise functions
          const frequency1 = 0.01;
          const frequency2 = 0.05;
          const frequency3 = 0.002;
          
          // Base continent shape (large features)
          const continentValue = simplex.noise2D(worldX * frequency3, worldZ * frequency3);
          const continentHeight = Math.pow(continentValue * 0.5 + 0.5, 2) * MOUNTAIN_HEIGHT;
          
          // Add hills (medium features)
          const hillValue = simplex2.noise2D(worldX * frequency1, worldZ * frequency1);
          const hillHeight = hillValue * 10;
          
          // Add roughness (small features)
          const roughValue = simplex3.noise2D(worldX * frequency2, worldZ * frequency2);
          const roughHeight = roughValue * 3;
          
          // Combine all height factors
          let height = BASE_HEIGHT + continentHeight + hillHeight + roughHeight;
          height = Math.max(1, Math.floor(height)); // Ensure at least 1 block of ground
          
          // Biome determination
          const temperatureNoise = simplex.noise2D(worldX * 0.005, worldZ * 0.005);
          const humidityNoise = simplex2.noise2D(worldX * 0.005, worldZ * 0.005);
          
          const temperature = (temperatureNoise + 1) / 2; // 0-1
          const humidity = (humidityNoise + 1) / 2; // 0-1
          
          // Determine biome type
          let biome: 'plains' | 'desert' | 'forest' | 'mountains' | 'beach';
          
          if (height < WATER_LEVEL + 2) {
            biome = 'beach';
          } else if (temperature > 0.7) {
            biome = 'desert';
          } else if (humidity > 0.6) {
            biome = 'forest';
          } else if (height > BASE_HEIGHT + 20) {
            biome = 'mountains';
          } else {
            biome = 'plains';
          }
          
          // Generate blocks for this column
          // Start with bedrock at bottom
          blocks[`${worldX},0,${worldZ}`] = 'stone';
          
          // Fill with stone up to near surface
          for (let y = 1; y < height - 3; y++) {
            blocks[`${worldX},${y},${worldZ}`] = 'stone';
          }
          
          // Surface blocks depend on biome
          for (let y = Math.max(1, height - 3); y < height; y++) {
            let blockType: BlockType = 'dirt';
            
            // Deeper dirt/sand/etc.
            if (biome === 'desert') {
              blockType = 'sand';
            } else if (biome === 'beach') {
              blockType = 'sand';
            } else {
              blockType = 'dirt';
            }
            
            blocks[`${worldX},${y},${worldZ}`] = blockType;
          }
          
          // Top layer depends on biome
          if (height > WATER_LEVEL) {
            let surfaceBlock: BlockType = 'grass';
            
            switch (biome) {
              case 'desert':
                surfaceBlock = 'sand';
                break;
              case 'beach':
                surfaceBlock = 'sand';
                break;
              case 'mountains':
                // Higher mountains have stone tops
                surfaceBlock = (height > BASE_HEIGHT + 25) ? 'stone' : 'grass';
                break;
              default:
                surfaceBlock = 'grass';
            }
            
            blocks[`${worldX},${height},${worldZ}`] = surfaceBlock;
          }
          
          // Add water where height is below water level
          for (let y = height + 1; y <= WATER_LEVEL; y++) {
            blocks[`${worldX},${y},${worldZ}`] = 'water';
          }
          
          // Add trees in forests and occasionally in plains
          if ((biome === 'forest' && Math.random() < 0.05) || 
              (biome === 'plains' && Math.random() < 0.01)) {
            
            // Only place trees on grass
            if (height > WATER_LEVEL && blocks[`${worldX},${height},${worldZ}`] === 'grass') {
              const treeHeight = Math.floor(Math.random() * 3) + 4; // 4-6 blocks
              
              // Trunk
              for (let y = height + 1; y < height + treeHeight; y++) {
                blocks[`${worldX},${y},${worldZ}`] = 'wood';
              }
              
              // Leaves
              const leafRadius = 2;
              for (let lx = -leafRadius; lx <= leafRadius; lx++) {
                for (let ly = -leafRadius; ly <= leafRadius; ly++) {
                  for (let lz = -leafRadius; lz <= leafRadius; lz++) {
                    // Skip trunk space
                    if (lx === 0 && lz === 0 && ly <= 0) continue;
                    
                    // Make spherical-ish leaf arrangement
                    const dist = Math.sqrt(lx * lx + ly * ly + lz * lz);
                    if (dist <= leafRadius + 0.5) {
                      const leafX = worldX + lx;
                      const leafY = height + treeHeight + ly;
                      const leafZ = worldZ + lz;
                      
                      // Don't overwrite existing blocks
                      const leafKey = `${leafX},${leafY},${leafZ}`;
                      if (!blocks[leafKey]) {
                        blocks[leafKey] = 'leaves';
                      }
                    }
                  }
                }
              }
            }
          }
        }
      }
    }
  }
  
  console.log(`Generated ${Object.keys(chunks).length} chunks with ${Object.keys(blocks).length} blocks`);
  
  return { generatedChunks: chunks, generatedBlocks: blocks };
}

// Get appropriate block type based on height and biome
function getBlockType(height: number, y: number, biome: string, waterLevel: number): BlockType {
  // Below ground
  if (y < height - 3) {
    return 'stone';
  }
  
  // Underground
  if (y < height) {
    if (biome === 'desert' || biome === 'beach') {
      return 'sand';
    }
    return 'dirt';
  }
  
  // Surface
  if (y === height) {
    if (biome === 'desert' || biome === 'beach') {
      return 'sand';
    }
    if (biome === 'mountains' && height > 25) {
      return 'stone';
    }
    return 'grass';
  }
  
  // Water
  if (y <= waterLevel) {
    return 'water';
  }
  
  // Air
  return 'air';
}
