/**
 * Block types supported in the game
 */
export type BlockType = 
  'air' | 'grass' | 'dirt' | 'stone' | 'sand' | 'wood' | 'leaves' | 'water' |
  'log' | 'stick' | 'craftingTable' | 'woodenPickaxe' | 'stonePickaxe' |
  'woodenAxe' | 'woodenShovel' | 'coal' | 'torch' | 'ice' | 'lava' | 
  'snow' | 'cactus' | 'glass';
  
/**
 * Properties of each block type
 */
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

/**
 * Block properties for each block type
 */
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
    minToolLevel: 0,
    hardness: 0.6,
    drops: 'dirt',
    stackSize: 64
  },
  'dirt': {
    solid: true,
    transparent: false,
    liquid: false,
    tool: 'shovel',
    minToolLevel: 0,
    hardness: 0.5,
    stackSize: 64
  },
  'stone': {
    solid: true,
    transparent: false,
    liquid: false,
    tool: 'pickaxe',
    minToolLevel: 1, // Needs at least wooden pickaxe
    hardness: 1.5,
    drops: 'stone',
    stackSize: 64
  },
  'sand': {
    solid: true,
    transparent: false,
    liquid: false,
    tool: 'shovel',
    minToolLevel: 0,
    hardness: 0.5,
    stackSize: 64
  },
  'wood': {
    solid: true,
    transparent: false,
    liquid: false,
    tool: 'axe',
    minToolLevel: 0,
    hardness: 2.0,
    stackSize: 64
  },
  'leaves': {
    solid: true,
    transparent: true,
    liquid: false,
    hardness: 0.2,
    drops: [
      { type: 'stick', chance: 0.1 },
      { type: 'leaves', chance: 0.05 }
    ],
    stackSize: 64
  },
  'water': {
    solid: false,
    transparent: true,
    liquid: true,
    hardness: 100, // Cannot be mined
    stackSize: 0
  },
  'log': {
    solid: true,
    transparent: false,
    liquid: false,
    tool: 'axe',
    minToolLevel: 0,
    hardness: 2.0,
    stackSize: 64
  },
  'stick': {
    solid: false,
    transparent: false,
    liquid: false,
    hardness: 0.5,
    stackSize: 64
  },
  'craftingTable': {
    solid: true,
    transparent: false,
    liquid: false,
    tool: 'axe',
    minToolLevel: 0,
    hardness: 2.5,
    stackSize: 1
  },
  'woodenPickaxe': {
    solid: false,
    transparent: false,
    liquid: false,
    hardness: 0.5,
    stackSize: 1
  },
  'stonePickaxe': {
    solid: false,
    transparent: false,
    liquid: false,
    hardness: 0.5,
    stackSize: 1
  },
  'woodenAxe': {
    solid: false,
    transparent: false,
    liquid: false,
    hardness: 0.5,
    stackSize: 1
  },
  'woodenShovel': {
    solid: false,
    transparent: false,
    liquid: false,
    hardness: 0.5,
    stackSize: 1
  },
  'coal': {
    solid: true,
    transparent: false,
    liquid: false,
    tool: 'pickaxe',
    minToolLevel: 1,
    hardness: 3.0,
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
    tool: 'pickaxe',
    minToolLevel: 0,
    hardness: 0.5,
    drops: 'water', // Ice turns to water when broken without silk touch
    stackSize: 64
  },
  'lava': {
    solid: false,
    transparent: true,
    liquid: true,
    hardness: 100, // Cannot be mined
    stackSize: 0
  },
  'snow': {
    solid: true,
    transparent: false,
    liquid: false,
    tool: 'shovel',
    minToolLevel: 0,
    hardness: 0.1,
    stackSize: 64
  },
  'cactus': {
    solid: true,
    transparent: false,
    liquid: false,
    hardness: 0.4,
    stackSize: 64
  },
  'glass': {
    solid: true,
    transparent: true,
    liquid: false,
    tool: 'pickaxe',
    minToolLevel: 0,
    hardness: 0.3,
    drops: [], // Glass doesn't drop anything when broken
    stackSize: 64
  }
};

/**
 * Check if a block is solid (can be collided with)
 */
export function isBlockSolid(type: BlockType): boolean {
  return BLOCK_PROPERTIES[type]?.solid || false;
}

/**
 * Check if a block is transparent (can see through)
 */
export function isBlockTransparent(type: BlockType): boolean {
  return BLOCK_PROPERTIES[type]?.transparent || false;
}

/**
 * Check if a block is a liquid (has flowing behavior)
 */
export function isBlockLiquid(type: BlockType): boolean {
  return BLOCK_PROPERTIES[type]?.liquid || false;
}

/**
 * Get the hardness of a block (how long it takes to mine)
 */
export function getBlockHardness(type: BlockType): number {
  return BLOCK_PROPERTIES[type]?.hardness || 0;
}

/**
 * Get the tool required to mine a block
 */
export function getRequiredTool(type: BlockType): { tool?: string, level: number } {
  const props = BLOCK_PROPERTIES[type];
  return {
    tool: props?.tool,
    level: props?.minToolLevel || 0
  };
}

/**
 * Get the drops from breaking a block
 */
export function getBlockDrops(type: BlockType): { type: BlockType, count: number }[] {
  const props = BLOCK_PROPERTIES[type];
  const drops: { type: BlockType, count: number }[] = [];
  
  if (!props) return drops;
  
  if (!props.drops) {
    // If no drops specified, block drops itself
    drops.push({ type, count: 1 });
  } else if (typeof props.drops === 'string') {
    // If drops is a string, it's a single block type
    drops.push({ type: props.drops, count: 1 });
  } else if (Array.isArray(props.drops)) {
    // If drops is an array, it's a list of possible drops with chances
    for (const drop of props.drops) {
      if (Math.random() <= drop.chance) {
        drops.push({ type: drop.type, count: 1 });
      }
    }
  }
  
  return drops;
}

/**
 * Check if a block causes damage to the player
 */
export function isBlockDamaging(type: BlockType): { damage: number, cooldown: number } | null {
  if (type === 'lava') {
    return { damage: 4, cooldown: 750 }; // 4 damage every 0.75 seconds
  }
  if (type === 'cactus') {
    return { damage: 1, cooldown: 1000 }; // 1 damage every second
  }
  return null;
}

/**
 * Check if a block emits light
 */
export function isBlockLightEmitter(type: BlockType): boolean {
  return type === 'torch' || type === 'lava';
}

/**
 * Check if a block affects player movement
 * Returns an object with movement properties
 */
export function getBlockMovementEffect(type: BlockType): { 
  slowdown?: number, 
  bounce?: number,
  slippery?: boolean
} {
  if (type === 'water') {
    return { slowdown: 0.5 }; // Slows down player by 50%
  }
  if (type === 'ice') {
    return { slippery: true };
  }
  if (type === 'snow') {
    return { slowdown: 0.2 }; // Slows down player by 20%
  }
  return {};
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
  mustBeOnSolid?: boolean,
  cannotBeUnderWater?: boolean,
  cannotBeNextToSolid?: boolean
} {
  if (type === 'torch') {
    return { 
      mustBeOnSolid: true,
      cannotBeUnderWater: true
    };
  }
  if (type === 'cactus') {
    return {
      mustBeOnSolid: true,
      cannotBeNextToSolid: true
    };
  }
  return {};
}