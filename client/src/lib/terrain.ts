import { BlockType } from './blocks';
import { CHUNK_SIZE } from '../components/game/Chunk';

// Critical minimal terrain - absolute minimum required
export function generateTerrain() {
  console.log("CRITICAL MODE: Generating minimal terrain...");
  
  try {
    // SUPER-MINIMAL terrain - just one chunk
    const chunks: Record<string, { x: number, z: number }> = {
      '0,0': { x: 0, z: 0 }
    };
    
    const blocks: Record<string, BlockType> = {};
    
    // Flat platform with only 20 blocks total
    const platformSize = 5;
    const platformHeight = 15;
    
    // Create a small platform at the origin
    for (let x = -platformSize; x <= platformSize; x++) {
      for (let z = -platformSize; z <= platformSize; z++) {
        // Just the surface blocks
        blocks[`${x},${platformHeight},${z}`] = 'grass';
      }
    }
    
    console.log(`Created minimal platform with ${Object.keys(blocks).length} blocks`);
    return { generatedChunks: chunks, generatedBlocks: blocks };
    
  } catch (error) {
    console.error("Failed to generate terrain:", error);
    
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
