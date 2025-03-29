import { create } from 'zustand';
import { BlockType } from '../blocks';

// Define controls for keyboard/gamepad input
export enum Controls {
  forward = 'forward',
  back = 'back',
  left = 'left',
  right = 'right',
  jump = 'jump',
  sprint = 'sprint',
  attack = 'attack',
  place = 'place'
}

export interface InventoryItem {
  type: BlockType;
  count: number;
}

// Define weather types
export type WeatherType = 'clear' | 'cloudy' | 'rain' | 'storm';

// Define creature interface based on World.tsx
export interface Creature {
  id: string;
  type: string;
  position: { x: number, y: number, z: number };
  rotation: { y: number };
  state: string;
  mood: string;
  animationState: string;
  animationSpeed: number;
  animationProgress: number;
  flockId?: string;
  leader: boolean;
  targetPosition?: { x: number, y: number, z: number } | null;
}

export interface VoxelGameState {
  // Block data
  blocks: Record<string, BlockType>; // Format: "x,y,z" -> BlockType
  
  // Chunk data
  chunks: Record<string, { x: number, z: number }>;
  
  // Creatures
  creatures: Record<string, Creature>;
  
  // Player interaction
  selectedBlock: [number, number, number] | null; // Currently targeted block
  
  // Inventory
  inventory: InventoryItem[];
  selectedInventorySlot: number;
  
  // World state
  timeOfDay: number; // 0.0 to 1.0, where 0.0 is midnight, 0.5 is noon
  weather: WeatherType;
  
  // Actions
  placeBlock: (x: number, y: number, z: number, type: BlockType) => void;
  removeBlock: (x: number, y: number, z: number) => void;
  setSelectedBlock: (coords: [number, number, number] | null) => void;
  setSelectedInventorySlot: (slot: number) => void;
  addToInventory: (type: BlockType, count: number) => void;
  removeFromInventory: (type: BlockType, count: number) => void;
  addBlock: (x: number, y: number, z: number, type: BlockType) => void;
  
  // Time and weather
  incrementTime: () => void;
  
  // World generation and management
  generateChunk: (chunkX: number, chunkZ: number) => void;
  setChunks: (chunks: Record<string, { x: number, z: number }>) => void;
  setBlocks: (blocks: Record<string, BlockType>) => void;
  
  // Creature management
  updateCreatures: () => void;
}

export const useVoxelGame = create<VoxelGameState>((set, get) => ({
  // Block data
  blocks: {},
  
  // Chunk data
  chunks: {},
  
  // Creatures
  creatures: {
    'cow1': {
      id: 'cow1',
      type: 'cow',
      position: { x: 5, y: 5, z: 5 },
      rotation: { y: 0 },
      state: 'idle',
      mood: 'calm',
      animationState: 'idle',
      animationSpeed: 1,
      animationProgress: 0,
      leader: false
    },
    'sheep1': {
      id: 'sheep1',
      type: 'sheep',
      position: { x: 8, y: 5, z: 8 },
      rotation: { y: 0 },
      state: 'idle',
      mood: 'calm',
      animationState: 'idle',
      animationSpeed: 1,
      animationProgress: 0,
      leader: false
    },
    'pig1': {
      id: 'pig1',
      type: 'pig',
      position: { x: 12, y: 5, z: 12 },
      rotation: { y: 0 },
      state: 'idle',
      mood: 'calm',
      animationState: 'idle',
      animationSpeed: 1,
      animationProgress: 0,
      leader: false
    },
    'zombie1': {
      id: 'zombie1',
      type: 'zombie',
      position: { x: -5, y: 5, z: -5 },
      rotation: { y: 0 },
      state: 'idle',
      mood: 'aggressive',
      animationState: 'idle',
      animationSpeed: 1,
      animationProgress: 0,
      leader: false
    },
    'chicken1': {
      id: 'chicken1',
      type: 'chicken',
      position: { x: 15, y: 5, z: 3 },
      rotation: { y: 0 },
      state: 'idle',
      mood: 'calm',
      animationState: 'idle',
      animationSpeed: 1,
      animationProgress: 0,
      leader: false
    },
    'bee1': {
      id: 'bee1',
      type: 'bee',
      position: { x: 10, y: 8, z: 10 },
      rotation: { y: 0 },
      state: 'flying',
      mood: 'calm',
      animationState: 'flying',
      animationSpeed: 2,
      animationProgress: 0,
      leader: false
    }
  },
  
  // Player interaction
  selectedBlock: null,
  
  // Inventory - start with some basic blocks
  inventory: [
    { type: 'grass', count: 64 },
    { type: 'dirt', count: 64 },
    { type: 'stone', count: 64 },
    { type: 'wood', count: 32 },
    { type: 'leaves', count: 32 },
    { type: 'sand', count: 32 },
    { type: 'water', count: 16 },
    { type: 'torch', count: 16 },
    { type: 'log', count: 16 },
  ],
  selectedInventorySlot: 0,
  
  // World state
  timeOfDay: 0.5, // Start at noon (0.5)
  weather: 'clear', // Start with clear weather
  
  // Actions
  placeBlock: (x, y, z, type) => {
    set((state) => {
      // Check if we have enough of this block type in inventory
      const inventorySlot = state.selectedInventorySlot;
      const inventoryItem = state.inventory[inventorySlot];
      
      if (inventoryItem.type !== type || inventoryItem.count <= 0) {
        console.log("Cannot place block - not enough in inventory");
        return state;
      }
      
      // Update inventory
      const updatedInventory = [...state.inventory];
      updatedInventory[inventorySlot] = {
        ...inventoryItem,
        count: inventoryItem.count - 1,
      };
      
      // Place the block
      return {
        blocks: {
          ...state.blocks,
          [`${x},${y},${z}`]: type,
        },
        inventory: updatedInventory,
        timeOfDay: state.timeOfDay,
        weather: state.weather,
      };
    });
  },
  
  removeBlock: (x, y, z) => {
    set((state) => {
      const blockKey = `${x},${y},${z}`;
      const blockType = state.blocks[blockKey];
      
      if (!blockType || blockType === 'air') {
        return state;
      }
      
      // Create a copy of the blocks without the removed one
      const newBlocks = { ...state.blocks };
      delete newBlocks[blockKey];
      
      // Add the block to inventory
      const updatedInventory = [...state.inventory];
      
      // Find if we already have this block type
      const existingIndex = updatedInventory.findIndex(
        (item) => item.type === blockType
      );
      
      if (existingIndex >= 0) {
        // Add to existing stack
        updatedInventory[existingIndex] = {
          ...updatedInventory[existingIndex],
          count: updatedInventory[existingIndex].count + 1,
        };
      } else {
        // Add new inventory slot if there's space
        if (updatedInventory.length < 36) {
          updatedInventory.push({ type: blockType, count: 1 });
        }
      }
      
      return {
        blocks: newBlocks,
        inventory: updatedInventory,
        timeOfDay: state.timeOfDay,
        weather: state.weather,
      };
    });
  },
  
  setSelectedBlock: (coords) => {
    set({ selectedBlock: coords });
  },
  
  setSelectedInventorySlot: (slot) => {
    set({ selectedInventorySlot: slot });
  },
  
  addToInventory: (type, count) => {
    set((state) => {
      const updatedInventory = [...state.inventory];
      
      // Find if we already have this block type
      const existingIndex = updatedInventory.findIndex(
        (item) => item.type === type
      );
      
      if (existingIndex >= 0) {
        // Add to existing stack
        updatedInventory[existingIndex] = {
          ...updatedInventory[existingIndex],
          count: updatedInventory[existingIndex].count + count,
        };
      } else {
        // Add new inventory slot if there's space
        if (updatedInventory.length < 36) {
          updatedInventory.push({ type, count });
        }
      }
      
      return { 
        inventory: updatedInventory,
        timeOfDay: state.timeOfDay,
        weather: state.weather
      };
    });
  },
  
  removeFromInventory: (type, count) => {
    set((state) => {
      const updatedInventory = [...state.inventory];
      
      // Find if we have this block type
      const existingIndex = updatedInventory.findIndex(
        (item) => item.type === type
      );
      
      if (existingIndex >= 0) {
        // Remove from existing stack
        const newCount = updatedInventory[existingIndex].count - count;
        
        if (newCount <= 0) {
          // Remove slot if count is 0 or negative
          updatedInventory.splice(existingIndex, 1);
        } else {
          // Update count
          updatedInventory[existingIndex] = {
            ...updatedInventory[existingIndex],
            count: newCount,
          };
        }
      }
      
      return { 
        inventory: updatedInventory,
        timeOfDay: state.timeOfDay,
        weather: state.weather
      };
    });
  },
  
  // World generation
  generateChunk: (chunkX, chunkZ) => {
    set((state) => {
      const newBlocks = { ...state.blocks };
      
      // Simple flat chunk generation
      const chunkSize = 16;
      const seaLevel = 5;
      
      for (let x = 0; x < chunkSize; x++) {
        for (let z = 0; z < chunkSize; z++) {
          const worldX = chunkX * chunkSize + x;
          const worldZ = chunkZ * chunkSize + z;
          
          // Simple terrain height
          const height = 
            Math.floor(
              Math.sin(worldX * 0.1) * 2 + 
              Math.cos(worldZ * 0.1) * 2 + 
              seaLevel
            );
          
          // Generate ground blocks
          for (let y = 0; y < 30; y++) {
            let blockType: BlockType = 'air';
            
            if (y < height - 3) {
              blockType = 'stone';
            } else if (y < height - 1) {
              blockType = 'dirt';
            } else if (y === height - 1) {
              blockType = 'grass';
            } else if (y < seaLevel) {
              blockType = 'water';
            }
            
            if (blockType !== 'air') {
              newBlocks[`${worldX},${y},${worldZ}`] = blockType;
            }
          }
          
          // Randomly add trees
          if (
            Math.random() < 0.02 && // 2% chance
            height > seaLevel && // Only on land
            height < 20 // Not too high
          ) {
            // Tree trunk
            const trunkHeight = Math.floor(Math.random() * 3) + 4; // 4-6 blocks tall
            for (let y = height; y < height + trunkHeight; y++) {
              newBlocks[`${worldX},${y},${worldZ}`] = 'log';
            }
            
            // Tree leaves
            const leafRadius = 2;
            for (let lx = -leafRadius; lx <= leafRadius; lx++) {
              for (let lz = -leafRadius; lz <= leafRadius; lz++) {
                for (let ly = -1; ly <= 1; ly++) {
                  // Skip corners for a more rounded shape
                  if (
                    Math.abs(lx) === leafRadius &&
                    Math.abs(lz) === leafRadius
                  )
                    continue;
                  
                  const leafX = worldX + lx;
                  const leafY = height + trunkHeight + ly;
                  const leafZ = worldZ + lz;
                  
                  // Skip if there's already a block there
                  const blockKey = `${leafX},${leafY},${leafZ}`;
                  if (newBlocks[blockKey]) continue;
                  
                  newBlocks[blockKey] = 'leaves';
                }
              }
            }
            
            // Top leaf
            newBlocks[`${worldX},${height + trunkHeight + 1},${worldZ}`] = 'leaves';
          }
        }
      }
      
      return { 
        blocks: newBlocks,
        timeOfDay: state.timeOfDay,
        weather: state.weather
      };
    });
  },
  // Add a single block
  addBlock: (x, y, z, type) => {
    set((state) => {
      return {
        ...state,
        blocks: {
          ...state.blocks,
          [`${x},${y},${z}`]: type,
        }
      };
    });
  },

  // Set blocks in bulk
  setBlocks: (blocks) => {
    set((state) => {
      return {
        ...state,
        blocks: blocks
      };
    });
  },

  // Set chunks in bulk
  setChunks: (chunks) => {
    set((state) => {
      return {
        ...state,
        chunks: chunks
      };
    });
  },

  // Increment time of day
  incrementTime: () => {
    set((state) => {
      // Increment by a small amount (day/night cycle)
      const newTimeOfDay = (state.timeOfDay + 0.001) % 1;
      
      // Randomly change weather (very low chance)
      let newWeather = state.weather;
      if (Math.random() < 0.005) {
        const weathers: WeatherType[] = ['clear', 'cloudy', 'rain', 'storm'];
        newWeather = weathers[Math.floor(Math.random() * weathers.length)];
      }
      
      return {
        ...state,
        timeOfDay: newTimeOfDay,
        weather: newWeather
      };
    });
  },

  // Update creatures
  updateCreatures: () => {
    set((state) => {
      const updatedCreatures = { ...state.creatures };
      
      // Update each creature
      Object.values(updatedCreatures).forEach(creature => {
        // Simple random movement
        if (Math.random() < 0.1) {
          const moveX = (Math.random() - 0.5) * 0.2;
          const moveZ = (Math.random() - 0.5) * 0.2;
          
          // Update position
          creature.position.x += moveX;
          creature.position.z += moveZ;
          
          // Update rotation based on movement direction
          if (Math.abs(moveX) > 0.01 || Math.abs(moveZ) > 0.01) {
            creature.rotation.y = Math.atan2(moveX, moveZ);
          }
        }
        
        // Randomly change mood
        if (Math.random() < 0.01) {
          const moods = ['calm', 'playful', 'afraid'];
          // Zombies are always aggressive
          if (creature.type === 'zombie' || creature.type === 'skeleton') {
            creature.mood = 'aggressive';
          } else {
            creature.mood = moods[Math.floor(Math.random() * moods.length)];
          }
        }
        
        // Update animation progress
        creature.animationProgress = (creature.animationProgress + 0.01 * creature.animationSpeed) % 1;
      });
      
      return {
        ...state,
        creatures: updatedCreatures
      };
    });
  }
}));