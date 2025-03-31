import { useState } from 'react';
import { useVoxelGame } from '../../lib/stores/useVoxelGame';
import { BlockType } from '../../lib/blocks';
import { cn } from '../../lib/utils';
import { CraftingRecipe, RecipeCategory, getRecipesByCategory, getUnlockedRecipes, canCraftRecipe } from '../../lib/crafting';

interface CraftingProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function Crafting({ isOpen, onClose }: CraftingProps) {
  const inventory = useVoxelGame(state => state.inventory);
  const craftItem = useVoxelGame(state => state.craftItem);
  
  const [selectedRecipe, setSelectedRecipe] = useState<string | null>(null);
  const [selectedCategory, setSelectedCategory] = useState<RecipeCategory | 'All'>('All');
  
  if (!isOpen) return null;
  
  // Get recipes based on selected category
  const recipes = selectedCategory === 'All' 
    ? getUnlockedRecipes() 
    : getRecipesByCategory(selectedCategory);
  
  // Handle crafting
  const handleCraft = (recipeId: string) => {
    const recipe = recipes.find(r => r.id === recipeId);
    if (recipe && canCraftRecipe(recipe, inventory)) {
      craftItem(
        recipe.output.type, 
        recipe.output.count, 
        recipe.ingredients
      );
    }
  };
  
  // Available categories
  const categories: (RecipeCategory | 'All')[] = [
    'All', 'Basic', 'Tools', 'Weapons', 'Armor', 'Special', 'Building'
  ];
  
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-60">
      <div className="bg-gray-800 text-white p-6 rounded-lg w-[600px] max-h-[700px] overflow-y-auto">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-2xl font-bold">Crafting Table</h2>
          <button 
            onClick={onClose}
            className="text-gray-400 hover:text-white text-lg"
          >
            ✕
          </button>
        </div>
        
        {/* Category Selection */}
        <div className="mb-4 flex flex-wrap gap-2">
          {categories.map(category => (
            <button
              key={category}
              className={cn(
                "px-3 py-1 rounded text-sm font-medium",
                selectedCategory === category
                  ? "bg-blue-600 text-white"
                  : "bg-gray-700 text-gray-200 hover:bg-gray-600"
              )}
              onClick={() => setSelectedCategory(category)}
            >
              {category}
            </button>
          ))}
        </div>
        
        {/* Recipe List */}
        <div className="grid grid-cols-1 gap-3 mt-4">
          {recipes.length === 0 ? (
            <p className="text-gray-400 text-center py-4">No recipes available in this category.</p>
          ) : (
            recipes.map((recipe) => {
              const craftable = canCraftRecipe(recipe, inventory);
              
              return (
                <div 
                  key={recipe.id}
                  className={cn(
                    "p-3 border rounded flex justify-between items-center transition-colors",
                    craftable 
                      ? "border-gray-600 hover:border-blue-500 cursor-pointer" 
                      : "border-gray-700 opacity-60",
                    selectedRecipe === recipe.id ? "border-blue-500 bg-blue-900 bg-opacity-30" : ""
                  )}
                  onClick={() => setSelectedRecipe(recipe.id)}
                >
                  <div className="flex-1">
                    <div className="font-bold">{recipe.name}</div>
                    <div className="text-xs text-blue-300 mt-0.5">{recipe.category}</div>
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
                    
                    {recipe.category === 'Special' && (
                      <div className="mt-1 text-xs text-yellow-300 italic">
                        Using rare monster drops!
                      </div>
                    )}
                  </div>
                  
                  <div className="flex flex-col items-center">
                    <div className="w-12 h-12 flex items-center justify-center rounded" style={{
                      backgroundColor: getBlockColor(recipe.output.type)
                    }}>
                      {recipe.output.type.slice(0, 2).toUpperCase()}
                    </div>
                    <span className="text-sm mt-1">{recipe.output.count}x</span>
                  </div>
                </div>
              );
            })
          )}
        </div>
        
        {/* Craft Button */}
        <div className="mt-6 flex justify-between items-center">
          <div className="text-sm text-gray-400">
            {selectedRecipe ? 'Recipe selected' : 'Select a recipe to craft'}
          </div>
          
          <button
            className={cn(
              "px-4 py-2 rounded font-bold",
              selectedRecipe && canCraftRecipe(
                recipes.find(r => r.id === selectedRecipe)!, 
                inventory
              )
                ? "bg-blue-600 hover:bg-blue-700"
                : "bg-gray-600 cursor-not-allowed"
            )}
            onClick={() => {
              if (selectedRecipe) {
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
    case 'ice': return '#a8d2df';
    case 'lava': return '#e25822';
    case 'snow': return '#f0f0f0';
    case 'cactus': return '#5b8736';
    case 'glass': return '#c2e1f6';
    default: return '#ffffff';
  }
}
