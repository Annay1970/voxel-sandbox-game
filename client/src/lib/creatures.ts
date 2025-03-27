import { BlockType, isBlockSolid } from './blocks';

export type CreatureType = 
  'cow' | 'pig' | 'sheep' | 'chicken' | 
  'zombie' | 'skeleton' | 'spider' | 'bee';

// Spawn creatures in chunks
export function spawnCreatures(
  chunks: Record<string, boolean>,
  blocks: Record<string, BlockType>
) {
  const creatures: Record<string, any> = {};
  
  // Define creature types
  const passiveCreatures: CreatureType[] = ['cow', 'pig', 'sheep', 'chicken', 'bee'];
  const hostileCreatures: CreatureType[] = ['zombie', 'skeleton', 'spider'];
  
  // For each chunk
  Object.keys(chunks).forEach(chunkKey => {
    const [chunkX, chunkZ] = chunkKey.split(',').map(Number);
    
    // Chunk world coordinates
    const worldX = chunkX * 16;
    const worldZ = chunkZ * 16;
    
    // Spawn passive creatures
    const passiveCount = Math.floor(Math.random() * 3); // 0-2 passive mobs per chunk
    
    for (let i = 0; i < passiveCount; i++) {
      // Random position within chunk
      const posX = worldX + Math.floor(Math.random() * 16);
      const posZ = worldZ + Math.floor(Math.random() * 16);
      
      // Find suitable Y coordinate (ground level)
      let posY = -1;
      
      // Search for ground from top to bottom (maximum 50 blocks above bedrock)
      for (let y = 50; y > 0; y--) {
        const blockKey = `${posX},${y},${posZ}`;
        const blockBelow = `${posX},${y-1},${posZ}`;
        
        // Look for air block with solid block below
        if ((!blocks[blockKey] || blocks[blockKey] === 'air') && 
            blocks[blockBelow] && isBlockSolid(blocks[blockBelow])) {
          posY = y;
          break;
        }
      }
      
      // Skip if couldn't find valid position
      if (posY === -1) continue;
      
      // Don't spawn in water
      const blockAtPos = blocks[`${posX},${posY},${posZ}`];
      if (blockAtPos === 'water') continue;
      
      // Create creature
      const creatureType = passiveCreatures[Math.floor(Math.random() * passiveCreatures.length)];
      const creatureId = `creature_${Math.random().toString(36).substr(2, 9)}`;
      
      creatures[creatureId] = {
        id: creatureId,
        type: creatureType,
        position: { x: posX, y: posY, z: posZ },
        rotation: { y: Math.random() * Math.PI * 2 },
        health: 10,
        state: 'idle',
        lastStateChange: Date.now(),
        hostility: 'passive'
      };
    }
    
    // Spawn hostile creatures (only at night)
    if (Math.random() < 0.3) { // 30% chance per chunk
      const hostileCount = Math.floor(Math.random() * 2); // 0-1 hostile mobs per chunk
      
      for (let i = 0; i < hostileCount; i++) {
        // Random position within chunk
        const posX = worldX + Math.floor(Math.random() * 16);
        const posZ = worldZ + Math.floor(Math.random() * 16);
        
        // Find suitable Y coordinate (ground level)
        let posY = -1;
        
        // Search for ground from top to bottom
        for (let y = 50; y > 0; y--) {
          const blockKey = `${posX},${y},${posZ}`;
          const blockBelow = `${posX},${y-1},${posZ}`;
          
          if ((!blocks[blockKey] || blocks[blockKey] === 'air') && 
              blocks[blockBelow] && isBlockSolid(blocks[blockBelow])) {
            posY = y;
            break;
          }
        }
        
        // Skip if couldn't find valid position
        if (posY === -1) continue;
        
        // Create creature
        const creatureType = hostileCreatures[Math.floor(Math.random() * hostileCreatures.length)];
        const creatureId = `creature_${Math.random().toString(36).substr(2, 9)}`;
        
        creatures[creatureId] = {
          id: creatureId,
          type: creatureType,
          position: { x: posX, y: posY, z: posZ },
          rotation: { y: Math.random() * Math.PI * 2 },
          health: 20,
          state: 'wandering',
          lastStateChange: Date.now(),
          hostility: 'hostile'
        };
      }
    }
  });
  
  console.log(`Spawned ${Object.keys(creatures).length} creatures`);
  return creatures;
}

// Creature behavior
export function getCreatureProperties(type: CreatureType) {
  switch (type) {
    case 'cow':
      return {
        maxHealth: 10,
        speed: 0.5,
        drops: ['leather', 'beef'],
        hostility: 'passive',
        spawnBiomes: ['plains', 'forest']
      };
    case 'pig':
      return {
        maxHealth: 10,
        speed: 0.6,
        drops: ['porkchop'],
        hostility: 'passive',
        spawnBiomes: ['plains', 'forest']
      };
    case 'sheep':
      return {
        maxHealth: 8,
        speed: 0.5,
        drops: ['wool', 'mutton'],
        hostility: 'passive',
        spawnBiomes: ['plains', 'forest']
      };
    case 'chicken':
      return {
        maxHealth: 4,
        speed: 0.4,
        drops: ['feather', 'chicken'],
        hostility: 'passive',
        spawnBiomes: ['plains', 'forest']
      };
    case 'zombie':
      return {
        maxHealth: 20,
        speed: 0.6,
        damage: 2,
        drops: ['rotten_flesh'],
        hostility: 'hostile',
        spawnBiomes: ['all']
      };
    case 'skeleton':
      return {
        maxHealth: 20,
        speed: 0.6,
        damage: 3,
        drops: ['bone', 'arrow'],
        hostility: 'hostile',
        spawnBiomes: ['all']
      };
    case 'spider':
      return {
        maxHealth: 16,
        speed: 0.7,
        damage: 2,
        drops: ['string', 'spider_eye'],
        hostility: 'hostile',
        spawnBiomes: ['all']
      };
    case 'bee':
      return {
        maxHealth: 10,
        speed: 0.8,
        damage: 1,
        drops: ['honey'],
        hostility: 'neutral',
        spawnBiomes: ['plains', 'forest']
      };
    default:
      return {
        maxHealth: 10,
        speed: 0.5,
        hostility: 'passive',
        spawnBiomes: ['all']
      };
  }
}
