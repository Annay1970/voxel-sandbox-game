import { BlockType } from './blocks';
import { CHUNK_SIZE } from '../components/game/Chunk';

// Enhanced terrain with multiple biomes
export function generateTerrain() {
  console.log("Generating enhanced terrain with multiple biomes...");
  
  try {
    // Just one chunk for performance
    const chunks: Record<string, { x: number, z: number }> = {
      '0,0': { x: 0, z: 0 }
    };
    
    const blocks: Record<string, BlockType> = {};
    
    // Larger platform with biomes
    const platformSize = 12;
    const platformHeight = 15;
    const waterLevel = platformHeight - 1;
    
    // Biome distribution - divide the platform into sections
    // We'll create several biomes in different areas to showcase variety
    const getBiome = (x: number, z: number): string => {
      // Center area is plains
      if (Math.abs(x) < 3 && Math.abs(z) < 3) {
        return 'plains';
      }
      
      // Four quadrants get their own biome
      if (x >= 3 && z >= 3) {
        return 'desert';
      } else if (x <= -3 && z >= 3) {
        return 'snow';
      } else if (x <= -3 && z <= -3) {
        return 'mountains';
      } else if (x >= 3 && z <= -3) {
        return 'forest';
      }
      
      // Border regions
      if (x >= 3 && Math.abs(z) < 3) {
        return 'riverbank';
      } else if (x <= -3 && Math.abs(z) < 3) {
        return 'swamp';
      } else if (Math.abs(x) < 3 && z >= 3) {
        return 'cactus';
      } else if (Math.abs(x) < 3 && z <= -3) {
        return 'mushroom';
      }
      
      // Should never reach here, but just in case
      return 'plains';
    };
    
    // Create varying heights for terrain
    const getHeight = (x: number, z: number, biome: string): number => {
      let baseHeight = platformHeight;
      
      // Add some noise based on coordinates
      const noiseVal = (Math.sin(x * 0.3) + Math.cos(z * 0.3)) * 0.5;
      
      // Different height modifiers per biome
      if (biome === 'mountains') {
        baseHeight += Math.floor(Math.abs(x + z) * 0.5) + Math.floor(noiseVal * 3);
      } else if (biome === 'plains') {
        baseHeight += Math.floor(noiseVal);
      } else if (biome === 'desert') {
        baseHeight += Math.floor(Math.abs(Math.sin(x * 0.2) * Math.cos(z * 0.2) * 2));
      } else if (biome === 'forest') {
        baseHeight += Math.floor(noiseVal * 1.5);
      } else if (biome === 'riverbank') {
        baseHeight -= 1; // Slightly lower for water
      } else if (biome === 'swamp') {
        baseHeight -= 1; // Slightly lower for swamp
      }
      
      return baseHeight;
    };
    
    // Generate the base terrain
    for (let x = -platformSize; x <= platformSize; x++) {
      for (let z = -platformSize; z <= platformSize; z++) {
        const biome = getBiome(x, z);
        const height = getHeight(x, z, biome);
        
        // Generate column from deep underground to surface
        for (let y = height - 10; y <= height; y++) {
          const blockType = getBlockType(height, y, biome, waterLevel);
          blocks[`${x},${y},${z}`] = blockType;
        }
        
        // Add water or features above the surface based on biome
        if (biome === 'riverbank' || biome === 'swamp') {
          if (blocks[`${x},${height},${z}`] !== 'water') {
            blocks[`${x},${height+1},${z}`] = 'water';
          }
        } else if (biome === 'forest' && Math.random() < 0.15) {
          // Add trees in forest biome
          const treeHeight = 3 + Math.floor(Math.random() * 2);
          
          // Tree trunk
          for (let y = 1; y <= treeHeight; y++) {
            blocks[`${x},${height+y},${z}`] = 'wood';
          }
          
          // Tree leaves
          for (let lx = -2; lx <= 2; lx++) {
            for (let lz = -2; lz <= 2; lz++) {
              for (let ly = 0; ly <= 2; ly++) {
                const distFromCenter = Math.abs(lx) + Math.abs(lz) + ly;
                
                if (distFromCenter <= 3) {
                  const leafX = x + lx;
                  const leafY = height + treeHeight - ly;
                  const leafZ = z + lz;
                  
                  // Don't place leaves where the trunk is
                  if (!(lx === 0 && lz === 0)) {
                    blocks[`${leafX},${leafY},${leafZ}`] = 'leaves';
                  }
                }
              }
            }
          }
        } else if (biome === 'desert' && Math.random() < 0.08) {
          // Add cacti in desert
          const cactusHeight = 1 + Math.floor(Math.random() * 2);
          for (let y = 1; y <= cactusHeight; y++) {
            blocks[`${x},${height+y},${z}`] = 'cactus';
          }
        } else if (biome === 'snow' && Math.random() < 0.1) {
          // Add ice in snow biome
          blocks[`${x},${height+1},${z}`] = Math.random() < 0.7 ? 'snow' : 'ice';
        } else if (biome === 'mushroom' && Math.random() < 0.2) {
          // Add mushrooms in mushroom biome
          blocks[`${x},${height+1},${z}`] = 'mushroom';
        } else if (biome === 'plains' && Math.random() < 0.15) {
          // Add flowers and grass in plains
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
        } else if (biome === 'cactus' && Math.random() < 0.1) {
          // Add cacti in cactus biome
          blocks[`${x},${height+1},${z}`] = 'cactus';
        }
      }
    }
    
    // Add special features
    // Add a crafting table at the center
    blocks[`0,${platformHeight+1},0`] = 'craftingTable';
    
    // Add torches for lighting
    blocks[`2,${getHeight(2, 2, 'plains')+1},2`] = 'torch';
    blocks[`-2,${getHeight(-2, 2, 'plains')+1},2`] = 'torch';
    blocks[`2,${getHeight(2, -2, 'plains')+1},-2`] = 'torch';
    blocks[`-2,${getHeight(-2, -2, 'plains')+1},-2`] = 'torch';
    
    // Add some valuable ores for the player to find
    blocks[`4,${platformHeight-5},4`] = 'diamond';
    blocks[`-4,${platformHeight-6},-4`] = 'emerald';
    blocks[`-3,${platformHeight-4},5`] = 'ironOre';
    blocks[`5,${platformHeight-4},-3`] = 'goldOre';
    
    // Add some small features of the other block types so player can see examples
    blocks[`3,${platformHeight+1},0`] = 'gravel';
    blocks[`-3,${platformHeight+1},0`] = 'clay';
    blocks[`0,${platformHeight+1},3`] = 'pumpkin';
    blocks[`0,${platformHeight+1},-3`] = 'melon';
    
    // Add a lava pool in one area
    blocks[`-5,${platformHeight+1},-5`] = 'lava';
    blocks[`-5,${platformHeight+1},-6`] = 'lava';
    blocks[`-6,${platformHeight+1},-5`] = 'lava';
    blocks[`-6,${platformHeight+1},-6`] = 'obsidian';
    
    console.log(`Created enhanced terrain with ${Object.keys(blocks).length} blocks across multiple biomes`);
    return { generatedChunks: chunks, generatedBlocks: blocks };
    
  } catch (error) {
    console.error("Failed to generate enhanced terrain:", error);
    
    // Absolute minimum fallback - just a few blocks
    const fallbackChunks: Record<string, { x: number, z: number }> = { 
      '0,0': { x: 0, z: 0 } 
    };
    const fallbackBlocks: Record<string, BlockType> = {};
    
    // Just create a 3x3 platform
    for (let x = -1; x <= 1; x++) {
      for (let z = -1; z <= 1; z++) {
        fallbackBlocks[`${x},15,${z}`] = 'grass';
      }
    }
    
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
