import { SimplexNoise } from './utils/noise';
import { BlockType } from './blocks';
import { CHUNK_SIZE } from '../components/game/Chunk';

// Generate initial terrain for the world
export function generateTerrain() {
  console.log("Generating terrain...");
  
  try {
    // Create noise generators with seeds for reproducibility 
    const seed1 = Math.random();
    const seed2 = Math.random();
    const seed3 = Math.random();
    console.log(`Using terrain seeds: ${seed1.toFixed(4)}, ${seed2.toFixed(4)}, ${seed3.toFixed(4)}`);
    
    const simplex = new SimplexNoise(seed1);
    const simplex2 = new SimplexNoise(seed2);
    const simplex3 = new SimplexNoise(seed3);
  
    // Terrain parameters
    const WORLD_SIZE = 12; // in chunks (16x16 each) - increased for more exploration area
    const WATER_LEVEL = 10;
    const MOUNTAIN_HEIGHT = 80; // Higher mountains
    const BASE_HEIGHT = 20;
    const CAVE_FREQUENCY = 0.03; // Controls how often caves appear
    
    // Data structures to store generated world
    const chunks: Record<string, { x: number, z: number }> = {};
    const blocks: Record<string, BlockType> = {};
    
    // Generate chunks around origin
    const chunkRadius = Math.floor(WORLD_SIZE / 2);
  
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
            let biome: 'plains' | 'desert' | 'forest' | 'mountains' | 'beach' | 'snow' | 'cactus';
            
            if (height < WATER_LEVEL + 2) {
              biome = 'beach';
            } else if (temperature > 0.8 && humidity < 0.3) {
              biome = 'desert';
            } else if (temperature < 0.2) {
              biome = 'snow'; // Add snow biome for cold areas
            } else if (temperature > 0.7 && humidity < 0.5) {
              biome = 'cactus'; // Add cactus biome for hot, moderate humidity areas
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
              // Create rare lava pools in deep regions
              if (y < 15 && Math.random() < 0.002) { // Very rare lava pools
                // Generate a small lava pool
                const lavaRadius = Math.floor(Math.random() * 2) + 2;
                const lavaHeight = Math.floor(Math.random() * 2) + 2;
                
                for (let lx = -lavaRadius; lx <= lavaRadius; lx++) {
                  for (let lz = -lavaRadius; lz <= lavaRadius; lz++) {
                    for (let ly = 0; ly < lavaHeight; ly++) {
                      const dist = Math.sqrt(lx*lx + lz*lz);
                      if (dist <= lavaRadius) {
                        const lavaX = worldX + lx;
                        const lavaY = y + ly;
                        const lavaZ = worldZ + lz;
                        blocks[`${lavaX},${lavaY},${lavaZ}`] = 'lava';
                      }
                    }
                  }
                }
                
                // Skip over the lava pool area
                y += lavaHeight;
              } else {
                blocks[`${worldX},${y},${worldZ}`] = 'stone';
              }
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
                case 'snow':
                  surfaceBlock = 'snow';
                  // Add ice lakes in snow biomes
                  if (Math.random() < 0.1 && height < BASE_HEIGHT + 5) {
                    // Create small ice lakes
                    const lakeRadius = Math.floor(Math.random() * 3) + 2;
                    const lakeDepth = Math.floor(Math.random() * 2) + 1;
                    
                    for (let lx = -lakeRadius; lx <= lakeRadius; lx++) {
                      for (let lz = -lakeRadius; lz <= lakeRadius; lz++) {
                        const dist = Math.sqrt(lx*lx + lz*lz);
                        if (dist <= lakeRadius) {
                          const lakeX = worldX + lx;
                          const lakeZ = worldZ + lz;
                          
                          // Replace surface block with ice
                          blocks[`${lakeX},${height},${lakeZ}`] = 'ice';
                          
                          // Add water underneath ice
                          for (let d = 1; d <= lakeDepth; d++) {
                            blocks[`${lakeX},${height-d},${lakeZ}`] = 'water';
                          }
                        }
                      }
                    }
                  }
                  break;
                case 'cactus':
                  surfaceBlock = 'sand';
                  // Add occasional cacti in the cactus biome
                  if (Math.random() < 0.1) {
                    const cactusHeight = Math.floor(Math.random() * 3) + 2;
                    for (let y = height + 1; y <= height + cactusHeight; y++) {
                      blocks[`${worldX},${y},${worldZ}`] = 'cactus';
                    }
                  }
                  break;
                case 'mountains':
                  // Higher mountains have stone tops
                  // Very high mountains get snow caps
                  if (height > BASE_HEIGHT + 40) {
                    surfaceBlock = 'snow';
                  } else if (height > BASE_HEIGHT + 25) {
                    surfaceBlock = 'stone';
                  } else {
                    surfaceBlock = 'grass';
                  }
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
            
            // Add trees in forests and occasionally in plains - increased frequency
            if ((biome === 'forest' && Math.random() < 0.12) || // More trees in forests
                (biome === 'plains' && Math.random() < 0.03) || // More trees in plains
                (biome === 'mountains' && height < BASE_HEIGHT + 35 && Math.random() < 0.02)) { // Some trees on mountain slopes
              
              // Only place trees on grass or dirt
              if (height > WATER_LEVEL && 
                 (blocks[`${worldX},${height},${worldZ}`] === 'grass' || 
                  blocks[`${worldX},${height},${worldZ}`] === 'dirt')) {
                
                // Varied tree heights based on biome
                let treeHeight;
                if (biome === 'forest') {
                  treeHeight = Math.floor(Math.random() * 4) + 5; // 5-8 blocks for forest
                } else if (biome === 'mountains') {
                  treeHeight = Math.floor(Math.random() * 2) + 3; // 3-4 blocks for mountains
                } else {
                  treeHeight = Math.floor(Math.random() * 3) + 4; // 4-6 blocks for plains
                }
                
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
  } catch (error) {
    console.error("Failed to generate terrain:", error);
    
    // Create a minimal fallback terrain (flat platform) to prevent game from crashing
    const fallbackChunks: Record<string, { x: number, z: number }> = { 
      '0,0': { x: 0, z: 0 } 
    };
    const fallbackBlocks: Record<string, BlockType> = {};
    
    // Create a small 16x16 flat platform at y=20
    for (let x = 0; x < CHUNK_SIZE; x++) {
      for (let z = 0; z < CHUNK_SIZE; z++) {
        // Add stone base
        for (let y = 15; y < 19; y++) {
          fallbackBlocks[`${x},${y},${z}`] = 'stone';
        }
        
        // Add dirt layer
        fallbackBlocks[`${x},19,${z}`] = 'dirt';
        
        // Add grass top
        fallbackBlocks[`${x},20,${z}`] = 'grass';
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
