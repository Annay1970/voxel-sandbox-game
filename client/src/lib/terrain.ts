import { BlockType } from './blocks';
import { CHUNK_SIZE } from '../components/game/Chunk';

// Minimal terrain but with visual interest
export function generateTerrain() {
  console.log("Generating visually appealing minimal terrain...");
  
  try {
    // Just one chunk for performance
    const chunks: Record<string, { x: number, z: number }> = {
      '0,0': { x: 0, z: 0 }
    };
    
    const blocks: Record<string, BlockType> = {};
    
    // Small platform but with more visual interest
    const platformSize = 8;
    const platformHeight = 15;
    
    // Create a small platform at the origin
    for (let x = -platformSize; x <= platformSize; x++) {
      for (let z = -platformSize; z <= platformSize; z++) {
        // Add dirt underneath - just one layer to minimize block count
        blocks[`${x},${platformHeight-1},${z}`] = 'dirt';
        
        // Main surface with grass
        blocks[`${x},${platformHeight},${z}`] = 'grass';
        
        // Add some variance to edges with different blocks
        const distanceFromCenter = Math.abs(x) + Math.abs(z);
        
        // Create a small sandy beach on one corner
        if (x > 4 && z > 4 && distanceFromCenter > 10) {
          blocks[`${x},${platformHeight},${z}`] = 'sand';
        }
        
        // Create a small stone area on another corner
        if (x < -4 && z < -4 && distanceFromCenter > 10) {
          blocks[`${x},${platformHeight},${z}`] = 'stone';
        }
      }
    }
    
    // Add a few feature blocks for visual interest
    // Small tree in the center
    blocks[`0,${platformHeight+1},0`] = 'wood';
    blocks[`0,${platformHeight+2},0`] = 'wood';
    blocks[`0,${platformHeight+3},0`] = 'wood';
    blocks[`0,${platformHeight+4},0`] = 'leaves';
    blocks[`1,${platformHeight+3},0`] = 'leaves';
    blocks[`-1,${platformHeight+3},0`] = 'leaves';
    blocks[`0,${platformHeight+3},1`] = 'leaves';
    blocks[`0,${platformHeight+3},-1`] = 'leaves';
    
    // Small "crafting table" on platform
    blocks[`3,${platformHeight+1},3`] = 'wood';
    
    // Stone block features
    blocks[`-3,${platformHeight+1},-3`] = 'stone';
    
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
