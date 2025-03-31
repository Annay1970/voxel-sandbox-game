import { BlockType } from './blocks';
import { CHUNK_SIZE } from '../components/game/Chunk';

// Emergency light-weight terrain generation function
export function generateTerrain() {
  console.log("Generating emergency simplified terrain...");
  
  try {
    // MINIMUM terrain parameters for guaranteed performance
    const WORLD_SIZE = 2; // Tiny world size (2 chunks radius = just 25 chunks total)
    const WATER_LEVEL = 8;
    const BASE_HEIGHT = 15;
    
    // Data structures to store generated world
    const chunks: Record<string, { x: number, z: number }> = {};
    const blocks: Record<string, BlockType> = {};
    
    // Generate just a small area around the origin
    const chunkRadius = Math.floor(WORLD_SIZE / 2);
    
    console.log(`Generating ${(2 * chunkRadius + 1) * (2 * chunkRadius + 1)} chunks...`);
  
    for (let cx = -chunkRadius; cx <= chunkRadius; cx++) {
      for (let cz = -chunkRadius; cz <= chunkRadius; cz++) {
        // Skip distant chunks for a circular-ish world (further optimization)
        if (cx*cx + cz*cz > chunkRadius*chunkRadius) continue;
        
        // Register chunk
        const chunkKey = `${cx},${cz}`;
        chunks[chunkKey] = { x: cx, z: cz };
      
        // Generate all blocks in this chunk with a simplified flat terrain
        for (let x = 0; x < CHUNK_SIZE; x++) {
          for (let z = 0; z < CHUNK_SIZE; z++) {
            // World coordinates
            const worldX = cx * CHUNK_SIZE + x;
            const worldZ = cz * CHUNK_SIZE + z;
            
            // Super simplified terrain - just calculate distance from center
            const distFromCenter = Math.sqrt(worldX*worldX + worldZ*worldZ);
            
            // Simple height formula - higher in the center, lower at edges
            let height = BASE_HEIGHT;
            
            // Very slight variation based on distance from center
            if (distFromCenter < 10) {
              height += 2; // Small hill in the center
            } else if (distFromCenter > 30) {
              height -= 2; // Small depression at the edges
            }
            
            // Just place the necessary blocks - no noise calculations
            
            // Base block
            blocks[`${worldX},${height-2},${worldZ}`] = 'stone';
            
            // Middle layer
            blocks[`${worldX},${height-1},${worldZ}`] = 'dirt';
            
            // Top layer - grass everywhere for simplicity
            blocks[`${worldX},${height},${worldZ}`] = 'grass';
            
            // Add water at the edges for visual interest
            if (distFromCenter > 40 && height < WATER_LEVEL) {
              blocks[`${worldX},${WATER_LEVEL},${worldZ}`] = 'water';
            }
            
            // Almost no trees - just a couple in the center for decoration
            if (distFromCenter < 5 && Math.random() < 0.1) {
              // One simple tree
              blocks[`${worldX},${height+1},${worldZ}`] = 'wood';
              blocks[`${worldX},${height+2},${worldZ}`] = 'wood';
              blocks[`${worldX},${height+3},${worldZ}`] = 'wood';
              
              // Just a few leaves on top
              blocks[`${worldX},${height+4},${worldZ}`] = 'leaves';
              blocks[`${worldX+1},${height+3},${worldZ}`] = 'leaves';
              blocks[`${worldX-1},${height+3},${worldZ}`] = 'leaves';
              blocks[`${worldX},${height+3},${worldZ+1}`] = 'leaves';
              blocks[`${worldX},${height+3},${worldZ-1}`] = 'leaves';
            }
          }
        }
      }
    }
  
    console.log(`Generated ${Object.keys(chunks).length} chunks with ${Object.keys(blocks).length} blocks`);
    return { generatedChunks: chunks, generatedBlocks: blocks };
    
  } catch (error) {
    console.error("Failed to generate terrain:", error);
    
    // Create an absolute minimum fallback terrain - just a small flat platform
    const fallbackChunks: Record<string, { x: number, z: number }> = { 
      '0,0': { x: 0, z: 0 } 
    };
    const fallbackBlocks: Record<string, BlockType> = {};
    
    // Create a tiny 8x8 flat platform at y=15
    for (let x = -4; x < 4; x++) {
      for (let z = -4; z < 4; z++) {
        // Just three layers
        fallbackBlocks[`${x},13,${z}`] = 'stone';
        fallbackBlocks[`${x},14,${z}`] = 'dirt';
        fallbackBlocks[`${x},15,${z}`] = 'grass';
      }
    }
    
    console.log("Generated emergency fallback terrain");
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
