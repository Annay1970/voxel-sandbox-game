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

// Camera mode types
export type CameraMode = 'first' | 'third';

export interface PlayerState {
  position: [number, number, number];
  rotation: [number, number, number];
  velocity: [number, number, number];
  onGround: boolean;
  health: number;
  maxHealth: number;
  hunger: number;
  maxHunger: number;
  oxygen: number;
  maxOxygen: number;
  experience: number;
  level: number;
  flying: boolean;
  swimming: boolean;
  cameraMode: CameraMode;
  canJump: boolean;
}

export interface CraftingRecipe {
  output: {
    type: BlockType;
    count: number;
  };
  input: Record<string, number>; // type -> count
  requiresCraftingTable: boolean;
}

export interface VoxelGameState {
  // Block data
  blocks: Record<string, BlockType>; // Format: "x,y,z" -> BlockType
  
  // Chunk data
  chunks: Record<string, { x: number, z: number }>;
  
  // Creatures
  creatures: Record<string, Creature>;
  
  // Player state
  player: PlayerState;
  isInventoryOpen: boolean;
  isCraftingOpen: boolean;
  
  // Player interaction
  selectedBlock: [number, number, number] | null; // Currently targeted block
  
  // Inventory
  inventory: InventoryItem[];
  selectedInventorySlot: number;
  
  // Crafting
  craftingRecipes: CraftingRecipe[];
  
  // World state
  timeOfDay: number; // 0.0 to 1.0, where 0.0 is midnight, 0.5 is noon
  weather: WeatherType;
  gravity: number;
  seed: number;
  
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
  setWeather: (weather: WeatherType) => void;
  
  // World generation and management
  generateChunk: (chunkX: number, chunkZ: number) => void;
  setChunks: (chunks: Record<string, { x: number, z: number }>) => void;
  setBlocks: (blocks: Record<string, BlockType>) => void;
  
  // Creature management
  updateCreatures: () => void;
  spawnCreature: (type: string, x: number, y: number, z: number) => void;
  damageCreature: (id: string, amount: number) => void;
  
  // Player state management
  updatePlayerPosition: (position: [number, number, number]) => void;
  updatePlayerRotation: (rotation: [number, number, number]) => void;
  updatePlayerVelocity: (velocity: [number, number, number]) => void;
  setPlayerOnGround: (onGround: boolean) => void;
  damagePlayer: (amount: number) => void;
  healPlayer: (amount: number) => void;
  setCameraMode: (mode: CameraMode) => void;
  toggleCameraMode: () => void;
  toggleFlying: () => void;
  toggleInventory: () => void;
  toggleCrafting: () => void;
  
  // Crafting
  craftItem: (recipeIndex: number) => boolean;
  
  // Camera control
  setCameraRotation: (x: number, y: number) => void;
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
  
  // Player state - default values
  player: {
    position: [0, 10, 0],
    rotation: [0, 0, 0],
    velocity: [0, 0, 0],
    onGround: false,
    health: 20,
    maxHealth: 20,
    hunger: 20,
    maxHunger: 20,
    oxygen: 20,
    maxOxygen: 20,
    experience: 0,
    level: 1,
    flying: false,
    swimming: false,
    cameraMode: 'first',
    canJump: true
  },
  
  // Game UI state
  isInventoryOpen: false,
  isCraftingOpen: false,
  
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
  
  // Crafting recipes
  craftingRecipes: [
    {
      output: { type: 'wood' as BlockType, count: 4 },
      input: { 'log': 1 } as Record<string, number>,
      requiresCraftingTable: false
    },
    {
      output: { type: 'stick' as BlockType, count: 4 },
      input: { 'wood': 2 } as Record<string, number>,
      requiresCraftingTable: false
    },
    {
      output: { type: 'craftingTable' as BlockType, count: 1 },
      input: { 'wood': 4 } as Record<string, number>,
      requiresCraftingTable: false
    },
    {
      output: { type: 'woodenPickaxe' as BlockType, count: 1 },
      input: { 'wood': 3, 'stick': 2 } as Record<string, number>,
      requiresCraftingTable: true
    },
    {
      output: { type: 'woodenAxe' as BlockType, count: 1 },
      input: { 'wood': 3, 'stick': 2 } as Record<string, number>,
      requiresCraftingTable: true
    },
    {
      output: { type: 'woodenShovel' as BlockType, count: 1 },
      input: { 'wood': 1, 'stick': 2 } as Record<string, number>,
      requiresCraftingTable: true
    },
    {
      output: { type: 'torch' as BlockType, count: 4 },
      input: { 'stick': 1, 'coal': 1 } as Record<string, number>,
      requiresCraftingTable: false
    }
  ],
  
  // World state
  timeOfDay: 0.5, // Start at noon (0.5)
  weather: 'clear', // Start with clear weather
  gravity: 0.05, // Gravity strength
  seed: Math.floor(Math.random() * 1000000), // Random world seed
  
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
  // Weather control
  setWeather: (weather) => {
    set({ weather });
    console.log(`Weather changed to ${weather}`);
  },
  
  // Creature management functions
  spawnCreature: (type, x, y, z) => {
    set((state) => {
      const id = `${type}${Date.now()}`;
      const newCreature: Creature = {
        id,
        type,
        position: { x, y, z },
        rotation: { y: Math.random() * Math.PI * 2 },
        state: type === 'bee' ? 'flying' : 'idle',
        mood: type.includes('zombie') || type.includes('skeleton') ? 'aggressive' : 'calm',
        animationState: type === 'bee' ? 'flying' : 'idle',
        animationSpeed: 1,
        animationProgress: 0,
        leader: false
      };
      
      return {
        ...state,
        creatures: {
          ...state.creatures,
          [id]: newCreature
        }
      };
    });
    console.log(`Spawned ${type} creature at position (${x}, ${y}, ${z})`);
  },
  
  damageCreature: (id, amount) => {
    set((state) => {
      if (!state.creatures[id]) return state;
      
      // In a real implementation, creatures would have health
      // For now, let's just remove them when damaged (simplified)
      const updatedCreatures = { ...state.creatures };
      delete updatedCreatures[id];
      
      console.log(`Creature ${id} was damaged for ${amount} and removed`);
      
      return {
        ...state,
        creatures: updatedCreatures
      };
    });
  },
  
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
  },
  
  // Player state management functions
  updatePlayerPosition: (position) => {
    set((state) => ({
      ...state,
      player: {
        ...state.player,
        position
      }
    }));
  },
  
  updatePlayerRotation: (rotation) => {
    set((state) => ({
      ...state,
      player: {
        ...state.player,
        rotation
      }
    }));
  },
  
  updatePlayerVelocity: (velocity) => {
    set((state) => ({
      ...state,
      player: {
        ...state.player,
        velocity
      }
    }));
  },
  
  setPlayerOnGround: (onGround) => {
    set((state) => ({
      ...state,
      player: {
        ...state.player,
        onGround,
        canJump: onGround // Can only jump when on ground
      }
    }));
  },
  
  damagePlayer: (amount) => {
    set((state) => {
      const newHealth = Math.max(0, state.player.health - amount);
      console.log(`Player took ${amount} damage, health: ${newHealth}/${state.player.maxHealth}`);
      
      return {
        ...state,
        player: {
          ...state.player,
          health: newHealth
        }
      };
    });
  },
  
  healPlayer: (amount) => {
    set((state) => {
      const newHealth = Math.min(state.player.maxHealth, state.player.health + amount);
      console.log(`Player healed for ${amount}, health: ${newHealth}/${state.player.maxHealth}`);
      
      return {
        ...state,
        player: {
          ...state.player,
          health: newHealth
        }
      };
    });
  },
  
  setCameraMode: (mode) => {
    set((state) => ({
      ...state,
      player: {
        ...state.player,
        cameraMode: mode
      }
    }));
    console.log(`Camera mode set to ${mode}`);
  },
  
  toggleCameraMode: () => {
    set((state) => ({
      ...state,
      player: {
        ...state.player,
        cameraMode: state.player.cameraMode === 'first' ? 'third' : 'first'
      }
    }));
    console.log("Camera mode toggled");
  },
  
  toggleFlying: () => {
    set((state) => ({
      ...state,
      player: {
        ...state.player,
        flying: !state.player.flying
      }
    }));
    console.log(`Flying mode ${get().player.flying ? 'enabled' : 'disabled'}`);
  },
  
  toggleInventory: () => {
    set((state) => ({
      ...state,
      isInventoryOpen: !state.isInventoryOpen,
      // Close crafting if inventory is closed
      isCraftingOpen: state.isInventoryOpen ? false : state.isCraftingOpen
    }));
    console.log(`Inventory ${get().isInventoryOpen ? 'opened' : 'closed'}`);
  },
  
  toggleCrafting: () => {
    set((state) => ({
      ...state,
      isCraftingOpen: !state.isCraftingOpen,
      // Open inventory if crafting is opened
      isInventoryOpen: !state.isCraftingOpen ? true : state.isInventoryOpen
    }));
    console.log(`Crafting ${get().isCraftingOpen ? 'opened' : 'closed'}`);
  },
  
  // Crafting system
  craftItem: (recipeIndex) => {
    const { craftingRecipes, inventory } = get();
    
    if (recipeIndex < 0 || recipeIndex >= craftingRecipes.length) {
      console.log("Invalid recipe index");
      return false;
    }
    
    const recipe = craftingRecipes[recipeIndex];
    
    // Check if we have all required ingredients
    for (const [itemType, count] of Object.entries(recipe.input)) {
      const hasEnough = inventory.some(item => 
        item.type === itemType && item.count >= count
      );
      
      if (!hasEnough) {
        console.log(`Missing ingredients for crafting: need ${count} of ${itemType}`);
        return false;
      }
    }
    
    // Remove ingredients from inventory
    for (const [itemType, count] of Object.entries(recipe.input)) {
      get().removeFromInventory(itemType as BlockType, count);
    }
    
    // Add crafted item to inventory
    get().addToInventory(recipe.output.type, recipe.output.count);
    
    console.log(`Crafted ${recipe.output.count}x ${recipe.output.type}`);
    return true;
  },
  
  // Camera control
  setCameraRotation: (x, y) => {
    // This is usually handled by the PlayerControls component
    // Here we only log the rotation for debugging
    console.log(`Camera rotation: x=${x}, y=${y}`);
  }
}));