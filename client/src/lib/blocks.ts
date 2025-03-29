// Block types
export type BlockType = 
  'air' | 'grass' | 'dirt' | 'stone' | 'sand' | 'wood' | 'leaves' | 'water' |
  'log' | 'stick' | 'craftingTable' | 'woodenPickaxe' | 'stonePickaxe' |
  'woodenAxe' | 'woodenShovel' | 'coal' | 'torch' | 'ice' | 'lava' | 
  'snow' | 'cactus' | 'glass';

// Block properties
export interface BlockProperties {
  solid: boolean;
  transparent: boolean;
  liquid: boolean;
  tool?: 'hand' | 'pickaxe' | 'axe' | 'shovel';
  minToolLevel?: number; // 0 = hand, 1 = wood, 2 = stone, etc.
  hardness: number; // Mining time multiplier
  drops?: BlockType | { type: BlockType, chance: number }[];
  stackSize: number;
}

// Block definitions
export const BLOCK_PROPERTIES: Record<BlockType, BlockProperties> = {
  'air': {
    solid: false,
    transparent: true,
    liquid: false,
    hardness: 0,
    stackSize: 0
  },
  'grass': {
    solid: true,
    transparent: false,
    liquid: false,
    tool: 'shovel',
    hardness: 0.6,
    drops: 'dirt',
    stackSize: 64
  },
  'dirt': {
    solid: true,
    transparent: false,
    liquid: false,
    tool: 'shovel',
    hardness: 0.5,
    stackSize: 64
  },
  'stone': {
    solid: true,
    transparent: false,
    liquid: false,
    tool: 'pickaxe',
    minToolLevel: 1,
    hardness: 1.5,
    drops: 'stone',
    stackSize: 64
  },
  'sand': {
    solid: true,
    transparent: false,
    liquid: false,
    tool: 'shovel',
    hardness: 0.5,
    stackSize: 64
  },
  'wood': {
    solid: true,
    transparent: false,
    liquid: false,
    tool: 'axe',
    hardness: 2,
    stackSize: 64
  },
  'leaves': {
    solid: true,
    transparent: true,
    liquid: false,
    hardness: 0.2,
    drops: [
      { type: 'stick', chance: 0.05 },
      { type: 'leaves', chance: 0.1 }
    ],
    stackSize: 64
  },
  'water': {
    solid: false,
    transparent: true,
    liquid: true,
    hardness: 100, // Cannot mine water
    stackSize: 0
  },
  'log': {
    solid: true,
    transparent: false,
    liquid: false,
    tool: 'axe',
    hardness: 2,
    stackSize: 64
  },
  'stick': {
    solid: false,
    transparent: false,
    liquid: false,
    hardness: 0,
    stackSize: 64
  },
  'craftingTable': {
    solid: true,
    transparent: false,
    liquid: false,
    tool: 'axe',
    hardness: 2.5,
    stackSize: 64
  },
  'woodenPickaxe': {
    solid: false,
    transparent: false,
    liquid: false,
    hardness: 0,
    stackSize: 1
  },
  'stonePickaxe': {
    solid: false,
    transparent: false,
    liquid: false,
    hardness: 0,
    stackSize: 1
  },
  'woodenAxe': {
    solid: false,
    transparent: false,
    liquid: false,
    hardness: 0,
    stackSize: 1
  },
  'woodenShovel': {
    solid: false,
    transparent: false,
    liquid: false,
    hardness: 0,
    stackSize: 1
  },
  'coal': {
    solid: false,
    transparent: false,
    liquid: false,
    hardness: 0,
    stackSize: 64
  },
  'torch': {
    solid: false,
    transparent: true,
    liquid: false,
    hardness: 0.1,
    stackSize: 64
  },
  'ice': {
    solid: true,
    transparent: true,
    liquid: false,
    hardness: 0.5,
    tool: 'pickaxe',
    drops: [], // Ice breaks into water when mined
    stackSize: 64
    // Special properties:
    // - Players slide on ice (increased movement speed)
    // - Can see through ice (transparency)
    // - Melts into water in hot biomes
  },
  'lava': {
    solid: false,
    transparent: true,
    liquid: true,
    hardness: 100, // Cannot mine lava
    stackSize: 0
    // Special properties:
    // - Damages player on contact
    // - Emits light (illuminates surrounding area)
    // - Slowly flows and spreads
    // - Turns into stone or obsidian when contacting water
  },
  'snow': {
    solid: true,
    transparent: false,
    liquid: false,
    tool: 'shovel',
    hardness: 0.2,
    drops: 'snow',
    stackSize: 64
    // Special properties:
    // - Slows player movement slightly
    // - Makes softer sound when walked on
    // - Can accumulate in layers during snowfall
    // - Melts in hot biomes
  },
  'cactus': {
    solid: true,
    transparent: true,
    liquid: false,
    hardness: 0.4,
    drops: 'cactus',
    stackSize: 64
    // Special properties:
    // - Damages player on contact
    // - Can only be placed on sand
    // - Grows over time if on sand
    // - Destroys items that touch it
  },
  'glass': {
    solid: true,
    transparent: true,
    liquid: false,
    tool: 'pickaxe',
    hardness: 0.3,
    drops: [], // Glass doesn't drop anything when broken
    stackSize: 64
  }
};

// Helper functions
export function isBlockSolid(type: BlockType): boolean {
  return BLOCK_PROPERTIES[type]?.solid || false;
}

export function isBlockTransparent(type: BlockType): boolean {
  return BLOCK_PROPERTIES[type]?.transparent || false;
}

export function isBlockLiquid(type: BlockType): boolean {
  return BLOCK_PROPERTIES[type]?.liquid || false;
}

export function getBlockHardness(type: BlockType): number {
  return BLOCK_PROPERTIES[type]?.hardness || 0;
}

export function getRequiredTool(type: BlockType): { tool?: string, level: number } {
  const props = BLOCK_PROPERTIES[type];
  return {
    tool: props?.tool,
    level: props?.minToolLevel || 0
  };
}

export function getBlockDrops(type: BlockType): { type: BlockType, count: number }[] {
  const props = BLOCK_PROPERTIES[type];
  
  if (!props?.drops) {
    // Default to dropping itself
    return [{ type, count: 1 }];
  }
  
  if (typeof props.drops === 'string') {
    // Single drop
    return [{ type: props.drops, count: 1 }];
  }
  
  // Multiple drops with chances
  const drops: { type: BlockType, count: number }[] = [];
  
  props.drops.forEach(drop => {
    if (Math.random() < drop.chance) {
      drops.push({ type: drop.type, count: 1 });
    }
  });
  
  return drops;
}

// Special block property detection functions

/**
 * Check if a block is damaging to players on contact
 */
export function isBlockDamaging(type: BlockType): boolean {
  return type === 'lava' || type === 'cactus';
}

/**
 * Check if a block emits light
 */
export function isBlockLightEmitter(type: BlockType): boolean {
  return type === 'lava' || type === 'torch';
}

/**
 * Check if a block affects player movement
 * Returns an object with movement properties
 */
export function getBlockMovementEffect(type: BlockType): { 
  speedMultiplier: number,
  slippery: boolean 
} {
  switch (type) {
    case 'ice':
      return { speedMultiplier: 1.5, slippery: true };
    case 'snow':
      return { speedMultiplier: 0.8, slippery: false };
    case 'water':
      return { speedMultiplier: 0.5, slippery: false };
    case 'lava':
      return { speedMultiplier: 0.25, slippery: false };
    default:
      return { speedMultiplier: 1.0, slippery: false };
  }
}

/**
 * Check if a block can be affected by temperature (melting/freezing)
 */
export function isBlockTemperatureReactive(type: BlockType): boolean {
  return type === 'ice' || type === 'snow';
}

/**
 * Check if a block is a plant or can grow
 */
export function isBlockGrowable(type: BlockType): boolean {
  return type === 'cactus';
}

/**
 * Check if a block has placement restrictions
 */
export function getBlockPlacementRestrictions(type: BlockType): { 
  validSurfaces: BlockType[]
} {
  switch (type) {
    case 'cactus':
      return { validSurfaces: ['sand'] };
    case 'torch':
      return { validSurfaces: ['stone', 'dirt', 'grass', 'wood', 'log', 'sand', 'snow'] };
    default:
      return { validSurfaces: [] }; // No restrictions
  }
}
