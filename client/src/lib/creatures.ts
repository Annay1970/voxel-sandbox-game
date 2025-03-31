import { BlockType, isBlockSolid } from './blocks';

export type CreatureType = 
  'cow' | 'pig' | 'sheep' | 'chicken' | 
  'zombie' | 'skeleton' | 'spider' | 'bee' | 
  'wraith'; // Blood Moon special mob

// Helper function to add creatures at fixed positions
function addFixedCreature(
  creatures: Record<string, any>,
  type: CreatureType,
  x: number,
  y: number,
  z: number
) {
  const creatureId = `creature_fixed_${type}_${Math.random().toString(36).substr(2, 9)}`;
  const properties = getCreatureProperties(type);
  
  // Get animation states
  const animStates = properties.animationStates || ['idle', 'walk'];
  const defaultAnimState = animStates[0];
  
  // Basic creature with important properties
  creatures[creatureId] = {
    id: creatureId,
    type: type,
    position: { x, y, z },
    rotation: { y: Math.random() * Math.PI * 2 },
    health: properties.maxHealth || (type === 'zombie' || type === 'skeleton' || type === 'spider' ? 20 : 10),
    maxHealth: properties.maxHealth || (type === 'zombie' || type === 'skeleton' || type === 'spider' ? 20 : 10),
    state: type === 'zombie' || type === 'skeleton' || type === 'spider' ? 'hunting' : 'idle',
    lastStateChange: Date.now(),
    hostility: type === 'zombie' || type === 'skeleton' || type === 'spider' ? 'hostile' : 'passive',
    
    // AI properties
    mood: properties.defaultMood || (type === 'zombie' || type === 'skeleton' || type === 'spider' ? 'aggressive' : 'calm'),
    
    // Animation properties
    animationState: defaultAnimState,
    animationProgress: 0,
    animationSpeed: 0.5
  };
  
  console.log(`Added fixed ${type} at ${x},${y},${z}`);
}

// Spawn creatures in chunks
export function spawnCreatures(
  chunks: Record<string, boolean>,
  blocks: Record<string, BlockType>
) {
  const creatures: Record<string, any> = {};
  
  // Define creature types
  const passiveCreatures: CreatureType[] = ['cow', 'pig', 'sheep', 'chicken', 'bee'];
  const hostileCreatures: CreatureType[] = ['zombie', 'skeleton', 'spider'];
  
  console.log(`Spawning creatures in ${Object.keys(chunks).length} chunks...`);
  
  // Create some guaranteed creatures for testing combat
  // Add a few creatures at fixed positions near the player's spawn
  addFixedCreature(creatures, 'cow', 5, 25, 5);
  addFixedCreature(creatures, 'pig', -5, 25, 5);
  addFixedCreature(creatures, 'sheep', 5, 25, -5);
  addFixedCreature(creatures, 'zombie', -5, 25, -5);
  addFixedCreature(creatures, 'skeleton', 10, 25, 10);
  addFixedCreature(creatures, 'spider', -10, 25, -10);
  
  // For each chunk
  Object.keys(chunks).forEach(chunkKey => {
    const [chunkX, chunkZ] = chunkKey.split(',').map(Number);
    
    // Chunk world coordinates
    const worldX = chunkX * 16;
    const worldZ = chunkZ * 16;
    
    // Spawn passive creatures - INCREASED SPAWN RATE
    const passiveCount = Math.floor(Math.random() * 4) + 1; // 1-4 passive mobs per chunk
    
    for (let i = 0; i < passiveCount; i++) {
      // Random position within chunk
      let posX = worldX + Math.floor(Math.random() * 16);
      let posZ = worldZ + Math.floor(Math.random() * 16);
      
      // Find suitable Y coordinate (ground level)
      let posY = -1;
      
      // Search for ground from top to bottom with higher max height
      // Check more blocks to find a valid position
      for (let y = 100; y > 0; y--) {
        const blockKey = `${posX},${y},${posZ}`;
        const blockBelow = `${posX},${y-1},${posZ}`;
        
        // Look for air block with solid block below
        if ((!blocks[blockKey] || blocks[blockKey] === 'air') && 
            blocks[blockBelow] && isBlockSolid(blocks[blockBelow])) {
          posY = y;
          break;
        }
      }
      
      // If we couldn't find a position, try a different spot in the chunk
      if (posY === -1) {
        // Try another random position
        posX = worldX + Math.floor(Math.random() * 16);
        posZ = worldZ + Math.floor(Math.random() * 16);
        
        for (let y = 100; y > 0; y--) {
          const blockKey = `${posX},${y},${posZ}`;
          const blockBelow = `${posX},${y-1},${posZ}`;
          
          if ((!blocks[blockKey] || blocks[blockKey] === 'air') && 
              blocks[blockBelow] && isBlockSolid(blocks[blockBelow])) {
            posY = y;
            break;
          }
        }
      }
      
      // Skip if still couldn't find valid position
      if (posY === -1) continue;
      
      // Don't spawn in water
      const blockAtPos = blocks[`${posX},${posY},${posZ}`];
      if (blockAtPos === 'water') continue;
      
      // Create creature with enhanced properties
      const creatureType = passiveCreatures[Math.floor(Math.random() * passiveCreatures.length)];
      const creatureId = `creature_${Math.random().toString(36).substr(2, 9)}`;
      const properties = getCreatureProperties(creatureType);
      
      // Generate flockId for herd animals with 50% chance to join existing flock
      const flockId = properties.flockingBehavior ? 
        `flock_${creatureType}_${Math.floor(Math.random() * 5)}` : undefined;
      
      // Determine if this creature is a leader (10% chance if in a flock)
      const isLeader = flockId ? Math.random() < 0.1 : false;
      
      // Get animation states
      const animStates = properties.animationStates || ['idle', 'walk'];
      const defaultAnimState = animStates[0];
      
      // Use a default animation speed and avoid type issues
      const defaultAnimSpeed = 0.5;
      
      creatures[creatureId] = {
        id: creatureId,
        type: creatureType,
        position: { x: posX, y: posY, z: posZ },
        rotation: { y: Math.random() * Math.PI * 2 },
        health: properties.maxHealth || 10,
        maxHealth: properties.maxHealth || 10,
        state: 'idle',
        lastStateChange: Date.now(),
        hostility: properties.hostility || 'passive',
        
        // Enhanced AI properties
        mood: properties.defaultMood || 'calm',
        hunger: Math.floor(Math.random() * 50) + 30, // Start with some hunger
        tiredness: Math.floor(Math.random() * 20), // Start reasonably rested
        flockId: flockId,
        leader: isLeader,
        memories: {
          favoriteLocations: [{ x: posX, y: posY, z: posZ }], // Start with spawn location as favorite
          knownThreats: []
        },
        
        // Animation properties
        animationState: defaultAnimState,
        animationProgress: 0,
        animationSpeed: defaultAnimSpeed
      };
    }
    
    // Spawn hostile creatures (increased spawn rate, not just at night)
    if (Math.random() < 0.7) { // 70% chance per chunk
      const hostileCount = Math.floor(Math.random() * 3) + 1; // 1-3 hostile mobs per chunk
      
      for (let i = 0; i < hostileCount; i++) {
        // Random position within chunk
        let posX = worldX + Math.floor(Math.random() * 16);
        let posZ = worldZ + Math.floor(Math.random() * 16);
        
        // Find suitable Y coordinate (ground level)
        let posY = -1;
        
        // Search for ground from top to bottom with higher max height
        for (let y = 100; y > 0; y--) {
          const blockKey = `${posX},${y},${posZ}`;
          const blockBelow = `${posX},${y-1},${posZ}`;
          
          if ((!blocks[blockKey] || blocks[blockKey] === 'air') && 
              blocks[blockBelow] && isBlockSolid(blocks[blockBelow])) {
            posY = y;
            break;
          }
        }
        
        // If we couldn't find a position, try a different spot in the chunk
        if (posY === -1) {
          // Try another random position
          posX = worldX + Math.floor(Math.random() * 16);
          posZ = worldZ + Math.floor(Math.random() * 16);
          
          for (let y = 100; y > 0; y--) {
            const blockKey = `${posX},${y},${posZ}`;
            const blockBelow = `${posX},${y-1},${posZ}`;
            
            if ((!blocks[blockKey] || blocks[blockKey] === 'air') && 
                blocks[blockBelow] && isBlockSolid(blocks[blockBelow])) {
              posY = y;
              break;
            }
          }
        }
        
        // Skip if still couldn't find valid position
        if (posY === -1) continue;
        
        // Create creature with enhanced properties
        const creatureType = hostileCreatures[Math.floor(Math.random() * hostileCreatures.length)];
        const creatureId = `creature_${Math.random().toString(36).substr(2, 9)}`;
        const properties = getCreatureProperties(creatureType);
        
        // Get animation states
        const animStates = properties.animationStates || ['idle', 'walk', 'attack'];
        const defaultAnimState = animStates[0];
        
        // Use a default animation speed and avoid type issues
        const defaultAnimSpeed = 0.5;
        
        // Decide if creatures should group together (zombies sometimes form hordes)
        const flockId = creatureType === 'zombie' && Math.random() < 0.4 ? 
          `horde_zombie_${Math.floor(Math.random() * 3)}` : undefined;
          
        creatures[creatureId] = {
          id: creatureId,
          type: creatureType,
          position: { x: posX, y: posY, z: posZ },
          rotation: { y: Math.random() * Math.PI * 2 },
          health: properties.maxHealth || 20,
          maxHealth: properties.maxHealth || 20,
          state: Math.random() < 0.7 ? 'wandering' : 'hunting',
          lastStateChange: Date.now(),
          hostility: 'hostile',
          
          // Enhanced AI properties
          mood: properties.defaultMood || 'aggressive',
          hunger: Math.floor(Math.random() * 40) + 60, // Hostile mobs are hungrier
          tiredness: Math.floor(Math.random() * 10), // Less tired than passive mobs
          flockId: flockId,
          leader: flockId ? Math.random() < 0.2 : false,
          memories: {
            knownThreats: [], // Will add player to known threats when detected
            favoriteLocations: [
              { x: posX, y: posY, z: posZ }, // Spawn location
              // Add a random hunting ground
              { 
                x: posX + (Math.random() * 20 - 10), 
                y: posY,
                z: posZ + (Math.random() * 20 - 10)
              }
            ]
          },
          
          // Animation properties
          animationState: defaultAnimState,
          animationProgress: 0,
          animationSpeed: defaultAnimSpeed
        };
      }
    }
  });
  
  console.log(`Spawned ${Object.keys(creatures).length} creatures`);
  return creatures;
}

// Enhanced creature behavior and AI

export function getCreatureProperties(type: CreatureType) {
  switch (type) {
    case 'cow':
      return {
        maxHealth: 10,
        speed: 0.5,
        drops: ['leather', 'beef'],
        hostility: 'passive',
        spawnBiomes: ['plains', 'forest'],
        
        // Enhanced properties
        preferredStates: ['grazing', 'idle', 'wandering', 'sleeping'],
        stateWeights: { grazing: 0.5, idle: 0.3, wandering: 0.15, sleeping: 0.05 },
        senseRadius: 8, // Can detect entities within this radius
        flockingBehavior: true, // Tends to stay near other cows
        socialDistance: 3, // Preferred distance from other creatures
        feedingTime: [0.3, 0.7], // Primarily eats during daylight
        huntedBy: ['wolf'], // Can be hunted by wolves
        diurnalActivity: true, // Active during the day
        
        // Mood properties
        defaultMood: 'calm',
        moodTransitions: {
          'calm': { 'alert': 0.2, 'afraid': 0.1 },
          'alert': { 'calm': 0.3, 'afraid': 0.4 },
          'afraid': { 'alert': 0.2, 'calm': 0.1 }
        },
        
        // Animation properties
        animationStates: ['idle', 'walk', 'eat', 'sleep'],
        animationSpeeds: { idle: 0.5, walk: 1.0, eat: 0.7, sleep: 0.3 }
      };
    case 'pig':
      return {
        maxHealth: 10,
        speed: 0.6,
        drops: ['porkchop'],
        hostility: 'passive',
        spawnBiomes: ['plains', 'forest'],
        
        // Enhanced properties
        preferredStates: ['grazing', 'idle', 'wandering', 'sleeping'],
        stateWeights: { grazing: 0.4, idle: 0.3, wandering: 0.2, sleeping: 0.1 },
        senseRadius: 6,
        flockingBehavior: true,
        socialDistance: 2.5,
        feedingTime: [0.2, 0.8], // Pigs eat throughout the day
        huntedBy: ['wolf'],
        diurnalActivity: true,
        
        // Terrain preferences
        prefersMud: true, // Pigs like muddy areas
        
        // Mood properties
        defaultMood: 'calm',
        moodTransitions: {
          'calm': { 'playful': 0.2, 'alert': 0.1 },
          'playful': { 'calm': 0.4 },
          'alert': { 'calm': 0.3, 'afraid': 0.3 },
          'afraid': { 'alert': 0.3, 'calm': 0.1 }
        },
        
        // Animation properties
        animationStates: ['idle', 'walk', 'eat', 'sleep', 'rootDirt'],
        animationSpeeds: { idle: 0.5, walk: 1.0, eat: 0.7, sleep: 0.3, rootDirt: 0.8 }
      };
    case 'sheep':
      return {
        maxHealth: 8,
        speed: 0.5,
        drops: ['wool', 'mutton'],
        hostility: 'passive',
        spawnBiomes: ['plains', 'forest'],
        
        // Enhanced properties
        preferredStates: ['grazing', 'idle', 'wandering', 'sleeping'],
        stateWeights: { grazing: 0.5, idle: 0.2, wandering: 0.2, sleeping: 0.1 },
        senseRadius: 7,
        flockingBehavior: true,
        socialDistance: 2,
        feedingTime: [0.3, 0.6],
        huntedBy: ['wolf'],
        diurnalActivity: true,
        
        // Sheep-specific
        woolGrowthRate: 0.05, // Wool grows over time
        
        // Mood properties
        defaultMood: 'calm',
        moodTransitions: {
          'calm': { 'alert': 0.1, 'afraid': 0.1 },
          'alert': { 'calm': 0.2, 'afraid': 0.5 },
          'afraid': { 'alert': 0.3, 'calm': 0.05 }
        },
        
        // Animation properties
        animationStates: ['idle', 'walk', 'eat', 'sleep'],
        animationSpeeds: { idle: 0.5, walk: 0.8, eat: 0.6, sleep: 0.3 }
      };
    case 'chicken':
      return {
        maxHealth: 4,
        speed: 0.4,
        drops: ['feather', 'chicken'],
        hostility: 'passive',
        spawnBiomes: ['plains', 'forest'],
        
        // Enhanced properties
        preferredStates: ['idle', 'wandering', 'grazing', 'sleeping'],
        stateWeights: { idle: 0.4, wandering: 0.3, grazing: 0.2, sleeping: 0.1 },
        senseRadius: 5,
        flockingBehavior: true,
        socialDistance: 1.5,
        feedingTime: [0.2, 0.7],
        huntedBy: ['wolf', 'fox'],
        diurnalActivity: true,
        
        // Chicken-specific
        eggLayingRate: 0.02, // Chance to lay egg
        
        // Mood properties
        defaultMood: 'calm',
        moodTransitions: {
          'calm': { 'alert': 0.2, 'afraid': 0.2 },
          'alert': { 'calm': 0.3, 'afraid': 0.5 },
          'afraid': { 'alert': 0.4, 'calm': 0.05 }
        },
        
        // Animation properties
        animationStates: ['idle', 'walk', 'peck', 'sleep', 'flap'],
        animationSpeeds: { idle: 0.5, walk: 0.9, peck: 1.2, sleep: 0.3, flap: 1.5 }
      };
    case 'zombie':
      return {
        maxHealth: 20,
        speed: 0.6,
        damage: 2,
        drops: ['rotten_flesh'],
        hostility: 'hostile',
        spawnBiomes: ['all'],
        
        // Enhanced properties
        preferredStates: ['wandering', 'idle', 'hunting', 'attacking'],
        stateWeights: { wandering: 0.4, idle: 0.1, hunting: 0.4, attacking: 0.1 },
        senseRadius: 16, // Good at detecting players
        flockingBehavior: false,
        socialDistance: 0, // Doesn't care about personal space
        huntedBy: [],
        diurnalActivity: false, // Active at night
        burnInSunlight: true, // Burns during daytime
        
        // Zombie-specific
        targetPreference: 'player',
        doorBreaking: true, // Can break doors
        
        // Mood properties
        defaultMood: 'aggressive',
        moodTransitions: {
          'aggressive': { 'alert': 0.1 },
          'alert': { 'aggressive': 0.7 }
        },
        
        // Animation properties
        animationStates: ['idle', 'walk', 'attack', 'pursuit'],
        animationSpeeds: { idle: 0.4, walk: 0.6, attack: 1.0, pursuit: 0.8 }
      };
    case 'skeleton':
      return {
        maxHealth: 20,
        speed: 0.6,
        damage: 3,
        drops: ['bone', 'arrow'],
        hostility: 'hostile',
        spawnBiomes: ['all'],
        
        // Enhanced properties
        preferredStates: ['wandering', 'idle', 'hunting', 'attacking'],
        stateWeights: { wandering: 0.3, idle: 0.2, hunting: 0.4, attacking: 0.1 },
        senseRadius: 20, // Very good detection range
        flockingBehavior: false,
        attackRange: 12, // Can attack from a distance
        huntedBy: [],
        diurnalActivity: false,
        burnInSunlight: true,
        
        // Skeleton-specific
        rangedAttack: true,
        avoidsMelee: true, // Tries to keep distance
        
        // Mood properties
        defaultMood: 'aggressive',
        moodTransitions: {
          'aggressive': { 'alert': 0.2 },
          'alert': { 'aggressive': 0.6, 'afraid': 0.2 },
          'afraid': { 'alert': 0.5, 'aggressive': 0.3 }
        },
        
        // Animation properties
        animationStates: ['idle', 'walk', 'shoot', 'retreat'],
        animationSpeeds: { idle: 0.5, walk: 0.8, shoot: 1.2, retreat: 1.0 }
      };
    case 'spider':
      return {
        maxHealth: 16,
        speed: 0.7,
        damage: 2,
        drops: ['string', 'spider_eye'],
        hostility: 'hostile',
        spawnBiomes: ['all'],
        
        // Enhanced properties
        preferredStates: ['idle', 'wandering', 'hunting', 'attacking', 'climbing'],
        stateWeights: { idle: 0.2, wandering: 0.3, hunting: 0.3, attacking: 0.1, climbing: 0.1 },
        senseRadius: 14,
        flockingBehavior: false,
        huntedBy: [],
        diurnalActivity: false, // Primarily night active
        neutralInDaylight: true, // Less aggressive during day
        
        // Spider-specific
        canClimb: true,
        jumpAttack: true,
        
        // Mood properties
        defaultMood: 'alert',
        moodTransitions: {
          'alert': { 'aggressive': 0.4, 'calm': 0.1 },
          'aggressive': { 'alert': 0.3 },
          'calm': { 'alert': 0.6, 'aggressive': 0.1 }
        },
        
        // Animation properties
        animationStates: ['idle', 'walk', 'attack', 'climb', 'jump'],
        animationSpeeds: { idle: 0.3, walk: 1.2, attack: 1.5, climb: 0.9, jump: 2.0 }
      };
    case 'bee':
      return {
        maxHealth: 10,
        speed: 0.8,
        damage: 1,
        drops: ['honey'],
        hostility: 'neutral',
        spawnBiomes: ['plains', 'forest'],
        
        // Enhanced properties
        preferredStates: ['idle', 'wandering', 'grazing', 'following', 'defending'],
        stateWeights: { idle: 0.2, wandering: 0.4, grazing: 0.3, following: 0.05, defending: 0.05 },
        senseRadius: 6,
        flockingBehavior: true,
        socialDistance: 1.5,
        feedingTime: [0.3, 0.7], // Active during day for pollination
        huntedBy: [],
        diurnalActivity: true,
        
        // Bee-specific
        pollinationRate: 0.2,
        hiveMemory: true, // Remembers location of its hive
        aggroWhenAttacked: true, // Becomes hostile when attacked
        diesAfterStinging: true,
        
        // Mood properties
        defaultMood: 'calm',
        moodTransitions: {
          'calm': { 'alert': 0.1, 'playful': 0.1 },
          'alert': { 'calm': 0.2, 'aggressive': 0.4 },
          'aggressive': { 'alert': 0.3 },
          'playful': { 'calm': 0.7 }
        },
        
        // Animation properties
        animationStates: ['idle', 'fly', 'attack', 'pollinate', 'dance'],
        animationSpeeds: { idle: 0.6, fly: 1.5, attack: 1.8, pollinate: 0.8, dance: 1.0 }
      };
    case 'wraith':
      return {
        maxHealth: 35,
        speed: 1.0,
        damage: 4,
        drops: ['glass', 'ice', 'coal', 'torch'], // Special Blood Moon specific drops
        hostility: 'hostile',
        spawnBiomes: ['all'], // Can spawn anywhere during Blood Moon
        bloodMoonOnly: true, // Only spawns during Blood Moon event
        
        // Enhanced properties
        preferredStates: ['hunting', 'attacking'],
        stateWeights: { hunting: 0.7, attacking: 0.3 },
        senseRadius: 24, // Exceptional detection range
        flockingBehavior: false,
        socialDistance: 0,
        huntedBy: [],
        diurnalActivity: false, // Active only at night
        
        // Wraith-specific
        teleportAbility: true, // Can occasionally teleport short distances
        teleportCooldown: 10, // Seconds between teleports
        teleportRange: 8, // Maximum teleport distance in blocks
        ignoresLight: true, // Not affected by light levels
        spectral: true, // Partially transparent, can pass through some blocks
        
        // Mood properties
        defaultMood: 'frenzied',
        moodTransitions: {
          'frenzied': { 'aggressive': 0.1 },
          'aggressive': { 'frenzied': 0.9 }
        },
        
        // Animation properties
        animationStates: ['idle', 'hunt', 'attack', 'teleport'],
        animationSpeeds: { idle: 0.7, hunt: 1.2, attack: 1.8, teleport: 2.5 }
      };
    default:
      return {
        maxHealth: 10,
        speed: 0.5,
        hostility: 'passive',
        spawnBiomes: ['all'],
        preferredStates: ['idle', 'wandering'],
        stateWeights: { idle: 0.5, wandering: 0.5 },
        senseRadius: 5,
        diurnalActivity: true,
        defaultMood: 'calm',
        animationStates: ['idle', 'walk'],
        animationSpeeds: { idle: 0.5, walk: 1.0 }
      };
  }
}
