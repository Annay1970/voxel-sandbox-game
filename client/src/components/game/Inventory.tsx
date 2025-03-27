import { useState, useEffect } from 'react';
import { useVoxelGame, BlockType } from '../../lib/stores/useVoxelGame';
import { cn } from '../../lib/utils';

interface InventoryProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function Inventory({ isOpen, onClose }: InventoryProps) {
  const inventory = useVoxelGame(state => state.inventory);
  const selectedBlock = useVoxelGame(state => state.selectedBlock);
  const setSelectedBlock = useVoxelGame(state => state.setSelectedBlock);
  const craftItem = useVoxelGame(state => state.craftItem);
  
  const [craftingSelection, setCraftingSelection] = useState<string | null>(null);
  
  // Close inventory with Escape key
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isOpen) {
        onClose();
      }
    };
    
    window.addEventListener('keydown', handleKeyDown);
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [isOpen, onClose]);
  
  if (!isOpen) return null;
  
  // Crafting recipes (simplified)
  const recipes = [
    {
      name: 'Wooden Planks',
      output: 'wood' as BlockType,
      count: 4,
      ingredients: [{ type: 'log' as BlockType, count: 1 }],
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
  ];
  
  // Check if player can craft a recipe
  const canCraft = (recipe: typeof recipes[0]) => {
    return recipe.ingredients.every(ingredient => {
      const inventoryItem = inventory.find(item => item.type === ingredient.type);
      return inventoryItem && inventoryItem.count >= ingredient.count;
    });
  };
  
  // Handle crafting
  const handleCraft = (recipe: typeof recipes[0]) => {
    if (canCraft(recipe)) {
      craftItem(recipe.output, recipe.count, recipe.ingredients);
    }
  };
  
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50">
      <div className="bg-gray-800 text-white p-4 rounded-lg w-3/4 max-w-4xl h-3/4 overflow-auto">
        <div className="flex justify-between mb-4">
          <h2 className="text-2xl font-bold">Inventory</h2>
          <button 
            onClick={onClose}
            className="text-gray-400 hover:text-white text-lg"
          >
            ✕
          </button>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {/* Inventory */}
          <div className="bg-gray-700 p-4 rounded-md">
            <h3 className="text-xl mb-2">Items</h3>
            <div className="grid grid-cols-5 gap-2">
              {inventory.map((item, index) => (
                <div 
                  key={`${item.type}-${index}`}
                  className={cn(
                    "w-16 h-16 bg-gray-600 rounded flex flex-col items-center justify-center cursor-pointer hover:bg-gray-500",
                    selectedBlock === item.type ? "ring-2 ring-blue-500" : ""
                  )}
                  onClick={() => setSelectedBlock(item.type)}
                >
                  <div className="w-10 h-10 bg-gray-500 rounded flex items-center justify-center" style={{
                    backgroundColor: getBlockColor(item.type)
                  }}>
                    {item.type.charAt(0).toUpperCase()}
                  </div>
                  <span className="text-xs mt-1">{item.count}</span>
                </div>
              ))}
              
              {/* Placeholder empty slots */}
              {Array.from({ length: Math.max(0, 25 - inventory.length) }).map((_, index) => (
                <div 
                  key={`empty-${index}`}
                  className="w-16 h-16 bg-gray-600 rounded"
                ></div>
              ))}
            </div>
          </div>
          
          {/* Crafting */}
          <div className="bg-gray-700 p-4 rounded-md">
            <h3 className="text-xl mb-2">Crafting</h3>
            <div className="grid grid-cols-1 gap-2">
              {recipes.map((recipe) => (
                <div 
                  key={recipe.name}
                  className={cn(
                    "p-2 rounded flex justify-between items-center",
                    canCraft(recipe) ? "bg-gray-600 hover:bg-gray-500 cursor-pointer" : "bg-gray-600 opacity-50"
                  )}
                  onClick={() => canCraft(recipe) && handleCraft(recipe)}
                >
                  <div>
                    <div className="font-bold">{recipe.name}</div>
                    <div className="text-xs text-gray-300">
                      {recipe.ingredients.map((ingredient, idx) => (
                        <span key={idx}>
                          {ingredient.count}x {ingredient.type}
                          {idx < recipe.ingredients.length - 1 ? ', ' : ''}
                        </span>
                      ))}
                    </div>
                  </div>
                  <div className="flex items-center">
                    <div className="w-10 h-10 bg-gray-500 rounded flex items-center justify-center mr-2" style={{
                      backgroundColor: getBlockColor(recipe.output)
                    }}>
                      {recipe.output.charAt(0).toUpperCase()}
                    </div>
                    <span>{recipe.count}x</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
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
    case 'craftingTable': return '#a05a2c';
    case 'woodenPickaxe': return '#cd853f';
    default: return '#ffffff';
  }
}
