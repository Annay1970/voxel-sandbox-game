import React, { useState, useEffect } from 'react';
import { BlockType } from '../../lib/blocks';
import { CraftingRecipe, RecipeCategory, canCraftRecipe } from '../../lib/crafting';
import { useVoxelGame } from '../../lib/stores/useVoxelGame';

// Crafting quality enum
export enum CraftingQuality {
  Poor = 'poor',
  Standard = 'standard',
  Superior = 'superior',
  Exceptional = 'exceptional',
  Masterwork = 'masterwork'
}

// Crafting quality modifiers
const QUALITY_MODIFIERS: Record<CraftingQuality, { 
  color: string, 
  durabilityMod: number, 
  effectMod: number,
  chance: number // chance of creating this quality based on skill
}> = {
  [CraftingQuality.Poor]: { 
    color: '#9ca3af', // gray-400
    durabilityMod: 0.8, 
    effectMod: 0.8,
    chance: 0.1
  },
  [CraftingQuality.Standard]: { 
    color: '#ffffff', // white
    durabilityMod: 1.0, 
    effectMod: 1.0,
    chance: 0.6
  },
  [CraftingQuality.Superior]: { 
    color: '#3b82f6', // blue-500
    durabilityMod: 1.2, 
    effectMod: 1.2,
    chance: 0.2
  },
  [CraftingQuality.Exceptional]: { 
    color: '#8b5cf6', // purple-500
    durabilityMod: 1.5, 
    effectMod: 1.5,
    chance: 0.08
  },
  [CraftingQuality.Masterwork]: { 
    color: '#f59e0b', // amber-500
    durabilityMod: 2.0, 
    effectMod: 2.0,
    chance: 0.02
  }
};

// Crafting station types
export enum CraftingStationType {
  Portable = 'portable',     // On-the-go crafting with limitations
  Workbench = 'workbench',   // Basic crafting station
  Forge = 'forge',           // For metalworking
  Enchanter = 'enchanter',   // For magical items
  Laboratory = 'laboratory', // For potions and chemicals
  Kiln = 'kiln',             // For pottery and glass
  Loom = 'loom'              // For textiles
}

// Crafting station modifiers
const STATION_MODIFIERS: Record<CraftingStationType, {
  name: string,
  qualityBonus: number,
  speedMultiplier: number,
  specialEffect?: string
}> = {
  [CraftingStationType.Portable]: {
    name: 'Portable Crafting',
    qualityBonus: 0,
    speedMultiplier: 0.8,
    specialEffect: 'Can craft anywhere, but with limitations'
  },
  [CraftingStationType.Workbench]: {
    name: 'Workbench',
    qualityBonus: 0.05,
    speedMultiplier: 1.0,
    specialEffect: 'Allows crafting of basic items'
  },
  [CraftingStationType.Forge]: {
    name: 'Forge',
    qualityBonus: 0.1,
    speedMultiplier: 1.2,
    specialEffect: 'Required for metalworking, bonus to tool durability'
  },
  [CraftingStationType.Enchanter]: {
    name: 'Enchanter',
    qualityBonus: 0.15,
    speedMultiplier: 0.7,
    specialEffect: 'Enables magical properties on items'
  },
  [CraftingStationType.Laboratory]: {
    name: 'Laboratory',
    qualityBonus: 0.1,
    speedMultiplier: 1.1,
    specialEffect: 'Required for advanced potions and chemicals'
  },
  [CraftingStationType.Kiln]: {
    name: 'Kiln',
    qualityBonus: 0.08,
    speedMultiplier: 0.9,
    specialEffect: 'Required for pottery and glass'
  },
  [CraftingStationType.Loom]: {
    name: 'Loom',
    qualityBonus: 0.07,
    speedMultiplier: 1.3,
    specialEffect: 'Required for textiles and fabrics'
  }
};

// Crafting materials quality
export enum MaterialQuality {
  Raw = 'raw',
  Processed = 'processed',
  Refined = 'refined',
  Pristine = 'pristine'
}

// Material quality modifiers
const MATERIAL_QUALITY_MODIFIERS: Record<MaterialQuality, {
  name: string,
  qualityBonus: number,
  resourceMultiplier: number, // how many resources needed compared to raw
  color: string
}> = {
  [MaterialQuality.Raw]: {
    name: 'Raw',
    qualityBonus: 0,
    resourceMultiplier: 1.0,
    color: '#9ca3af' // gray-400
  },
  [MaterialQuality.Processed]: {
    name: 'Processed',
    qualityBonus: 0.1,
    resourceMultiplier: 1.5,
    color: '#ffffff' // white
  },
  [MaterialQuality.Refined]: {
    name: 'Refined',
    qualityBonus: 0.2,
    resourceMultiplier: 2.0,
    color: '#3b82f6' // blue-500
  },
  [MaterialQuality.Pristine]: {
    name: 'Pristine',
    qualityBonus: 0.35,
    resourceMultiplier: 3.0,
    color: '#8b5cf6' // purple-500
  }
};

// Crafting result interface for items with quality
export interface EnhancedCraftingResult {
  type: BlockType;
  count: number;
  quality: CraftingQuality;
  durability?: number;
  effects?: string[];
}

// Material slot interface for the crafting grid
interface MaterialSlot {
  type: BlockType | null;
  quality: MaterialQuality;
  count: number;
}

interface EnhancedCraftingProps {
  isOpen: boolean;
  onClose: () => void;
  stationType: CraftingStationType;
  playerSkillLevel: number; // 0-100 crafting skill level
}

const EnhancedCrafting: React.FC<EnhancedCraftingProps> = ({
  isOpen,
  onClose,
  stationType = CraftingStationType.Workbench,
  playerSkillLevel = 1
}) => {
  // State for crafting slots
  const [craftingGrid, setCraftingGrid] = useState<MaterialSlot[][]>(
    Array(3).fill(null).map(() => 
      Array(3).fill(null).map(() => ({ 
        type: null, 
        quality: MaterialQuality.Raw,
        count: 0
      }))
    )
  );
  
  // Selected recipe category
  const [selectedCategory, setSelectedCategory] = useState<RecipeCategory>('Basic');
  
  // Selected recipe
  const [selectedRecipe, setSelectedRecipe] = useState<CraftingRecipe | null>(null);
  
  // Crafting result
  const [craftingResult, setCraftingResult] = useState<EnhancedCraftingResult | null>(null);
  
  // Animation state for crafting
  const [isCrafting, setIsCrafting] = useState(false);
  
  // Crafting progress
  const [craftingProgress, setCraftingProgress] = useState(0);
  const [craftingTimer, setCraftingTimer] = useState<NodeJS.Timeout | null>(null);
  
  // Access voxel game state
  const { 
    inventory, 
    recipes,
    addPlayerHotbarItem,
    removePlayerInventoryItem
  } = useVoxelGame();
  
  // Filter recipes by category and station type
  const filteredRecipes = React.useMemo(() => {
    if (!recipes) return [];
    
    return recipes.filter(recipe => {
      // Filter by category
      if (recipe.category !== selectedCategory) return false;
      
      // Filter by station type
      if (stationType === CraftingStationType.Portable && recipe.requiresCraftingTable) {
        return false;
      }
      
      // Additional filters based on station type could be added here
      
      return true;
    });
  }, [recipes, selectedCategory, stationType]);
  
  // Determine if a recipe can be crafted
  const canCraft = (recipe: CraftingRecipe) => {
    if (!inventory) return false;
    
    // Check if player has required items
    return canCraftRecipe(recipe, inventory);
  };
  
  // Get the best material quality the player can use
  const getBestMaterialQuality = (): MaterialQuality => {
    if (playerSkillLevel >= 75) return MaterialQuality.Pristine;
    if (playerSkillLevel >= 50) return MaterialQuality.Refined;
    if (playerSkillLevel >= 25) return MaterialQuality.Processed;
    return MaterialQuality.Raw;
  };
  
  // Determine the quality of the crafted item based on materials, station, and skill
  const determineResultQuality = (): CraftingQuality => {
    // Base chance for quality based on skill
    const skillFactor = Math.min(1, playerSkillLevel / 100);
    
    // Bonus from crafting station
    const stationBonus = STATION_MODIFIERS[stationType].qualityBonus;
    
    // Calculate average material quality bonus
    let totalMaterialBonus = 0;
    let materialCount = 0;
    
    craftingGrid.forEach(row => {
      row.forEach(slot => {
        if (slot.type) {
          totalMaterialBonus += MATERIAL_QUALITY_MODIFIERS[slot.quality].qualityBonus;
          materialCount++;
        }
      });
    });
    
    const materialBonus = materialCount > 0 ? totalMaterialBonus / materialCount : 0;
    
    // Combined quality factor (0-1 range)
    const qualityFactor = Math.min(1, skillFactor + stationBonus + materialBonus);
    
    // Determine quality based on random chance weighted by quality factor
    const roll = Math.random();
    
    if (roll < QUALITY_MODIFIERS[CraftingQuality.Masterwork].chance * qualityFactor * 2) {
      return CraftingQuality.Masterwork;
    } else if (roll < QUALITY_MODIFIERS[CraftingQuality.Exceptional].chance * qualityFactor * 1.5) {
      return CraftingQuality.Exceptional;
    } else if (roll < QUALITY_MODIFIERS[CraftingQuality.Superior].chance * qualityFactor) {
      return CraftingQuality.Superior;
    } else if (roll < 0.1) { // Small chance for poor quality
      return CraftingQuality.Poor;
    }
    
    // Default to standard quality
    return CraftingQuality.Standard;
  };
  
  // Craft the selected recipe
  const craftItem = () => {
    if (!selectedRecipe || !canCraft(selectedRecipe)) return;
    
    // Start crafting animation
    setIsCrafting(true);
    setCraftingProgress(0);
    
    // Calculate crafting speed based on station and skill
    const baseTime = 2000; // 2 seconds base time
    const stationSpeedMultiplier = STATION_MODIFIERS[stationType].speedMultiplier;
    const skillSpeedBonus = 1 + (playerSkillLevel / 200); // Up to 50% bonus from skill
    
    const craftingTime = baseTime / (stationSpeedMultiplier * skillSpeedBonus);
    
    // Set up crafting timer
    const timer = setInterval(() => {
      setCraftingProgress(prev => {
        const newProgress = prev + (100 / (craftingTime / 100));
        
        if (newProgress >= 100) {
          // Crafting complete
          clearInterval(timer);
          setCraftingTimer(null);
          
          // Determine quality
          const quality = determineResultQuality();
          
          // Create the result
          const result: EnhancedCraftingResult = {
            type: selectedRecipe.output.type,
            count: selectedRecipe.output.count,
            quality,
            durability: 100 * QUALITY_MODIFIERS[quality].durabilityMod
          };
          
          // Set crafting result
          setCraftingResult(result);
          
          // Remove ingredients from inventory
          selectedRecipe.ingredients.forEach(ingredient => {
            removePlayerInventoryItem(ingredient.type, ingredient.count);
          });
          
          // Add result to player's inventory
          addPlayerHotbarItem(result.type, result.count);
          
          // Reset crafting animation
          setIsCrafting(false);
          return 0;
        }
        
        return newProgress;
      });
    }, 100);
    
    setCraftingTimer(timer);
  };
  
  // Clear crafting timer on unmount
  useEffect(() => {
    return () => {
      if (craftingTimer) clearInterval(craftingTimer);
    };
  }, [craftingTimer]);
  
  // Handle closing the crafting window
  const handleClose = () => {
    if (craftingTimer) clearInterval(craftingTimer);
    setCraftingTimer(null);
    setIsCrafting(false);
    onClose();
  };
  
  if (!isOpen) return null;
  
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-70">
      <div className="bg-gray-800 rounded-lg shadow-lg w-3/4 max-w-4xl overflow-hidden">
        {/* Header */}
        <div className="bg-gray-900 p-4 flex justify-between items-center">
          <h2 className="text-xl font-bold text-white">
            {STATION_MODIFIERS[stationType].name}
          </h2>
          <button 
            onClick={handleClose}
            className="text-gray-400 hover:text-white"
          >
            Close
          </button>
        </div>
        
        {/* Main content */}
        <div className="p-4 flex flex-col md:flex-row">
          {/* Left: Recipe categories and list */}
          <div className="w-full md:w-1/3 pr-4 mb-4 md:mb-0">
            {/* Recipe categories */}
            <div className="mb-4">
              <h3 className="text-lg font-bold text-white mb-2">Categories</h3>
              <div className="flex flex-wrap gap-2">
                {Object.values(RecipeCategory).map(category => (
                  <button
                    key={category}
                    className={`px-3 py-1 rounded-full text-sm ${
                      selectedCategory === category
                        ? 'bg-blue-600 text-white'
                        : 'bg-gray-700 text-gray-300 hover:bg-gray-600'
                    }`}
                    onClick={() => setSelectedCategory(category)}
                  >
                    {category}
                  </button>
                ))}
              </div>
            </div>
            
            {/* Recipe list */}
            <div>
              <h3 className="text-lg font-bold text-white mb-2">Recipes</h3>
              <div className="bg-gray-700 rounded-lg max-h-60 overflow-y-auto">
                {filteredRecipes.length > 0 ? (
                  filteredRecipes.map(recipe => {
                    const craftable = canCraft(recipe);
                    return (
                      <button
                        key={recipe.id}
                        className={`w-full text-left p-2 border-b border-gray-600 ${
                          selectedRecipe?.id === recipe.id
                            ? 'bg-blue-800'
                            : craftable
                            ? 'hover:bg-gray-600'
                            : 'opacity-50'
                        }`}
                        onClick={() => setSelectedRecipe(recipe)}
                        disabled={!craftable}
                      >
                        <div className="flex items-center">
                          <div className="w-8 h-8 mr-2 flex items-center justify-center bg-gray-800 rounded">
                            {/* Recipe icon or first ingredient icon */}
                            {recipe.output.type.charAt(0).toUpperCase()}
                          </div>
                          <div>
                            <div className="text-white font-medium">{recipe.name}</div>
                            <div className="text-gray-400 text-xs">
                              {recipe.output.count}x {recipe.output.type}
                            </div>
                          </div>
                        </div>
                      </button>
                    );
                  })
                ) : (
                  <div className="p-4 text-gray-400 text-center">
                    No recipes available in this category
                  </div>
                )}
              </div>
            </div>
          </div>
          
          {/* Center: Crafting grid */}
          <div className="w-full md:w-1/3 px-4">
            <h3 className="text-lg font-bold text-white mb-2">Crafting</h3>
            <div className="bg-gray-700 rounded-lg p-4">
              {/* 3x3 Crafting grid */}
              <div className="grid grid-cols-3 gap-2 mb-6">
                {craftingGrid.map((row, rowIndex) => 
                  row.map((slot, colIndex) => (
                    <div 
                      key={`${rowIndex}-${colIndex}`}
                      className="w-full aspect-square bg-gray-800 rounded-lg border border-gray-600 flex items-center justify-center"
                    >
                      {slot.type ? (
                        <div className="relative w-full h-full flex items-center justify-center">
                          <div className="text-2xl">{slot.type.charAt(0).toUpperCase()}</div>
                          <div 
                            className="absolute bottom-0 right-0 text-xs px-1 rounded-tl"
                            style={{ backgroundColor: MATERIAL_QUALITY_MODIFIERS[slot.quality].color }}
                          >
                            {slot.count}
                          </div>
                        </div>
                      ) : null}
                    </div>
                  ))
                )}
              </div>
              
              {/* Auto-fill button */}
              <button
                className="w-full py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg mb-4"
                onClick={() => {
                  if (!selectedRecipe) return;
                  
                  // Simple auto-fill (in a real implementation this would be more sophisticated)
                  const newGrid = [...craftingGrid.map(row => [...row])];
                  
                  // Place ingredients in the grid
                  selectedRecipe.ingredients.forEach((ingredient, index) => {
                    const row = Math.floor(index / 3);
                    const col = index % 3;
                    
                    if (row < 3 && col < 3) {
                      newGrid[row][col] = {
                        type: ingredient.type,
                        quality: getBestMaterialQuality(),
                        count: ingredient.count
                      };
                    }
                  });
                  
                  setCraftingGrid(newGrid);
                }}
                disabled={!selectedRecipe}
              >
                Auto-fill
              </button>
              
              {/* Craft button */}
              <div className="relative">
                <button
                  className={`w-full py-2 ${
                    selectedRecipe && canCraft(selectedRecipe)
                      ? 'bg-green-600 hover:bg-green-700'
                      : 'bg-gray-600 cursor-not-allowed'
                  } text-white rounded-lg`}
                  onClick={craftItem}
                  disabled={!selectedRecipe || !canCraft(selectedRecipe) || isCrafting}
                >
                  {isCrafting ? 'Crafting...' : 'Craft'}
                </button>
                
                {/* Crafting progress bar */}
                {isCrafting && (
                  <div className="absolute left-0 bottom-0 h-1 bg-green-400" style={{ width: `${craftingProgress}%` }} />
                )}
              </div>
            </div>
          </div>
          
          {/* Right: Recipe details and result */}
          <div className="w-full md:w-1/3 pl-4">
            <h3 className="text-lg font-bold text-white mb-2">Recipe Details</h3>
            <div className="bg-gray-700 rounded-lg p-4">
              {selectedRecipe ? (
                <>
                  <h4 className="text-lg font-bold text-white">{selectedRecipe.name}</h4>
                  
                  <div className="mt-4">
                    <h5 className="text-white font-medium mb-2">Ingredients:</h5>
                    <ul className="space-y-1">
                      {selectedRecipe.ingredients.map((ingredient, index) => (
                        <li key={index} className="flex items-center text-gray-300">
                          <span className="w-6 h-6 bg-gray-800 rounded-full flex items-center justify-center mr-2">
                            {ingredient.type.charAt(0).toUpperCase()}
                          </span>
                          {ingredient.count}x {ingredient.type}
                        </li>
                      ))}
                    </ul>
                  </div>
                  
                  <div className="mt-4">
                    <h5 className="text-white font-medium mb-2">Result:</h5>
                    <div className="flex items-center text-gray-300">
                      <span className="w-10 h-10 bg-gray-800 rounded-lg flex items-center justify-center mr-2">
                        {selectedRecipe.output.type.charAt(0).toUpperCase()}
                      </span>
                      {selectedRecipe.output.count}x {selectedRecipe.output.type}
                    </div>
                  </div>
                  
                  {/* Crafting result display */}
                  {craftingResult && (
                    <div className="mt-4 p-3 rounded-lg" style={{ 
                      backgroundColor: QUALITY_MODIFIERS[craftingResult.quality].color,
                      opacity: 0.8
                    }}>
                      <h5 className="text-black font-bold">Crafted:</h5>
                      <div className="flex items-center mt-1">
                        <span className="w-8 h-8 bg-white bg-opacity-20 rounded flex items-center justify-center mr-2">
                          {craftingResult.type.charAt(0).toUpperCase()}
                        </span>
                        <div>
                          <div className="text-black font-medium">
                            {craftingResult.quality} {craftingResult.type}
                          </div>
                          <div className="text-black text-xs">
                            Durability: {craftingResult.durability?.toFixed(0)}%
                          </div>
                        </div>
                      </div>
                    </div>
                  )}
                </>
              ) : (
                <div className="text-gray-400 italic text-center py-4">
                  Select a recipe to see details
                </div>
              )}
              
              {/* Station quality bonus information */}
              <div className="mt-4 pt-4 border-t border-gray-600">
                <h5 className="text-white font-medium mb-2">Station Information:</h5>
                <div className="text-gray-300 text-sm">
                  <div>Quality Bonus: +{(STATION_MODIFIERS[stationType].qualityBonus * 100).toFixed(0)}%</div>
                  <div>Crafting Speed: {(STATION_MODIFIERS[stationType].speedMultiplier * 100).toFixed(0)}%</div>
                  {STATION_MODIFIERS[stationType].specialEffect && (
                    <div className="mt-1 text-blue-300">
                      {STATION_MODIFIERS[stationType].specialEffect}
                    </div>
                  )}
                </div>
              </div>
              
              {/* Skill level information */}
              <div className="mt-4 pt-4 border-t border-gray-600">
                <h5 className="text-white font-medium mb-1">Crafting Skill:</h5>
                <div className="w-full h-2 bg-gray-800 rounded-full">
                  <div 
                    className="h-full bg-blue-600 rounded-full"
                    style={{ width: `${playerSkillLevel}%` }}
                  />
                </div>
                <div className="text-right text-gray-300 text-xs mt-1">
                  Level: {playerSkillLevel}/100
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default EnhancedCrafting;