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
export type WeatherType = 'clear' | 'cloudy' | 'rain' | 'thunderstorm' | 'fog' | 'snow';

// Define weather system interface
export interface WeatherSystem {
  currentWeather: WeatherType;
  intensity: number; // 0.0 to 1.0
  transitionProgress: number; // 0.0 to 1.0 (for smooth transitions)
  transitionTarget: WeatherType | null; // Weather we're transitioning to
  duration: number; // How long current weather will last (in game time)
  elapsedTime: number; // How long current weather has been active
  effects: {
    visibility: number; // 0.0 to 1.0
    movementModifier: number; // 0.5 to 1.5 (slower to faster)
    temperatureModifier: number; // -1.0 to 1.0 (colder to hotter)
    dangerLevel: number; // 0.0 to 1.0 (lightning strikes, etc.)
  };
};

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
  stamina: number;
  maxStamina: number;
  staminaRegenRate: number;
  staminaRegenDelay: number;
  lastStaminaUseTime: number;
  isSprinting: boolean;
  temperature: number; // -1.0 to 1.0, where 0 is neutral, -1 is freezing, 1 is burning
  temperatureEffects: {
    freezing: boolean;
    overheating: boolean;
    visualEffect: 'none' | 'frost' | 'heat';
    effectIntensity: number; // 0.0 to 1.0
  };
  experience: number;
  level: number;
  flying: boolean;
  swimming: boolean;
  cameraMode: CameraMode;
  canJump: boolean;
  takingBlockDamage: boolean; // Flag to track if player is currently taking damage from a block
}

// This interface is for compatibility with the old crafting system
// We now use the more comprehensive CraftingRecipe from the crafting.ts file
export interface CraftingRecipe {
  output: {
    type: BlockType;
    count: number;
  };
  input: Record<string, number>; // type -> count
  requiresCraftingTable: boolean;
}

// Define Blood Moon event interface
export interface BloodMoonEvent {
  active: boolean;              // Is Blood Moon event currently active
  remainingDays: number;        // Remaining days of the Blood Moon (1-3)
  nextEventDay: number;         // Game day for the next Blood Moon
  intensity: number;            // Current intensity (0.0-1.0)
  specialDrops: BlockType[];    // Special items that can drop during Blood Moon
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
  selectedBlockFace: [number, number, number, string] | null; // Block face for placement
  
  // Inventory
  inventory: InventoryItem[];
  selectedInventorySlot: number;
  
  // Crafting
  craftingRecipes: CraftingRecipe[];
  
  // World state
  timeOfDay: number;            // 0.0 to 1.0, where 0.0 is midnight, 0.5 is noon
  dayCount: number;             // Total number of days elapsed
  weather: WeatherType;
  weatherSystem: WeatherSystem;
  bloodMoonEvent: BloodMoonEvent; // Blood Moon event status
  gravity: number;
  seed: number;
  
  // Actions
  placeBlock: (x: number, y: number, z: number, type: BlockType) => void;
  removeBlock: (x: number, y: number, z: number) => void;
  setSelectedBlock: (coords: [number, number, number] | null) => void;
  setSelectedBlockFace: (coords: [number, number, number, string] | null) => void;
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
  setPlayerTakingBlockDamage: (isTakingDamage: boolean) => void;
  updateBlockDamageState: (isTakingDamage: boolean) => void;
  
  // Stamina system
  updatePlayerStamina: (amount: number) => void;
  setPlayerSprinting: (isSprinting: boolean) => void;
  getStaminaPercentage: () => number;
  
  // Temperature system
  updatePlayerTemperature: (amount: number) => void;
  setPlayerTemperatureEffects: (effects: {
    freezing: boolean;
    overheating: boolean;
    visualEffect: 'none' | 'frost' | 'heat';
    effectIntensity: number;
  }) => void;
  
  // Crafting
  craftItem: (type: BlockType, count: number, ingredients: { type: BlockType, count: number }[]) => boolean;
  
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
      position: { x: 2, y: 0, z: 3 },
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
      position: { x: 4, y: 0, z: 4 },
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
      position: { x: 6, y: 0, z: 2 },
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
      position: { x: -3, y: 0, z: -4 },
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
      position: { x: 8, y: 0, z: 3 },
      rotation: { y: 0 },
      state: 'idle',
      mood: 'calm',
      animationState: 'idle',
      animationSpeed: 1,
      animationProgress: 0,
      leader: false
    },
    'skeleton1': {
      id: 'skeleton1',
      type: 'skeleton',
      position: { x: -5, y: 0, z: -2 },
      rotation: { y: 0 },
      state: 'idle',
      mood: 'aggressive',
      animationState: 'idle',
      animationSpeed: 1,
      animationProgress: 0,
      leader: false
    },
    'wraith1': {
      id: 'wraith1',
      type: 'wraith',
      position: { x: -6, y: 0, z: -6 },
      rotation: { y: 0 },
      state: 'idle',
      mood: 'aggressive',
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
    stamina: 100,
    maxStamina: 100,
    staminaRegenRate: 5, // Amount of stamina regenerated per second
    staminaRegenDelay: 1000, // Time in ms to wait after stamina use before regeneration starts
    lastStaminaUseTime: 0,
    isSprinting: false,
    temperature: 0, // Neutral temperature (range from -1 to 1)
    temperatureEffects: {
      freezing: false,
      overheating: false,
      visualEffect: 'none',
      effectIntensity: 0
    },
    experience: 0,
    level: 1,
    flying: false,
    swimming: false,
    cameraMode: 'first',
    canJump: true,
    takingBlockDamage: false
  },
  
  // Game UI state
  isInventoryOpen: false,
  isCraftingOpen: false,
  
  // Player interaction
  selectedBlock: null,
  selectedBlockFace: null,
  
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
  dayCount: 1, // Start on day 1
  weather: 'clear', // Start with clear weather
  weatherSystem: {
    currentWeather: 'clear',
    intensity: 0.0,
    transitionProgress: 0.0,
    transitionTarget: null,
    duration: 300, // 5 minutes of game time
    elapsedTime: 0,
    effects: {
      visibility: 1.0, // Full visibility
      movementModifier: 1.0, // Normal movement
      temperatureModifier: 0.0, // Neutral temperature
      dangerLevel: 0.0 // No danger
    }
  },
  bloodMoonEvent: {
    active: false,
    remainingDays: 0,
    nextEventDay: 14, // First blood moon on day 14
    intensity: 0.0,
    specialDrops: ['glass', 'ice', 'torch', 'coal'] // Special items that can drop during Blood Moon
  },
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
  
  setSelectedBlockFace: (coords) => {
    set({ selectedBlockFace: coords });
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
      
      // Track day changes - increment day counter when we pass midnight
      let newDayCount = state.dayCount;
      let dayChanged = false;
      
      // Check if we've completed a day (crossed midnight from 0.999 to 0.000)
      if (state.timeOfDay > 0.999 && newTimeOfDay < 0.001) {
        newDayCount += 1;
        dayChanged = true;
        console.log(`A new day has dawned! Day ${newDayCount}`);
      }
      
      // Update blood moon event
      const bloodMoonEvent = { ...state.bloodMoonEvent };
      
      // Check if day changed, process Blood Moon logic
      if (dayChanged) {
        // If Blood Moon is active, decrement days remaining
        if (bloodMoonEvent.active) {
          bloodMoonEvent.remainingDays -= 1;
          
          // If Blood Moon ends
          if (bloodMoonEvent.remainingDays <= 0) {
            bloodMoonEvent.active = false;
            bloodMoonEvent.intensity = 0;
            console.log("🌙 The Blood Moon has ended, the world returns to normal.");
            
            // Set next Blood Moon event (14 days from now)
            bloodMoonEvent.nextEventDay = newDayCount + 14;
          } else {
            console.log(`🌙 Blood Moon continues! ${bloodMoonEvent.remainingDays} night${bloodMoonEvent.remainingDays > 1 ? 's' : ''} remaining.`);
          }
        } 
        // Check if it's time for a new Blood Moon event
        else if (newDayCount >= bloodMoonEvent.nextEventDay) {
          bloodMoonEvent.active = true;
          bloodMoonEvent.remainingDays = 3; // Blood Moon lasts for 3 days
          bloodMoonEvent.intensity = 1.0;
          console.log("🔴 A BLOOD MOON RISES! Zombies and skeletons are becoming more aggressive!");
          console.log("⚠️ Beware of the wraiths that now roam the night!");
          
          // Special rare drops are now available
          console.log(`Special items can be collected during this event: ${bloodMoonEvent.specialDrops.join(', ')}`);
        }
      }
      
      // During Blood Moon event, increase intensity at night and decrease during day
      if (bloodMoonEvent.active) {
        // Night time intensifies the Blood Moon (0.75 to 0.25 is night time in the cycle)
        if (newTimeOfDay > 0.75 || newTimeOfDay < 0.25) {
          bloodMoonEvent.intensity = Math.min(1.0, bloodMoonEvent.intensity + 0.001);
        } else {
          // Blood Moon effect diminishes during daytime but never fully disappears
          bloodMoonEvent.intensity = Math.max(0.3, bloodMoonEvent.intensity - 0.0005);
        }
      }
      
      // Update weather system
      const weatherSystem = { ...state.weatherSystem };
      weatherSystem.elapsedTime += 1;
      
      // If we're transitioning weather, continue the transition
      if (weatherSystem.transitionTarget !== null) {
        weatherSystem.transitionProgress += 0.01;
        
        // Once transition completes, set the current weather
        if (weatherSystem.transitionProgress >= 1.0) {
          weatherSystem.currentWeather = weatherSystem.transitionTarget;
          weatherSystem.transitionTarget = null;
          weatherSystem.transitionProgress = 0;
          weatherSystem.intensity = Math.random() * 0.5 + 0.5; // 0.5 to 1.0 intensity
          
          // Set effects based on the weather type
          switch (weatherSystem.currentWeather) {
            case 'clear':
              weatherSystem.effects = {
                visibility: 1.0,
                movementModifier: 1.0,
                temperatureModifier: 0.2,
                dangerLevel: 0.0
              };
              break;
            case 'cloudy':
              weatherSystem.effects = {
                visibility: 0.8,
                movementModifier: 1.0,
                temperatureModifier: -0.1,
                dangerLevel: 0.0
              };
              break;
            case 'rain':
              weatherSystem.effects = {
                visibility: 0.6,
                movementModifier: 0.8,
                temperatureModifier: -0.3,
                dangerLevel: 0.1
              };
              break;
            case 'thunderstorm':
              weatherSystem.effects = {
                visibility: 0.4,
                movementModifier: 0.6,
                temperatureModifier: -0.4,
                dangerLevel: 0.7
              };
              break;
            case 'fog':
              weatherSystem.effects = {
                visibility: 0.3,
                movementModifier: 0.7,
                temperatureModifier: -0.2,
                dangerLevel: 0.2
              };
              break;
            case 'snow':
              weatherSystem.effects = {
                visibility: 0.5,
                movementModifier: 0.5,
                temperatureModifier: -0.7,
                dangerLevel: 0.3
              };
              break;
          }
          
          console.log(`Weather transitioned to ${weatherSystem.currentWeather} with intensity ${weatherSystem.intensity.toFixed(2)}`);
        }
      }
      // Check if weather should change (if elapsed time exceeds duration)
      else if (weatherSystem.elapsedTime >= weatherSystem.duration) {
        // Randomly select a new weather type
        const availableWeathers: WeatherType[] = ['clear', 'cloudy', 'rain', 'thunderstorm', 'fog', 'snow'];
        // Filter out the current weather to ensure a change
        const newWeathers = availableWeathers.filter(w => w !== weatherSystem.currentWeather);
        const newWeatherTarget = newWeathers[Math.floor(Math.random() * newWeathers.length)];
        
        // Start transition to new weather
        weatherSystem.transitionTarget = newWeatherTarget;
        weatherSystem.transitionProgress = 0.0;
        weatherSystem.elapsedTime = 0;
        weatherSystem.duration = Math.floor(Math.random() * 300) + 300; // 5-10 minutes
        
        console.log(`Weather transitioning from ${weatherSystem.currentWeather} to ${newWeatherTarget}`);
      }
      // Randomly trigger special events like lightning strikes during thunderstorms
      else if (weatherSystem.currentWeather === 'thunderstorm' && Math.random() < 0.01) {
        // Lightning strike event
        console.log("⚡ Lightning strike! ⚡");
        // In a real implementation, this would trigger visual effects and possibly damage nearby entities
      }
      
      // Sync the legacy weather property with the new system for backward compatibility
      const legacyWeather = weatherSystem.transitionTarget || weatherSystem.currentWeather;
      
      return {
        ...state,
        timeOfDay: newTimeOfDay,
        dayCount: newDayCount,
        weather: legacyWeather,
        weatherSystem,
        bloodMoonEvent
      };
    });
  },

  // Update creatures
  // Weather control
  setWeather: (weather) => {
    set((state) => {
      // Update the weather system
      const weatherSystem = { ...state.weatherSystem };
      
      // Start immediate transition to the new weather
      weatherSystem.transitionTarget = weather;
      weatherSystem.transitionProgress = 0.0;
      weatherSystem.elapsedTime = 0;
      // For manual weather changes, set a longer duration
      weatherSystem.duration = 600; // 10 minutes of game time
      
      console.log(`Weather manually changed to ${weather}, beginning transition`);
      
      return {
        weather,
        weatherSystem
      };
    });
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
      
      const creature = state.creatures[id];
      const updatedCreatures = { ...state.creatures };
      const { bloodMoonEvent } = state;
      
      // Handle creature defeat
      delete updatedCreatures[id];
      
      // Process drops based on creature type and Blood Moon status
      let droppedItems: {type: BlockType, count: number}[] = [];
      const isHostile = creature.type === 'zombie' || creature.type === 'skeleton' || creature.type === 'wraith';
      
      // Basic drops based on creature type
      if (creature.type === 'zombie') {
        droppedItems.push({ type: 'dirt', count: Math.floor(Math.random() * 2) + 1 });
      } else if (creature.type === 'skeleton') {
        droppedItems.push({ type: 'stone', count: Math.floor(Math.random() * 2) + 1 });
      } else if (creature.type === 'wraith') {
        // Wraiths always drop special Blood Moon items
        const specialDrop1 = bloodMoonEvent.specialDrops[
          Math.floor(Math.random() * bloodMoonEvent.specialDrops.length)
        ];
        const specialDrop2 = bloodMoonEvent.specialDrops[
          Math.floor(Math.random() * bloodMoonEvent.specialDrops.length)
        ];
        
        // Add multiple special drops with higher counts
        droppedItems.push({ type: specialDrop1, count: Math.floor(Math.random() * 3) + 2 });
        droppedItems.push({ type: specialDrop2, count: Math.floor(Math.random() * 2) + 1 });
        console.log(`🔴⚠️ Wraith defeated! Dropped valuable items: ${specialDrop1}, ${specialDrop2}`);
      } else if (creature.type === 'cow' || creature.type === 'pig' || creature.type === 'sheep') {
        // Farm animals drop food
        droppedItems.push({ type: 'dirt', count: 1 });
      }
      
      // Add special Blood Moon drops for hostile creatures
      if (bloodMoonEvent.active && isHostile) {
        // Higher chance for special drops at night
        const isNight = state.timeOfDay > 0.75 || state.timeOfDay < 0.25;
        const specialDropChance = isNight ? 0.7 : 0.3;
        
        if (Math.random() < specialDropChance) {
          // Select a random special drop
          const specialDrop = bloodMoonEvent.specialDrops[
            Math.floor(Math.random() * bloodMoonEvent.specialDrops.length)
          ];
          
          // Add to drops with random count
          droppedItems.push({ 
            type: specialDrop, 
            count: Math.floor(Math.random() * 3) + 1 
          });
          
          console.log(`🔴 Blood Moon creature dropped a special item: ${specialDrop}`);
        }
      }
      
      // Add all dropped items to inventory
      droppedItems.forEach(item => {
        // Only add to inventory if count > 0
        if (item.count > 0) {
          state.addToInventory(item.type, item.count);
        }
      });
      
      if (bloodMoonEvent.active && isHostile) {
        console.log(`🔴 Blood Moon ${creature.type} was defeated!`);
      } else {
        console.log(`Creature ${creature.type} was damaged for ${amount} and removed`);
      }
      
      return {
        ...state,
        creatures: updatedCreatures
      };
    });
  },
  
  updateCreatures: () => {
    set((state) => {
      const updatedCreatures = { ...state.creatures };
      const { bloodMoonEvent, player } = state;
      const isNight = state.timeOfDay > 0.75 || state.timeOfDay < 0.25;
      
      // Update each creature
      Object.values(updatedCreatures).forEach(creature => {
        // Check if it's a hostile creature (zombie, skeleton, or wraith)
        const isHostile = creature.type === 'zombie' || creature.type === 'skeleton' || creature.type === 'wraith';
        
        // Special handling for wraiths
        if (creature.type === 'wraith') {
          // Wraiths are always in hunting/frenzied state
          creature.state = 'hunting';
          creature.mood = 'frenzied';
          creature.animationSpeed = 2.0 + (bloodMoonEvent.intensity * 0.5);
          
          // Wraiths move faster and are more aggressive at tracking the player
          const playerPos = player.position;
          const directionX = playerPos[0] - creature.position.x;
          const directionZ = playerPos[2] - creature.position.z;
          
          // Normalize direction vector
          const distance = Math.sqrt(directionX * directionX + directionZ * directionZ);
          
          if (distance > 0.5) { // Closer engagement range
            // Wraiths are faster than other creatures
            const moveSpeed = 0.08 + (bloodMoonEvent.intensity * 0.07);
            
            // Move towards player
            creature.position.x += (directionX / distance) * moveSpeed;
            creature.position.z += (directionZ / distance) * moveSpeed;
            
            // Update rotation to face player
            creature.rotation.y = Math.atan2(directionX, directionZ);
            
            // Occasional teleport for wraiths (5% chance per update)
            if (Math.random() < 0.05) {
              // Teleport closer to player (half the current distance)
              creature.position.x = creature.position.x + (directionX * 0.4);
              creature.position.z = creature.position.z + (directionZ * 0.4);
              console.log(`🔮 Wraith teleported closer to player!`);
            }
          }
        }
        // Apply Blood Moon effects to zombies and skeletons
        else if (isHostile && bloodMoonEvent.active) {
          // During Blood Moon, hostiles are always in hunting state and extremely aggressive
          creature.state = 'hunting';
          creature.mood = 'frenzied'; // Special Blood Moon mood
          
          // Faster animation during Blood Moon
          creature.animationSpeed = 1.5 + (bloodMoonEvent.intensity * 0.5);
          
          // During Blood Moon nights, hostile creatures actively hunt the player
          if (isNight) {
            // Move towards player with increased speed during Blood Moon
            const playerPos = player.position;
            const directionX = playerPos[0] - creature.position.x;
            const directionZ = playerPos[2] - creature.position.z;
            
            // Normalize direction vector
            const distance = Math.sqrt(directionX * directionX + directionZ * directionZ);
            
            if (distance > 1.0) { // Only move if not too close
              // Calculate movement speed based on Blood Moon intensity
              const moveSpeed = 0.05 + (bloodMoonEvent.intensity * 0.05);
              
              // Move towards player
              creature.position.x += (directionX / distance) * moveSpeed;
              creature.position.z += (directionZ / distance) * moveSpeed;
              
              // Update rotation to face player
              creature.rotation.y = Math.atan2(directionX, directionZ);
            }
          }
        } 
        // Normal creature behavior
        else {
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
            if (isHostile) {
              creature.mood = 'aggressive';
            } else {
              creature.mood = moods[Math.floor(Math.random() * moods.length)];
            }
          }
        }
        
        // Update animation progress
        creature.animationProgress = (creature.animationProgress + 0.01 * creature.animationSpeed) % 1;
      });
      
      // During Blood Moon nights, spawn additional zombies and skeletons occasionally
      if (bloodMoonEvent.active && isNight && Math.random() < 0.02) {
        // Get player position to spawn creatures nearby
        const playerPos = player.position;
        
        // Spawn in a circle around the player (between 10-20 blocks away)
        const spawnDistance = 10 + Math.random() * 10;
        const spawnAngle = Math.random() * Math.PI * 2;
        
        const spawnX = playerPos[0] + Math.cos(spawnAngle) * spawnDistance;
        const spawnZ = playerPos[2] + Math.sin(spawnAngle) * spawnDistance;
        
        // Find ground level for spawn
        let spawnY = 30; // Start from a high position
        let foundGround = false;
        
        // Find the highest solid block under spawn position
        for (let y = spawnY; y > 0; y--) {
          const blockKey = `${Math.floor(spawnX)},${y-1},${Math.floor(spawnZ)}`;
          if (state.blocks[blockKey] && state.blocks[blockKey] !== 'air' && state.blocks[blockKey] !== 'water') {
            spawnY = y;
            foundGround = true;
            break;
          }
        }
        
        // Only spawn if we found ground
        if (foundGround) {
          // Choose between zombie, skeleton, or the special wraith creature (rare)
          // Higher chance for wraith when blood moon intensity is higher
          const random = Math.random();
          const wraithChance = 0.15 * bloodMoonEvent.intensity; // 0-15% chance based on intensity
          const creatureType = random < wraithChance ? 'wraith' : (random < 0.5 + wraithChance ? 'zombie' : 'skeleton');
          
          // Generate unique ID
          const id = `${creatureType}_bloodmoon_${Date.now()}_${Math.random().toString(36).substr(2, 5)}`;
          
          // Create new blood moon creature with enhanced properties
          updatedCreatures[id] = {
            id,
            type: creatureType,
            position: { x: spawnX, y: spawnY, z: spawnZ },
            rotation: { y: Math.random() * Math.PI * 2 },
            state: 'hunting',
            mood: 'frenzied',
            animationState: 'walk',
            // Wraiths are faster than zombies/skeletons
            animationSpeed: creatureType === 'wraith' ? 2.0 : 1.5,
            animationProgress: 0,
            leader: creatureType === 'wraith' // Wraiths are always leaders
          };
          
          // Special log message for wraiths
          if (creatureType === 'wraith') {
            console.log(`🔴⚠️ Blood Moon spawned a WRAITH at [${Math.floor(spawnX)}, ${Math.floor(spawnY)}, ${Math.floor(spawnZ)}]`);
          } else {
            console.log(`🔴 Blood Moon spawned a ${creatureType} at [${Math.floor(spawnX)}, ${Math.floor(spawnY)}, ${Math.floor(spawnZ)}]`);
          }
        }
      }
      
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
  
  // This section has been corrected and a proper implementation has been added at the end of the file
  
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
  craftItem: (outputType, outputCount, ingredients) => {
    const { inventory } = get();
    
    // Check if we have all required ingredients
    for (const ingredient of ingredients) {
      const hasEnough = inventory.some(item => 
        item.type === ingredient.type && item.count >= ingredient.count
      );
      
      if (!hasEnough) {
        console.log(`Missing ingredients for crafting: need ${ingredient.count} of ${ingredient.type}`);
        return false;
      }
    }
    
    // Remove ingredients from inventory
    for (const ingredient of ingredients) {
      get().removeFromInventory(ingredient.type, ingredient.count);
    }
    
    // Add crafted item to inventory
    get().addToInventory(outputType, outputCount);
    
    console.log(`Crafted ${outputCount}x ${outputType}`);
    return true;
  },
  
  // Camera control
  setCameraRotation: (x, y) => {
    // This is usually handled by the PlayerControls component
    // Here we only log the rotation for debugging
    console.log(`Camera rotation: x=${x}, y=${y}`);
  },
  
  // Stamina system
  updatePlayerStamina: (amount) => {
    set((state) => {
      // Clamp stamina value between 0 and maxStamina
      const newStamina = Math.max(0, Math.min(state.player.maxStamina, state.player.stamina + amount));
      
      // Update last stamina use time if decreasing stamina
      const lastStaminaUseTime = amount < 0 ? Date.now() : state.player.lastStaminaUseTime;
      
      return {
        ...state,
        player: {
          ...state.player,
          stamina: newStamina,
          lastStaminaUseTime
        }
      };
    });
  },
  
  setPlayerSprinting: (isSprinting) => {
    set((state) => ({
      ...state,
      player: {
        ...state.player,
        isSprinting
      }
    }));
  },
  
  getStaminaPercentage: () => {
    const { player } = get();
    return (player.stamina / player.maxStamina) * 100;
  },
  
  // Temperature system
  updatePlayerTemperature: (amount) => {
    set((state) => {
      // Clamp temperature between -1 and 1
      const newTemperature = Math.max(-1, Math.min(1, state.player.temperature + amount));
      
      // Determine temperature effects based on new temperature
      const temperatureEffects = {
        ...state.player.temperatureEffects
      };
      
      // Update freezing/overheating states
      if (newTemperature <= -0.7) {
        temperatureEffects.freezing = true;
        temperatureEffects.overheating = false;
        temperatureEffects.visualEffect = 'frost';
        temperatureEffects.effectIntensity = Math.abs((newTemperature + 0.7) / 0.3); // Range 0-1 based on -0.7 to -1.0
      } else if (newTemperature >= 0.7) {
        temperatureEffects.freezing = false;
        temperatureEffects.overheating = true;
        temperatureEffects.visualEffect = 'heat';
        temperatureEffects.effectIntensity = (newTemperature - 0.7) / 0.3; // Range 0-1 based on 0.7 to 1.0
      } else {
        temperatureEffects.freezing = false;
        temperatureEffects.overheating = false;
        temperatureEffects.visualEffect = 'none';
        temperatureEffects.effectIntensity = 0;
      }
      
      return {
        ...state,
        player: {
          ...state.player,
          temperature: newTemperature,
          temperatureEffects
        }
      };
    });
  },
  
  setPlayerTemperatureEffects: (effects) => {
    set((state) => ({
      ...state,
      player: {
        ...state.player,
        temperatureEffects: effects
      }
    }));
  },
  
  // Player block damage tracking
  setPlayerTakingBlockDamage: (isTakingDamage) => {
    set((state) => ({
      ...state,
      player: {
        ...state.player,
        takingBlockDamage: isTakingDamage
      }
    }));
  },
  
  // Alternative implementation for tracking block damage state
  updateBlockDamageState: (isTakingDamage) => {
    set((state) => ({
      ...state,
      player: {
        ...state.player,
        takingBlockDamage: isTakingDamage
      }
    }));
    console.log(`Player block damage state: ${isTakingDamage ? 'taking damage' : 'not taking damage'}`);
  }
}));