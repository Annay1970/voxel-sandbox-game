import { create } from 'zustand';
import { BlockType } from '../blocks';
import { createNoise2D } from 'simplex-noise';

interface VoxelState {
  // Block storage - keys are encoded as "x,y,z" strings
  blocks: Record<string, BlockType>;
  
  // Currently selected block type for placement
  selectedBlock: BlockType;
  
  // Tool properties for the player
  activeTool: 'hand' | 'pickaxe' | 'axe' | 'shovel';
  toolLevel: number; // 0 = hand, 1 = wood, 2 = stone, etc.
  
  // Methods for manipulating blocks
  getBlock: (x: number, y: number, z: number) => BlockType | undefined;
  addBlock: (x: number, y: number, z: number, type: BlockType) => void;
  removeBlock: (x: number, y: number, z: number) => void;
  
  // Coordinate utils
  coordsToKey: (x: number, y: number, z: number) => string;
  keyToCoords: (key: string) => [number, number, number];
  
  // Map generation
  generateTerrain: (size: number) => void;
  clearAll: () => void;
  
  // Tool management
  selectBlock: (type: BlockType) => void;
  setActiveTool: (tool: 'hand' | 'pickaxe' | 'axe' | 'shovel') => void;
  setToolLevel: (level: number) => void;
}

// Create a simple noise generator
const noise2D = createNoise2D();

const useVoxelStore = create<VoxelState>((set, get) => ({
  blocks: {},
  selectedBlock: 'dirt',
  activeTool: 'hand',
  toolLevel: 0,
  
  getBlock: (x, y, z) => {
    const key = get().coordsToKey(x, y, z);
    return get().blocks[key];
  },
  
  addBlock: (x, y, z, type) => {
    const key = get().coordsToKey(x, y, z);
    set((state) => ({
      blocks: {
        ...state.blocks,
        [key]: type
      }
    }));
  },
  
  removeBlock: (x, y, z) => {
    const key = get().coordsToKey(x, y, z);
    if (get().blocks[key] !== undefined) {
      set((state) => {
        const newBlocks = { ...state.blocks };
        // Set to air instead of deleting to maintain world structure
        newBlocks[key] = 'air';
        return { blocks: newBlocks };
      });
    }
  },
  
  coordsToKey: (x, y, z) => `${Math.floor(x)},${Math.floor(y)},${Math.floor(z)}`,
  
  keyToCoords: (key) => {
    const [x, y, z] = key.split(',').map(Number);
    return [x, y, z];
  },
  
  generateTerrain: (size) => {
    set((state) => {
      const newBlocks: Record<string, BlockType> = {};
      
      // Terrain parameters
      const terrainHeight = 5;
      const waterLevel = 1;
      
      // Generate terrain with simple noise
      for (let x = -size; x < size; x++) {
        for (let z = -size; z < size; z++) {
          // Generate height using simplex noise
          const nx = x / 10;
          const nz = z / 10;
          
          // Base height value
          let height = noise2D(nx, nz);
          
          // Add some variation
          height += 0.5 * noise2D(nx * 2, nz * 2);
          
          // Scale to desired height range
          height = Math.floor((height + 1) * terrainHeight / 2);
          
          // Generate blocks from bottom to top
          for (let y = -4; y <= height; y++) {
            let blockType: BlockType = 'air';
            
            // Determine block type based on height
            if (y === height && y > waterLevel) {
              blockType = 'grass'; // Top layer is grass if above water
            } else if (y === height && y <= waterLevel) {
              blockType = 'sand'; // Sand at water level
            } else if (y >= height - 3 && y < height) {
              blockType = 'dirt'; // Dirt for a few layers below surface
            } else {
              blockType = 'stone'; // Stone for deep layers
            }
            
            // Apply water where appropriate
            if (y <= waterLevel && y > height) {
              blockType = 'water';
            }
            
            const key = state.coordsToKey(x, y, z);
            newBlocks[key] = blockType;
          }
        }
      }
      
      // Add some trees
      for (let x = -size; x < size; x += 4) {
        for (let z = -size; z < size; z += 4) {
          // Random chance to place a tree
          if (Math.random() > 0.8) {
            const nx = x + Math.floor(Math.random() * 3) - 1;
            const nz = z + Math.floor(Math.random() * 3) - 1;
            
            // Find the height at this position
            const key = state.coordsToKey(nx, 0, nz);
            const baseKey = Object.keys(newBlocks).find(k => 
              k.startsWith(`${nx},`) && k.endsWith(`,${nz}`) && 
              newBlocks[k] === 'grass'
            );
            
            if (baseKey) {
              const [tx, ty, tz] = state.keyToCoords(baseKey);
              
              // Only place trees on grass
              if (newBlocks[baseKey] === 'grass') {
                // Tree trunk
                const trunkHeight = 3 + Math.floor(Math.random() * 2);
                for (let y = 1; y <= trunkHeight; y++) {
                  const trunkKey = state.coordsToKey(tx, ty + y, tz);
                  newBlocks[trunkKey] = 'log';
                }
                
                // Tree leaves
                for (let lx = -2; lx <= 2; lx++) {
                  for (let ly = -1; ly <= 2; ly++) {
                    for (let lz = -2; lz <= 2; lz++) {
                      // Skip the very corners to make it more rounded
                      if (Math.abs(lx) === 2 && Math.abs(lz) === 2) continue;
                      
                      // Place leaves
                      const leafY = ty + trunkHeight + ly;
                      // Don't place leaves at the trunk position except at the very top
                      if (lx === 0 && lz === 0 && ly < 2) continue;
                      
                      const leafKey = state.coordsToKey(tx + lx, leafY, tz + lz);
                      newBlocks[leafKey] = 'leaves';
                    }
                  }
                }
              }
            }
          }
        }
      }
      
      return { blocks: newBlocks };
    });
  },
  
  clearAll: () => {
    set({ blocks: {} });
  },
  
  selectBlock: (type) => {
    set({ selectedBlock: type });
  },
  
  setActiveTool: (tool) => {
    set({ activeTool: tool });
  },
  
  setToolLevel: (level) => {
    set({ toolLevel: level });
  }
}));

export default useVoxelStore;