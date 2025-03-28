import { create } from "zustand";
import { generateTerrain } from "../terrain";
import { spawnCreatures, CreatureType } from "../creatures";
import { BlockType, isBlockSolid } from "../blocks";

// Controls enum
export enum Controls {
  forward = 'forward',
  backward = 'backward',
  left = 'left',
  right = 'right',
  jump = 'jump',
  mine = 'mine',
  place = 'place',
  inventory = 'inventory',
  sprint = 'sprint'
}

// Weather types
export type WeatherType = 'clear' | 'cloudy' | 'rain' | 'snow';

// Inventory item
export interface InventoryItem {
  type: BlockType;
  count: number;
}

// Enhanced Creature
export interface Creature {
  id: string;
  type: CreatureType;
  position: { x: number; y: number; z: number };
  rotation: { y: number };
  health: number;
  maxHealth: number;
  targetPosition?: { x: number; y: number; z: number };
  
  // Enhanced states and behaviors
  state: 'idle' | 'wandering' | 'attacking' | 'fleeing' | 'grazing' | 'sleeping' | 'hunting' | 'following' | 'defending';
  lastStateChange: number;
  hostility: 'passive' | 'neutral' | 'hostile';
  
  // AI properties
  mood: 'calm' | 'alert' | 'aggressive' | 'afraid' | 'playful';
  hunger: number; // 0-100
  tiredness: number; // 0-100
  flockId?: string; // For group behaviors
  leader?: boolean; // Is this creature a leader of its group
  memories: {
    lastPlayerContact?: number;
    lastAttackedBy?: string;
    favoriteLocations?: { x: number; y: number; z: number }[];
    knownThreats?: string[];
  };
  
  // Animation properties
  animationState: 'idle' | 'walk' | 'run' | 'attack' | 'hurt' | 'eat' | 'sleep';
  animationProgress: number;
  animationSpeed: number;
}

// Game state interface
interface VoxelGameState {
  // World
  chunks: Record<string, boolean>; // "x,z" -> exists
  blocks: Record<string, BlockType>; // "x,y,z" -> block type
  
  // Player
  playerPosition: { x: number; y: number; z: number };
  playerVelocity: { x: number; y: number; z: number };
  playerIsOnGround: boolean;
  playerHealth: number;
  playerHunger: number;
  
  // Inventory
  inventory: InventoryItem[];
  selectedBlock: BlockType;
  
  // Environment
  timeOfDay: number; // 0-1, where 0 is midnight, 0.5 is noon
  weather: WeatherType;
  
  // Creatures
  creatures: Record<string, Creature>;
  
  // Actions
  setPlayerPosition: (position: { x: number; y: number; z: number }) => void;
  setPlayerVelocity: (velocity: { x: number; y: number; z: number }) => void;
  setPlayerIsOnGround: (isOnGround: boolean) => void;
  setChunks: (chunks: Record<string, boolean>) => void;
  setBlocks: (blocks: Record<string, BlockType>) => void;
  addBlock: (x: number, y: number, z: number, type: BlockType) => void;
  removeBlock: (x: number, y: number, z: number) => void;
  placeBlock: (x: number, y: number, z: number, type: BlockType) => void;
  setSelectedBlock: (type: BlockType) => void;
  incrementTime: () => void;
  setWeather: (weather: WeatherType) => void;
  addToInventory: (type: BlockType, count: number) => void;
  removeFromInventory: (type: BlockType, count: number) => boolean;
  craftItem: (outputType: BlockType, outputCount: number, ingredients: { type: BlockType, count: number }[]) => void;
  updateCreatures: () => void;
}

export const useVoxelGame = create<VoxelGameState>((set, get) => ({
  // Initial world state
  chunks: {},
  blocks: {},
  
  // Initial player state
  playerPosition: { x: 0, y: 50, z: 0 }, // Start high enough to guarantee above terrain
  playerVelocity: { x: 0, y: 0, z: 0 },
  playerIsOnGround: false,
  playerHealth: 100,
  playerHunger: 100,
  
  // Initial inventory
  inventory: [
    { type: 'dirt', count: 64 },
    { type: 'stone', count: 32 },
    { type: 'wood', count: 16 },
    { type: 'log', count: 8 },
    { type: 'sand', count: 16 }
  ],
  selectedBlock: 'dirt',
  
  // Initial environment
  timeOfDay: 0.3, // Start in morning
  weather: 'clear',
  
  // Initial creatures
  creatures: {},
  
  // Actions
  setPlayerPosition: (position) => set({ playerPosition: position }),
  
  setPlayerVelocity: (velocity) => set({ playerVelocity: velocity }),
  
  setPlayerIsOnGround: (isOnGround) => set({ playerIsOnGround: isOnGround }),
  
  setChunks: (chunks) => {
    set({ chunks });
    // Spawn creatures after chunks are set
    set((state) => ({
      creatures: {
        ...state.creatures,
        ...spawnCreatures(chunks, state.blocks)
      }
    }));
  },
  
  setBlocks: (blocks) => set({ blocks }),
  
  addBlock: (x, y, z, type) => {
    set((state) => {
      const key = `${x},${y},${z}`;
      const newBlocks = { ...state.blocks };
      newBlocks[key] = type;
      
      // Ensure chunk exists for this block
      const chunkX = Math.floor(x / 16);
      const chunkZ = Math.floor(z / 16);
      const chunkKey = `${chunkX},${chunkZ}`;
      
      const newChunks = { ...state.chunks };
      if (!newChunks[chunkKey]) {
        newChunks[chunkKey] = true;
      }
      
      return { blocks: newBlocks, chunks: newChunks };
    });
  },
  
  removeBlock: (x, y, z) => {
    set((state) => {
      const key = `${x},${y},${z}`;
      
      // If block doesn't exist or is already air, do nothing
      if (!state.blocks[key] || state.blocks[key] === 'air') {
        return {};
      }
      
      // Add the block to inventory
      const removedType = state.blocks[key];
      if (isBlockSolid(removedType)) {
        // Don't add air or liquids to inventory
        state.addToInventory(removedType, 1);
      }
      
      // Update blocks
      const newBlocks = { ...state.blocks };
      newBlocks[key] = 'air';
      
      return { blocks: newBlocks };
    });
  },
  
  placeBlock: (x, y, z, type) => {
    set((state) => {
      // Check if player has this block in inventory
      const inventoryItem = state.inventory.find(item => item.type === type);
      if (!inventoryItem || inventoryItem.count <= 0) {
        return {};
      }
      
      // Remove from inventory
      state.removeFromInventory(type, 1);
      
      // Add block to world
      const key = `${x},${y},${z}`;
      const newBlocks = { ...state.blocks };
      newBlocks[key] = type;
      
      return { blocks: newBlocks };
    });
  },
  
  setSelectedBlock: (type) => set({ selectedBlock: type }),
  
  incrementTime: () => {
    set((state) => {
      // Time cycles between 0 and 1 (representing 24 hours)
      const newTime = (state.timeOfDay + 0.005) % 1;
      
      // Randomly change weather (small chance)
      let newWeather = state.weather;
      if (Math.random() < 0.01) {
        const weathers: WeatherType[] = ['clear', 'cloudy', 'rain', 'snow'];
        newWeather = weathers[Math.floor(Math.random() * weathers.length)];
      }
      
      return { timeOfDay: newTime, weather: newWeather };
    });
  },
  
  setWeather: (weather) => set({ weather }),
  
  addToInventory: (type, count) => {
    set((state) => {
      const newInventory = [...state.inventory];
      
      // Find if this item already exists in inventory
      const existingIndex = newInventory.findIndex(item => item.type === type);
      
      if (existingIndex >= 0) {
        // Update existing item
        newInventory[existingIndex] = {
          ...newInventory[existingIndex],
          count: newInventory[existingIndex].count + count
        };
      } else {
        // Add new item
        newInventory.push({ type, count });
      }
      
      return { inventory: newInventory };
    });
  },
  
  removeFromInventory: (type, count) => {
    const state = get();
    const existingIndex = state.inventory.findIndex(item => item.type === type);
    
    if (existingIndex === -1 || state.inventory[existingIndex].count < count) {
      return false; // Not enough items
    }
    
    set((state) => {
      const newInventory = [...state.inventory];
      
      newInventory[existingIndex] = {
        ...newInventory[existingIndex],
        count: newInventory[existingIndex].count - count
      };
      
      // Remove item if count reaches 0
      if (newInventory[existingIndex].count <= 0) {
        newInventory.splice(existingIndex, 1);
      }
      
      return { inventory: newInventory };
    });
    
    return true;
  },
  
  craftItem: (outputType, outputCount, ingredients) => {
    set((state) => {
      // Check if all ingredients are available
      const canCraft = ingredients.every(ingredient => {
        const inventoryItem = state.inventory.find(item => item.type === ingredient.type);
        return inventoryItem && inventoryItem.count >= ingredient.count;
      });
      
      if (!canCraft) {
        return {};
      }
      
      // Remove ingredients from inventory
      ingredients.forEach(ingredient => {
        state.removeFromInventory(ingredient.type, ingredient.count);
      });
      
      // Add crafted item to inventory
      state.addToInventory(outputType, outputCount);
      
      return {};
    });
  },
  
  updateCreatures: () => {
    set((state) => {
      const newCreatures = { ...state.creatures };
      const currentTime = Date.now();
      
      // Update each creature
      Object.values(newCreatures).forEach(creature => {
        // Don't update too frequently
        if (currentTime - creature.lastStateChange < 2000) {
          return;
        }
        
        // Chance to change state
        if (Math.random() < 0.3) {
          // Determine new state based on creature type and hostility
          if (creature.hostility === 'hostile') {
            // Hostile creatures attack or wander
            creature.state = Math.random() < 0.7 ? 'wandering' : 'idle';
          } else if (creature.hostility === 'neutral') {
            // Neutral creatures mostly idle/wander
            creature.state = Math.random() < 0.8 ? 'wandering' : 'idle';
          } else {
            // Passive creatures mostly idle
            creature.state = Math.random() < 0.3 ? 'wandering' : 'idle';
          }
          
          creature.lastStateChange = currentTime;
          
          // Set target position for wandering
          if (creature.state === 'wandering') {
            const wanderDistance = Math.random() * 5 + 2;
            const wanderAngle = Math.random() * Math.PI * 2;
            
            creature.targetPosition = {
              x: creature.position.x + Math.cos(wanderAngle) * wanderDistance,
              y: creature.position.y,
              z: creature.position.z + Math.sin(wanderAngle) * wanderDistance
            };
            
            // Update rotation to face movement direction
            creature.rotation.y = wanderAngle;
          }
        }
        
        // Move creature if wandering
        if (creature.state === 'wandering' && creature.targetPosition) {
          const speed = 0.05;
          const dx = creature.targetPosition.x - creature.position.x;
          const dz = creature.targetPosition.z - creature.position.z;
          const distance = Math.sqrt(dx * dx + dz * dz);
          
          if (distance > 0.1) {
            // Move towards target
            creature.position.x += (dx / distance) * speed;
            creature.position.z += (dz / distance) * speed;
            
            // Check if we need to adjust Y position (find ground)
            let foundGround = false;
            for (let y = Math.floor(creature.position.y); y > Math.floor(creature.position.y) - 5; y--) {
              const blockKey = `${Math.floor(creature.position.x)},${y},${Math.floor(creature.position.z)}`;
              if (state.blocks[blockKey] && isBlockSolid(state.blocks[blockKey])) {
                creature.position.y = y + 1;
                foundGround = true;
                break;
              }
            }
            
            // If no ground found, don't move horizontally
            if (!foundGround) {
              creature.position.x -= (dx / distance) * speed;
              creature.position.z -= (dz / distance) * speed;
            }
          } else {
            // Reached target
            creature.state = 'idle';
            creature.lastStateChange = currentTime;
          }
        }
      });
      
      return { creatures: newCreatures };
    });
  }
}));
