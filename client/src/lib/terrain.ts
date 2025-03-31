import { BlockType } from './blocks';
import { CHUNK_SIZE } from '../components/game/Chunk';

// Enhanced terrain generator with optimized chunk-based loading
export function generateTerrain() {
  console.log("Initializing terrain generator with optimized chunk-based loading...");
  
  try {
    // Initialize with center chunk
    const chunks: Record<string, { x: number, z: number }> = {
      '0,0': { x: 0, z: 0 }
    };
    
    const blocks: Record<string, BlockType> = {};
    
    // Base platform values
    const platformHeight = 15;
    const waterLevel = platformHeight - 1;
    
    // Set up seed values for deterministic generation
    const SEED = Math.floor(Math.random() * 1000000);
    
    // Biome map for the world - defines which biomes are where
    // Using a deterministic approach for chunk generation
    const BIOME_MAP = [
      ['mountains', 'snow',      'snow',     'mountains'],
      ['forest',    'plains',    'cactus',   'desert'],
      ['mushroom',  'riverbank', 'swamp',    'beach'],
      ['forest',    'plains',    'riverbank','volcanic']
    ];
    
    // Using the biome map to make deterministic biome selection
    const getBiomeForCoordinates = (x: number, z: number): string => {
      // Scale coordinates to match the biome map
      // Each biome is 32x32 blocks
      const biomeX = Math.floor((x + 1000) / 32) % BIOME_MAP[0].length;
      const biomeZ = Math.floor((z + 1000) / 32) % BIOME_MAP.length;
      
      // Get biome type from map
      return BIOME_MAP[biomeZ][biomeX];
    };
    
    // Create more interesting varying heights using multiple noise functions
    const getHeight = (x: number, z: number, biome: string): number => {
      let baseHeight = platformHeight;
      
      // Generate different noise values using sine/cosine
      // Using different frequencies to create more interesting terrain
      const noise1 = (Math.sin(x * 0.1) * Math.cos(z * 0.1)) * 2;
      const noise2 = (Math.sin(x * 0.05 + 0.3) * Math.cos(z * 0.05 + 0.3)) * 4;
      const noise3 = (Math.sin(x * 0.3 + 0.7) * Math.cos(z * 0.3 + 0.7)) * 1;
      
      // Different height modifiers per biome
      switch (biome) {
        case 'mountains':
          // More dramatic height changes
          baseHeight += Math.floor(noise1 + noise2 * 1.5);
          baseHeight += Math.floor(Math.abs(Math.sin(x * 0.05) * Math.cos(z * 0.05) * 8));
          break;
        case 'plains':
          // Gentle rolling hills
          baseHeight += Math.floor(noise1 * 0.7 + noise3 * 0.3);
          break;
        case 'desert':
          // Sand dunes with varied heights
          baseHeight += Math.floor(Math.abs(Math.sin(x * 0.08) * Math.cos(z * 0.08) * 3));
          break;
        case 'forest':
          // Slightly hilly
          baseHeight += Math.floor(noise1 + noise3);
          break;
        case 'riverbank':
        case 'beach':
          // Lower than surroundings
          baseHeight -= 1 + Math.floor(Math.abs(noise1 * 0.5));
          break;
        case 'swamp':
          // Varied but generally low
          baseHeight -= Math.floor(noise3 * 0.7);
          break;
        case 'snow':
          // Snow-covered mountains
          baseHeight += Math.floor(noise2 * 0.8 + noise1 * 0.5);
          break;
        case 'mushroom':
          // Somewhat weird and uneven
          baseHeight += Math.floor((noise1 * noise3) * 1.2);
          break;
        case 'volcanic':
          // Volcanic terrain with hills and craters
          baseHeight += Math.floor(Math.abs(Math.sin(x * 0.1) * Math.cos(z * 0.1)) * 5); // Raised terrain
          if (Math.random() < 0.1) {
            // Create occasional craters/calderas
            baseHeight -= Math.floor(Math.random() * 3) + 2;
          }
          break;
        default:
          // Default terrain
          baseHeight += Math.floor(noise1);
      }
      
      return baseHeight;
    };
    
    // Generate a specific chunk of terrain
    // This is the key function for on-demand generation
    const generateChunkTerrain = (chunkX: number, chunkZ: number) => {
      console.log(`Generating chunk at ${chunkX},${chunkZ}`);
      
      // Add chunk to the chunks record
      chunks[`${chunkX},${chunkZ}`] = { x: chunkX, z: chunkZ };
      
      // Calculate block coordinates
      const startX = chunkX * 16;
      const startZ = chunkZ * 16;
      const endX = startX + 16;
      const endZ = startZ + 16;
      
      // Track added features for better distribution
      const addedFeatures: Map<string, Set<string>> = new Map();
      
      // Generate all blocks in this chunk
      for (let x = startX; x < endX; x++) {
        for (let z = startZ; z < endZ; z++) {
          // Get biome for this location
          const biome = getBiomeForCoordinates(x, z);
          
          // Create a feature key for tracking features in this area
          const featureKey = `${Math.floor(x/4)},${Math.floor(z/4)}`;
          
          // Initialize feature set if needed
          if (!addedFeatures.has(featureKey)) {
            addedFeatures.set(featureKey, new Set());
          }
          
          // Calculate terrain height at this position
          const height = getHeight(x, z, biome);
          
          // Generate underground and surface
          for (let y = Math.max(0, height - 10); y <= height; y++) {
            blocks[`${x},${y},${z}`] = getBlockType(height, y, biome, waterLevel);
          }
          
          // Add features above ground with distance-based limitations
          if (biome === 'riverbank' || biome === 'swamp' || biome === 'beach') {
            // Add water in low areas
            if (height <= waterLevel) {
              for (let y = height + 1; y <= waterLevel; y++) {
                blocks[`${x},${y},${z}`] = 'water';
              }
            }
          } else if (biome === 'forest' && Math.random() < 0.03 && 
                    !addedFeatures.get(featureKey)?.has('tree')) {
            // Add trees in forest biome - limit to avoid overcrowding
            addedFeatures.get(featureKey)?.add('tree');
            generateTree(x, height, z, blocks);
          } else if (biome === 'desert' && Math.random() < 0.02 && 
                    !addedFeatures.get(featureKey)?.has('cactus')) {
            // Add cacti in desert
            addedFeatures.get(featureKey)?.add('cactus');
            generateCactus(x, height, z, blocks);
          } else if (biome === 'snow' && Math.random() < 0.1) {
            // Add ice and snow layers
            if (height > waterLevel && !blocks[`${x},${height+1},${z}`]) {
              blocks[`${x},${height+1},${z}`] = Math.random() < 0.7 ? 'snow' : 'ice';
            }
          } else if (biome === 'mushroom' && Math.random() < 0.05 && 
                    !addedFeatures.get(featureKey)?.has('mushroom')) {
            // Add mushrooms in mushroom biome
            addedFeatures.get(featureKey)?.add('mushroom');
            if (height > waterLevel && !blocks[`${x},${height+1},${z}`]) {
              blocks[`${x},${height+1},${z}`] = 'mushroom';
            }
          } else if ((biome === 'plains' || biome === 'forest') && Math.random() < 0.15) {
            // Add flowers and grass in plains
            if (height > waterLevel && !blocks[`${x},${height+1},${z}`]) {
              const randomPlant = Math.random();
              if (randomPlant < 0.3) {
                blocks[`${x},${height+1},${z}`] = 'flower';
              } else if (randomPlant < 0.5) {
                blocks[`${x},${height+1},${z}`] = 'roseflower';
              } else if (randomPlant < 0.7) {
                blocks[`${x},${height+1},${z}`] = 'blueflower';
              } else {
                blocks[`${x},${height+1},${z}`] = 'tallGrass';
              }
            }
          } else if (biome === 'mountains' && Math.random() < 0.01 && 
                    !addedFeatures.get(featureKey)?.has('ore_vein')) {
            // Add exposed ore veins in mountains
            addedFeatures.get(featureKey)?.add('ore_vein');
            if (Math.random() < 0.3) {
              generateOreVein(x, height, z, 'ironOre', 3, blocks);
            } else if (Math.random() < 0.2) {
              generateOreVein(x, height, z, 'goldOre', 2, blocks);
            } else if (Math.random() < 0.1) {
              generateOreVein(x, height, z, 'diamond', 1, blocks);
            }
          } else if (biome === 'volcanic') {
            // Add volcanic features
            if (Math.random() < 0.2 && !addedFeatures.get(featureKey)?.has('lava_pool')) {
              // Create lava pools in depressions
              addedFeatures.get(featureKey)?.add('lava_pool');
              
              // Create a small crater with lava
              const craterRadius = Math.floor(Math.random() * 2) + 1;
              const craterDepth = Math.floor(Math.random() * 2) + 1;
              
              for (let cx = -craterRadius; cx <= craterRadius; cx++) {
                for (let cz = -craterRadius; cz <= craterRadius; cz++) {
                  const distance = Math.sqrt(cx*cx + cz*cz);
                  if (distance <= craterRadius) {
                    // Dig out the crater
                    const cx_world = x + cx;
                    const cz_world = z + cz;
                    const crater_height = height - craterDepth;
                    
                    // Fill with lava
                    blocks[`${cx_world},${crater_height},${cz_world}`] = 'lava';
                    
                    // Add some magmaStone around the edges
                    if (distance > craterRadius * 0.5) {
                      blocks[`${cx_world},${crater_height-1},${cz_world}`] = 'magmaStone';
                    }
                  }
                }
              }
            } else if (Math.random() < 0.15 && !addedFeatures.get(featureKey)?.has('volcanic_vent')) {
              // Create volcanic vents
              addedFeatures.get(featureKey)?.add('volcanic_vent');
              
              // Create a column of hotObsidian with magmaStone cap
              const ventHeight = Math.floor(Math.random() * 3) + 1;
              
              for (let vy = 1; vy <= ventHeight; vy++) {
                blocks[`${x},${height+vy},${z}`] = vy === ventHeight ? 'magmaStone' : 'hotObsidian';
              }
              
              // Add some volcanic ash around the vent
              for (let vx = -1; vx <= 1; vx++) {
                for (let vz = -1; vz <= 1; vz++) {
                  if ((vx !== 0 || vz !== 0) && Math.random() < 0.7) {
                    if (!blocks[`${x+vx},${height+1},${z+vz}`] || 
                        blocks[`${x+vx},${height+1},${z+vz}`] === 'air') {
                      blocks[`${x+vx},${height+1},${z+vz}`] = 'volcanicAsh';
                    }
                  }
                }
              }
            } else if (Math.random() < 0.3 && !blocks[`${x},${height+1},${z}`]) {
              // Add volcanic ash patches
              blocks[`${x},${height+1},${z}`] = 'volcanicAsh';
            }
          }
          
          // Always add air above solid ground
          for (let y = height + 1; y < height + 20; y++) {
            if (!blocks[`${x},${y},${z}`]) {
              blocks[`${x},${y},${z}`] = 'air';
            }
          }
        }
      }
      
      // For the center chunk, add some special features
      if (chunkX === 0 && chunkZ === 0) {
        // Center crafting table
        blocks[`0,${platformHeight+1},0`] = 'craftingTable';
        
        // Torches around center
        blocks[`2,${getHeight(2, 2, 'plains')+1},2`] = 'torch';
        blocks[`-2,${getHeight(-2, 2, 'plains')+1},2`] = 'torch';
        blocks[`2,${getHeight(2, -2, 'plains')+1},-2`] = 'torch';
        blocks[`-2,${getHeight(-2, -2, 'plains')+1},-2`] = 'torch';
        
        // Example ores
        blocks[`4,${platformHeight-5},4`] = 'diamond';
        blocks[`-4,${platformHeight-6},-4`] = 'emerald';
        
        // Sample blocks
        blocks[`3,${platformHeight+1},0`] = 'gravel';
        blocks[`-3,${platformHeight+1},0`] = 'clay';
        blocks[`0,${platformHeight+1},3`] = 'pumpkin';
        blocks[`0,${platformHeight+1},-3`] = 'melon';
        
        // Glowstone example
        blocks[`5,${platformHeight+1},5`] = 'glowstone';
        
        // Small lava pool
        blocks[`-5,${platformHeight+1},-5`] = 'lava';
        blocks[`-5,${platformHeight+1},-6`] = 'lava';
        blocks[`-6,${platformHeight+1},-5`] = 'lava';
        blocks[`-6,${platformHeight+1},-6`] = 'obsidian';
      }
    };
    
    // Helper to generate a tree
    const generateTree = (x: number, baseHeight: number, z: number, blockMap: Record<string, BlockType>) => {
      // Tree height varies
      const treeHeight = 3 + Math.floor(Math.random() * 3);
      
      // Tree trunk
      for (let y = 1; y <= treeHeight; y++) {
        blockMap[`${x},${baseHeight+y},${z}`] = 'wood';
      }
      
      // Tree leaves - with optimization to skip hidden leaves
      const leafRadius = 2;
      for (let lx = -leafRadius; lx <= leafRadius; lx++) {
        for (let lz = -leafRadius; lz <= leafRadius; lz++) {
          for (let ly = 0; ly <= 2; ly++) {
            // Skip if too far from trunk (make spherical leaves)
            const distFromCenter = Math.sqrt(lx*lx + lz*lz + ly*ly);
            
            if (distFromCenter <= 2.5) {
              const leafX = x + lx;
              const leafY = baseHeight + treeHeight - ly;
              const leafZ = z + lz;
              
              // Don't place leaves where the trunk is
              if (!(lx === 0 && lz === 0)) {
                blockMap[`${leafX},${leafY},${leafZ}`] = 'leaves';
              }
            }
          }
        }
      }
    };
    
    // Helper to generate a cactus
    const generateCactus = (x: number, baseHeight: number, z: number, blockMap: Record<string, BlockType>) => {
      // Cactus height varies
      const cactusHeight = 1 + Math.floor(Math.random() * 3);
      
      // Simple cactus column
      for (let y = 1; y <= cactusHeight; y++) {
        blockMap[`${x},${baseHeight+y},${z}`] = 'cactus';
      }
      
      // Occasionally add "arms" to cactus
      if (cactusHeight > 1 && Math.random() < 0.4) {
        const armHeight = Math.floor(Math.random() * (cactusHeight - 1)) + 1;
        const armDirection = Math.floor(Math.random() * 4);
        
        let armX = x;
        let armZ = z;
        
        switch(armDirection) {
          case 0: armX = x + 1; break;
          case 1: armX = x - 1; break;
          case 2: armZ = z + 1; break;
          case 3: armZ = z - 1; break;
        }
        
        blockMap[`${armX},${baseHeight+armHeight},${armZ}`] = 'cactus';
      }
    };
    
    // Helper to generate an ore vein
    const generateOreVein = (
      x: number, 
      baseHeight: number, 
      z: number, 
      oreType: BlockType,
      size: number,
      blockMap: Record<string, BlockType>
    ) => {
      // Place ore cluster
      for (let ox = -size; ox <= size; ox++) {
        for (let oy = -size; oy <= size; oy++) {
          for (let oz = -size; oz <= size; oz++) {
            const distance = Math.sqrt(ox*ox + oy*oy + oz*oz);
            
            // Random distribution based on distance
            if (distance <= size && Math.random() < 0.5) {
              const oreX = x + ox;
              const oreY = baseHeight - Math.abs(oy);
              const oreZ = z + oz;
              
              // Don't place ores above ground
              if (oreY < baseHeight) {
                blockMap[`${oreX},${oreY},${oreZ}`] = oreType;
              }
            }
          }
        }
      }
    };
    
    // Generate just the initial center chunk for startup
    generateChunkTerrain(0, 0);
    
    console.log(`Created initial terrain with ${Object.keys(blocks).length} blocks`);
    return { generatedChunks: chunks, generatedBlocks: blocks };
    
  } catch (error) {
    console.error("Failed to generate enhanced terrain:", error);
    
    // Absolute minimum fallback - just a few blocks
    const fallbackChunks: Record<string, { x: number, z: number }> = { 
      '0,0': { x: 0, z: 0 } 
    };
    const fallbackBlocks: Record<string, BlockType> = {};
    
    // Create a simple platform
    for (let x = -4; x <= 4; x++) {
      for (let z = -4; z <= 4; z++) {
        fallbackBlocks[`${x},15,${z}`] = 'grass';
        
        // Add some depth
        for (let y = 10; y < 15; y++) {
          fallbackBlocks[`${x},${y},${z}`] = 'dirt';
        }
      }
    }
    
    // Add a crafting table
    fallbackBlocks['0,16,0'] = 'craftingTable';
    
    console.log("Generated emergency fallback platform");
    return { generatedChunks: fallbackChunks, generatedBlocks: fallbackBlocks };
  }
}

// Get appropriate block type based on height and biome
function getBlockType(height: number, y: number, biome: string, waterLevel: number): BlockType {
  // Below ground (deep underground)
  if (y < height - 10) {
    // Random chances for special ores deep underground
    const random = Math.random();
    
    if (random < 0.01) {
      return 'diamond'; // 1% chance of diamond
    } else if (random < 0.03) {
      return 'emerald'; // 2% chance of emerald
    } else if (random < 0.08) {
      return 'redstone'; // 5% chance of redstone
    } else if (random < 0.15) {
      return 'goldOre'; // 7% chance of gold ore
    } else if (random < 0.25) {
      return 'ironOre'; // 10% chance of iron ore
    } else if (random < 0.35) {
      return 'coal'; // 10% chance of coal
    } else if (random < 0.40 && biome === 'volcanic') {
      return 'obsidian'; // 5% chance of obsidian in volcanic biomes
    }
    
    return 'stone';
  }
  
  // Mid-level underground
  if (y < height - 3) {
    const random = Math.random();
    
    if (random < 0.08) {
      return 'coal'; // 8% chance of coal at mid levels
    } else if (random < 0.15) {
      return 'ironOre'; // 7% chance of iron ore at mid levels
    }
    
    return 'stone';
  }
  
  // Near-surface underground
  if (y < height) {
    if (biome === 'desert' || biome === 'beach' || biome === 'dunes') {
      return 'sand';
    } else if (biome === 'riverbank') {
      return Math.random() < 0.7 ? 'clay' : 'dirt'; // 70% chance of clay near rivers
    } else if (biome === 'gravel_beach') {
      return 'gravel';
    } else if (biome === 'swamp') {
      return Math.random() < 0.4 ? 'clay' : 'dirt'; // 40% chance of clay in swamps
    } else if (biome === 'volcanic') {
      // Volcanic biome has different underground materials
      if (y >= height - 2) {
        // Near surface layers
        const random = Math.random();
        if (random < 0.4) {
          return 'magmaStone'; // 40% chance of magmaStone near surface
        } else if (random < 0.7) {
          return 'stone'; // 30% chance of stone
        } else if (random < 0.85) {
          return 'volcanicAsh'; // 15% chance of volcanic ash deposits
        } else if (random < 0.95) {
          return 'obsidian'; // 10% chance of obsidian
        } else {
          return 'hotObsidian'; // 5% chance of hot obsidian
        }
      } else {
        // Deeper layers
        return Math.random() < 0.3 ? 'magmaStone' : 'stone';
      }
    }
    return 'dirt';
  }
  
  // Surface
  if (y === height) {
    if (biome === 'desert' || biome === 'beach' || biome === 'dunes') {
      return 'sand';
    } else if (biome === 'snow' || biome === 'tundra') {
      return 'snow';
    } else if (biome === 'mountains') {
      if (height > 40) {
        return 'snow';
      } else if (height > 25) {
        return 'stone';
      }
      return 'grass';
    } else if (biome === 'forest' || biome === 'plains') {
      // Random chance for tall grass or flowers in forest/plains
      const random = Math.random();
      if (random < 0.1) {
        return 'tallGrass';
      } else if (random < 0.12) {
        return 'flower';
      } else if (random < 0.13) {
        return 'roseflower';
      } else if (random < 0.14) {
        return 'blueflower';
      } else if (random < 0.15) {
        return random < 0.145 ? 'pumpkin' : 'melon'; // Rare pumpkins/melons
      }
      return 'grass';
    } else if (biome === 'mushroom') {
      return Math.random() < 0.3 ? 'mushroom' : 'grass'; // 30% chance of mushrooms
    } else if (biome === 'gravel_beach') {
      return 'gravel';
    } else if (biome === 'volcanic') {
      const random = Math.random();
      if (random < 0.4) {
        return 'obsidian';
      } else if (random < 0.7) {
        return 'stone';
      }
      return 'dirt';
    } else if (biome === 'swamp') {
      return Math.random() < 0.8 ? 'grass' : 'water'; // Scattered water patches
    }
    return 'grass';
  }
  
  // Above surface: liquids and air
  if (y <= waterLevel) {
    if ((biome === 'snow' || biome === 'tundra') && y === waterLevel) {
      return 'ice';
    } else if (biome === 'volcanic' && y === height + 1 && Math.random() < 0.4) {
      return 'lava'; // Lava pools in volcanic biomes
    }
    return 'water';
  }
  
  // Features that extend above the surface
  if (y === height + 1) {
    if (biome === 'cactus' && Math.random() < 0.1) {
      return 'cactus'; // 10% chance of cactus in cactus biome
    } else if ((biome === 'forest' || biome === 'plains') && Math.random() < 0.05) {
      return 'tallGrass'; // 5% chance of tall grass in forests/plains one block above
    }
  }
  
  // Air
  return 'air';
}
