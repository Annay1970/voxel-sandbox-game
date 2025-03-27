// Block types
export type BlockType = 
  'air' | 'grass' | 'dirt' | 'stone' | 'sand' | 'wood' | 'leaves' | 'water' |
  'log' | 'stick' | 'craftingTable' | 'woodenPickaxe' | 'stonePickaxe' |
  'woodenAxe' | 'woodenShovel' | 'coal' | 'torch';

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
