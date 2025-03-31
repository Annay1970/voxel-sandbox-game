/**
 * Block types supported in the game
 */
export type BlockType = 
  'air' | 'grass' | 'dirt' | 'stone' | 'sand' | 'wood' | 'leaves' | 'water' |
  'log' | 'stick' | 'craftingTable' | 'woodenPickaxe' | 'stonePickaxe' |
  'woodenAxe' | 'woodenShovel' | 'coal' | 'torch' | 'ice' | 'lava' | 
  'snow' | 'cactus' | 'glass' | 
  // New block types
  'clay' | 'obsidian' | 'flower' | 'tallGrass' | 'mushroom' | 'gravel' |
  'roseflower' | 'blueflower' | 'pumpkin' | 'melon' | 
  'ironOre' | 'goldOre' | 'redstone' | 'diamond' | 'emerald' | 'glowstone' |
  // Volcanic biome blocks
  'magmaStone' | 'volcanicAsh' | 'hotObsidian';
  
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
  },
  // New block types
  'clay': {
    solid: true,
    transparent: false,
    liquid: false,
    tool: 'shovel',
    minToolLevel: 0,
    hardness: 0.6,
    stackSize: 64
  },
  'obsidian': {
    solid: true,
    transparent: false,
    liquid: false,
    tool: 'pickaxe',
    minToolLevel: 3, // Needs diamond pickaxe
    hardness: 50.0,
    stackSize: 64
  },
  'flower': {
    solid: false,
    transparent: true,
    liquid: false,
    hardness: 0.1,
    stackSize: 64
  },
  'tallGrass': {
    solid: false,
    transparent: true,
    liquid: false,
    hardness: 0.1,
    drops: [], // Sometimes drops seeds (not implemented yet)
    stackSize: 64
  },
  'mushroom': {
    solid: false,
    transparent: true,
    liquid: false,
    hardness: 0.1,
    stackSize: 64
  },
  'gravel': {
    solid: true,
    transparent: false,
    liquid: false,
    tool: 'shovel',
    minToolLevel: 0,
    hardness: 0.6,
    drops: [
      { type: 'gravel', chance: 0.9 },
      { type: 'stick', chance: 0.1 }
    ],
    stackSize: 64
  },
  'roseflower': {
    solid: false,
    transparent: true,
    liquid: false,
    hardness: 0.1,
    stackSize: 64
  },
  'blueflower': {
    solid: false,
    transparent: true,
    liquid: false,
    hardness: 0.1,
    stackSize: 64
  },
  'pumpkin': {
    solid: true,
    transparent: false,
    liquid: false,
    tool: 'axe',
    minToolLevel: 0,
    hardness: 1.0,
    stackSize: 64
  },
  'melon': {
    solid: true,
    transparent: false,
    liquid: false,
    tool: 'axe',
    minToolLevel: 0,
    hardness: 1.0,
    stackSize: 64
  },
  'ironOre': {
    solid: true,
    transparent: false,
    liquid: false,
    tool: 'pickaxe',
    minToolLevel: 1, // Needs at least wooden pickaxe
    hardness: 3.0,
    drops: 'ironOre',
    stackSize: 64
  },
  'goldOre': {
    solid: true,
    transparent: false,
    liquid: false,
    tool: 'pickaxe',
    minToolLevel: 2, // Needs at least stone pickaxe
    hardness: 3.0,
    drops: 'goldOre',
    stackSize: 64
  },
  'redstone': {
    solid: true,
    transparent: false,
    liquid: false,
    tool: 'pickaxe',
    minToolLevel: 2, // Needs at least stone pickaxe
    hardness: 3.0,
    drops: 'redstone',
    stackSize: 64
  },
  'diamond': {
    solid: true,
    transparent: false,
    liquid: false,
    tool: 'pickaxe',
    minToolLevel: 2, // Needs at least stone pickaxe
    hardness: 3.0,
    drops: 'diamond',
    stackSize: 64
  },
  'emerald': {
    solid: true,
    transparent: false,
    liquid: false,
    tool: 'pickaxe',
    minToolLevel: 2, // Needs at least stone pickaxe
    hardness: 3.0,
    drops: 'emerald',
    stackSize: 64
  },
  'glowstone': {
    solid: true,
    transparent: true,
    liquid: false,
    tool: 'pickaxe',
    minToolLevel: 0,
    hardness: 0.3,
    drops: 'glowstone',
    stackSize: 64
  },
  // Volcanic biome blocks
  'magmaStone': {
    solid: true,
    transparent: false,
    liquid: false,
    tool: 'pickaxe',
    minToolLevel: 2, // Needs at least stone pickaxe
    hardness: 2.5,
    drops: [
      { type: 'stone', chance: 0.6 },
      { type: 'coal', chance: 0.3 }
    ],
    stackSize: 64
  },
  'volcanicAsh': {
    solid: true,
    transparent: false,
    liquid: false,
    tool: 'shovel',
    minToolLevel: 0,
    hardness: 0.4,
    stackSize: 64
  },
  'hotObsidian': {
    solid: true,
    transparent: false,
    liquid: false,
    tool: 'pickaxe',
    minToolLevel: 3, // Needs diamond pickaxe
    hardness: 40.0,
    drops: 'obsidian',
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
  if (type === 'magmaStone') {
    return { damage: 2, cooldown: 1000 }; // 2 damage every second
  }
  if (type === 'hotObsidian') {
    return { damage: 3, cooldown: 1200 }; // 3 damage every 1.2 seconds
  }
  if (type === 'volcanicAsh') {
    return { damage: 1, cooldown: 2000 }; // 1 damage every 2 seconds (hot ash)
  }
  return null;
}

/**
 * Check if a block emits light
 * Returns boolean or light intensity object with RGB values
 */
export function isBlockLightEmitter(type: BlockType): boolean | { intensity: number, color: [number, number, number] } {
  // Enhanced blocks with custom light properties
  if (type === 'magmaStone') {
    return { 
      intensity: 0.7, 
      color: [1.0, 0.5, 0.2] // Orange-red glow
    };
  }
  
  if (type === 'hotObsidian') {
    return { 
      intensity: 0.9, 
      color: [1.0, 0.3, 0.1] // Intense red glow
    };
  }
  
  if (type === 'lava') {
    return { 
      intensity: 1.0, 
      color: [1.0, 0.6, 0.1] // Bright yellow-orange
    };
  }
  
  if (type === 'glowstone') {
    return { 
      intensity: 0.95, 
      color: [1.0, 0.9, 0.6] // Warm yellow light
    };
  }
  
  // Simple boolean for other light-emitting blocks
  return type === 'torch' || type === 'redstone' || 
         type === 'diamond' || type === 'emerald' || 
         type === 'volcanicAsh'; // Volcanic ash has a faint glow
}

/**
 * Check if a block affects player movement
 * Returns an object with movement properties
 */
export function getBlockMovementEffect(type: BlockType): { 
  slowdown?: number, 
  bounce?: number,
  slippery?: boolean,
  speedBoost?: number
} {
  if (type === 'water') {
    return { slowdown: 0.5 }; // Slows down player by a lot
  }
  if (type === 'ice') {
    return { slippery: true };
  }
  if (type === 'snow') {
    return { slowdown: 0.2 }; // Slows down player a bit
  }
  if (type === 'volcanicAsh') {
    return { slowdown: 0.3 }; // Slows down player, ashy ground is hard to walk on
  }
  if (type === 'magmaStone') {
    return { 
      speedBoost: 0.2, // Slight boost from the heat updraft
      bounce: 0.1 // Small bounce effect from the hot surface
    };
  }
  if (type === 'hotObsidian') {
    return { 
      speedBoost: 0.3, // Faster speed boost on hot obsidian
      bounce: 0.2 // More bounce from super hot obsidian
    };
  }
  return {};
}

/**
 * Check if a block can be affected by temperature (melting/freezing)
 */
export function isBlockTemperatureReactive(type: BlockType): boolean {
  return type === 'ice' || type === 'snow' || type === 'hotObsidian' || 
         type === 'magmaStone' || type === 'volcanicAsh';
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
  if (type === 'hotObsidian' || type === 'magmaStone') {
    return {
      mustBeOnSolid: true,
      cannotBeUnderWater: true // Water would cool these blocks
    };
  }
  if (type === 'volcanicAsh') {
    return {
      mustBeOnSolid: true
    };
  }
  return {};
}

/**
 * Get temperature effect on the player from a block
 * Returns a value that should be applied to player's temperature (-1 to 1 scale)
 * Negative values cool the player, positive values heat the player
 */
export function getBlockTemperatureEffect(type: BlockType): { 
  effect: number,
  radius: number,
  intensity: number
} | null {
  if (type === 'lava') {
    return { 
      effect: 0.2, // Strong heating effect
      radius: 4,  // Affects player from 4 blocks away
      intensity: 1.0 // Full intensity
    };
  }
  if (type === 'magmaStone') {
    return { 
      effect: 0.12,
      radius: 3,
      intensity: 0.8
    };
  }
  if (type === 'hotObsidian') {
    return { 
      effect: 0.15,
      radius: 3,
      intensity: 0.9
    };
  }
  if (type === 'volcanicAsh') {
    return { 
      effect: 0.05,
      radius: 2,
      intensity: 0.5
    };
  }
  if (type === 'torch') {
    return { 
      effect: 0.03, // Mild heating effect
      radius: 2,
      intensity: 0.4
    };
  }
  if (type === 'ice') {
    return { 
      effect: -0.1, // Cooling effect
      radius: 3,
      intensity: 0.7
    };
  }
  if (type === 'snow') {
    return { 
      effect: -0.05, // Mild cooling effect
      radius: 1,
      intensity: 0.5
    };
  }
  if (type === 'water') {
    return { 
      effect: -0.07, // Cooling effect when in water
      radius: 0, // Only affects when inside block
      intensity: 1.0
    };
  }
  return null; // No temperature effect
}