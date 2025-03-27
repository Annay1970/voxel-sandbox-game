import { useState } from 'react';
import { useVoxelGame, BlockType } from '../../lib/stores/useVoxelGame';
import { cn } from '../../lib/utils';

interface CraftingProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function Crafting({ isOpen, onClose }: CraftingProps) {
  const inventory = useVoxelGame(state => state.inventory);
  const craftItem = useVoxelGame(state => state.craftItem);
  
  const [selectedRecipe, setSelectedRecipe] = useState<number | null>(null);
  
  if (!isOpen) return null;
  
  // More advanced crafting recipes
  const recipes = [
    {
      name: 'Wooden Planks',
      output: 'wood' as BlockType,
      count: 4,
      ingredients: [{ type: 'log' as BlockType, count: 1 }],
    },
    {
      name: 'Sticks',
      output: 'stick' as BlockType,
      count: 4,
      ingredients: [{ type: 'wood' as BlockType, count: 2 }],
    },
    {
      name: 'Crafting Table',
      output: 'craftingTable' as BlockType,
      count: 1,
      ingredients: [{ type: 'wood' as BlockType, count: 4 }],
    },
    {
      name: 'Wooden Pickaxe',
      output: 'woodenPickaxe' as BlockType,
      count: 1,
      ingredients: [
        { type: 'wood' as BlockType, count: 3 },
        { type: 'stick' as BlockType, count: 2 }
      ],
    },
    {
      name: 'Stone Pickaxe',
      output: 'stonePickaxe' as BlockType,
      count: 1,
      ingredients: [
        { type: 'stone' as BlockType, count: 3 },
        { type: 'stick' as BlockType, count: 2 }
      ],
    },
    {
      name: 'Wooden Axe',
      output: 'woodenAxe' as BlockType,
      count: 1,
      ingredients: [
        { type: 'wood' as BlockType, count: 3 },
        { type: 'stick' as BlockType, count: 2 }
      ],
    },
    {
      name: 'Wooden Shovel',
      output: 'woodenShovel' as BlockType,
      count: 1,
      ingredients: [
        { type: 'wood' as BlockType, count: 1 },
        { type: 'stick' as BlockType, count: 2 }
      ],
    },
    {
      name: 'Torch',
      output: 'torch' as BlockType,
      count: 4,
      ingredients: [
        { type: 'stick' as BlockType, count: 1 },
        { type: 'coal' as BlockType, count: 1 }
      ],
    }
  ];
  
  // Check if player can craft a recipe
  const canCraft = (recipe: typeof recipes[0]) => {
    return recipe.ingredients.every(ingredient => {
      const inventoryItem = inventory.find(item => item.type === ingredient.type);
      return inventoryItem && inventoryItem.count >= ingredient.count;
    });
  };
  
  // Handle crafting
  const handleCraft = (recipeIndex: number) => {
    const recipe = recipes[recipeIndex];
    if (canCraft(recipe)) {
      craftItem(recipe.output, recipe.count, recipe.ingredients);
    }
  };
  
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-60">
      <div className="bg-gray-800 text-white p-6 rounded-lg w-[500px] max-h-[600px] overflow-y-auto">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-2xl font-bold">Crafting Table</h2>
          <button 
            onClick={onClose}
            className="text-gray-400 hover:text-white text-lg"
          >
            ✕
          </button>
        </div>
        
        <div className="grid grid-cols-1 gap-3 mt-4">
          {recipes.map((recipe, index) => (
            <div 
              key={recipe.name}
              className={cn(
                "p-3 border rounded flex justify-between items-center transition-colors",
                canCraft(recipe) 
                  ? "border-gray-600 hover:border-blue-500 cursor-pointer" 
                  : "border-gray-700 opacity-60",
                selectedRecipe === index ? "border-blue-500 bg-blue-900 bg-opacity-30" : ""
              )}
              onClick={() => setSelectedRecipe(index)}
            >
              <div>
                <div className="font-bold">{recipe.name}</div>
                <div className="text-sm text-gray-300 mt-1">
                  Requires:
                  <ul className="list-disc list-inside">
                    {recipe.ingredients.map((ingredient, idx) => (
                      <li key={idx} className={
                        inventory.find(i => i.type === ingredient.type && i.count >= ingredient.count)
                          ? "text-green-400"
                          : "text-red-400"
                      }>
                        {ingredient.count}x {ingredient.type}
                      </li>
                    ))}
                  </ul>
                </div>
              </div>
              <div className="flex flex-col items-center">
                <div className="w-12 h-12 flex items-center justify-center rounded" style={{
                  backgroundColor: getBlockColor(recipe.output)
                }}>
                  {recipe.output.slice(0, 2).toUpperCase()}
                </div>
                <span className="text-sm mt-1">{recipe.count}x</span>
              </div>
            </div>
          ))}
        </div>
        
        <div className="mt-6 flex justify-end">
          <button
            className={cn(
              "px-4 py-2 rounded font-bold",
              selectedRecipe !== null && canCraft(recipes[selectedRecipe])
                ? "bg-blue-600 hover:bg-blue-700"
                : "bg-gray-600 cursor-not-allowed"
            )}
            onClick={() => {
              if (selectedRecipe !== null && canCraft(recipes[selectedRecipe])) {
                handleCraft(selectedRecipe);
              }
            }}
          >
            Craft
          </button>
        </div>
      </div>
    </div>
  );
}

// Helper function to get a color for block type
function getBlockColor(type: BlockType): string {
  switch (type) {
    case 'grass': return '#7cac5d';
    case 'dirt': return '#9b7653';
    case 'stone': return '#aaaaaa';
    case 'sand': return '#e5b962';
    case 'wood': return '#8c6e4b';
    case 'log': return '#6e4b2c';
    case 'leaves': return '#2ecc71';
    case 'water': return '#3498db';
    case 'stick': return '#a67c52';
    case 'coal': return '#333333';
    case 'craftingTable': return '#a05a2c';
    case 'woodenPickaxe': return '#cd853f';
    case 'stonePickaxe': return '#a9a9a9';
    case 'woodenAxe': return '#deb887';
    case 'woodenShovel': return '#daa520';
    case 'torch': return '#ffa500';
    default: return '#ffffff';
  }
}
