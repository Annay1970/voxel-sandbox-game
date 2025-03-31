import { BlockType } from './blocks';

export type RecipeCategory = 'Basic' | 'Tools' | 'Weapons' | 'Armor' | 'Special' | 'Building';

export interface CraftingRecipe {
  id: string;  // Unique identifier for the recipe
  name: string;
  output: {
    type: BlockType;
    count: number;
  };
  ingredients: {
    type: BlockType;
    count: number;
  }[];
  requiresCraftingTable: boolean;
  category: RecipeCategory;
  unlocked: boolean; // Start with some recipes locked until certain conditions are met
}

// Define all crafting recipes
export const CRAFTING_RECIPES: CraftingRecipe[] = [
  // Basic recipes (no crafting table required)
  {
    id: 'wood_planks',
    name: 'Wood Planks',
    output: { type: 'wood', count: 4 },
    ingredients: [{ type: 'log', count: 1 }],
    requiresCraftingTable: false,
    category: 'Basic',
    unlocked: true
  },
  {
    id: 'sticks',
    name: 'Sticks',
    output: { type: 'stick', count: 4 },
    ingredients: [{ type: 'wood', count: 2 }],
    requiresCraftingTable: false,
    category: 'Basic',
    unlocked: true
  },
  {
    id: 'crafting_table',
    name: 'Crafting Table',
    output: { type: 'craftingTable', count: 1 },
    ingredients: [{ type: 'wood', count: 4 }],
    requiresCraftingTable: false,
    category: 'Basic',
    unlocked: true
  },
  {
    id: 'torches',
    name: 'Torches',
    output: { type: 'torch', count: 4 },
    ingredients: [
      { type: 'stick', count: 1 },
      { type: 'coal', count: 1 }
    ],
    requiresCraftingTable: false,
    category: 'Basic',
    unlocked: true
  },
  
  // Tools (require crafting table)
  {
    id: 'wooden_pickaxe',
    name: 'Wooden Pickaxe',
    output: { type: 'woodenPickaxe', count: 1 },
    ingredients: [
      { type: 'wood', count: 3 },
      { type: 'stick', count: 2 }
    ],
    requiresCraftingTable: true,
    category: 'Tools',
    unlocked: true
  },
  {
    id: 'wooden_axe',
    name: 'Wooden Axe',
    output: { type: 'woodenAxe', count: 1 },
    ingredients: [
      { type: 'wood', count: 3 },
      { type: 'stick', count: 2 }
    ],
    requiresCraftingTable: true,
    category: 'Tools',
    unlocked: true
  },
  {
    id: 'wooden_shovel',
    name: 'Wooden Shovel',
    output: { type: 'woodenShovel', count: 1 },
    ingredients: [
      { type: 'wood', count: 1 },
      { type: 'stick', count: 2 }
    ],
    requiresCraftingTable: true,
    category: 'Tools',
    unlocked: true
  },
  {
    id: 'stone_pickaxe',
    name: 'Stone Pickaxe',
    output: { type: 'stonePickaxe', count: 1 },
    ingredients: [
      { type: 'stone', count: 3 },
      { type: 'stick', count: 2 }
    ],
    requiresCraftingTable: true,
    category: 'Tools',
    unlocked: true
  },
  
  // Creature loot recipes
  {
    id: 'leather_boots',
    name: 'Leather Boots',
    output: { type: 'craftingTable', count: 1 }, // Placeholder output type
    ingredients: [
      { type: 'wood', count: 3 }, // Placeholder for leather
      { type: 'stick', count: 1 }
    ],
    requiresCraftingTable: true,
    category: 'Armor',
    unlocked: false // Will be unlocked when leather is obtained
  },
  {
    id: 'bone_meal',
    name: 'Bone Meal',
    output: { type: 'sand', count: 3 }, // Placeholder output type
    ingredients: [
      { type: 'stick', count: 1 } // Placeholder for bone
    ],
    requiresCraftingTable: false,
    category: 'Special',
    unlocked: false
  },
  {
    id: 'web_trap',
    name: 'Web Trap',
    output: { type: 'stick', count: 1 }, // Placeholder output type
    ingredients: [
      { type: 'stick', count: 3 }, // Placeholder for spider web
      { type: 'wood', count: 2 }
    ],
    requiresCraftingTable: true,
    category: 'Special',
    unlocked: false
  },
  {
    id: 'honey_bread',
    name: 'Honey Bread',
    output: { type: 'stick', count: 1 }, // Placeholder output type
    ingredients: [
      { type: 'wood', count: 2 }, // Placeholder for wheat
      { type: 'stick', count: 1 } // Placeholder for honey
    ],
    requiresCraftingTable: true,
    category: 'Special',
    unlocked: false
  },
  
  // Blood Moon special recipes
  {
    id: 'soul_lantern',
    name: 'Soul Lantern',
    output: { type: 'torch', count: 1 }, // Placeholder output type
    ingredients: [
      { type: 'torch', count: 1 },
      { type: 'glass', count: 1 },
      { type: 'stick', count: 1 } // Placeholder for wraith essence
    ],
    requiresCraftingTable: true,
    category: 'Special',
    unlocked: false
  },
  {
    id: 'spectral_bow',
    name: 'Spectral Bow',
    output: { type: 'woodenAxe', count: 1 }, // Placeholder output type
    ingredients: [
      { type: 'stick', count: 3 },
      { type: 'wood', count: 3 },
      { type: 'stick', count: 1 } // Placeholder for wraith essence
    ],
    requiresCraftingTable: true,
    category: 'Weapons',
    unlocked: false
  }
];

// Helper functions
export function getRecipesByCategory(category: RecipeCategory): CraftingRecipe[] {
  return CRAFTING_RECIPES.filter(recipe => recipe.category === category && recipe.unlocked);
}

export function getUnlockedRecipes(): CraftingRecipe[] {
  return CRAFTING_RECIPES.filter(recipe => recipe.unlocked);
}

export function canCraftRecipe(
  recipe: CraftingRecipe, 
  inventory: { type: BlockType, count: number }[]
): boolean {
  // Check if each ingredient is available in sufficient quantity
  for (const ingredient of recipe.ingredients) {
    // Find the ingredient in inventory
    const inventoryItem = inventory.find(item => item.type === ingredient.type);
    
    // Check if we have enough
    if (!inventoryItem || inventoryItem.count < ingredient.count) {
      return false;
    }
  }
  
  return true;
}