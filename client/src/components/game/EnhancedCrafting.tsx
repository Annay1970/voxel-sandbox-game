import React, { useState, useEffect } from 'react';
import { BlockType } from '../../lib/blocks';
import { CRAFTING_RECIPES, CraftingRecipe, RecipeCategory } from '../../lib/crafting';

export enum CraftingQuality {
  Poor = 'poor',
  Standard = 'standard',
  Superior = 'superior',
  Exceptional = 'exceptional',
  Masterwork = 'masterwork'
}

export enum CraftingStationType {
  Portable = 'portable',     // On-the-go crafting with limitations
  Workbench = 'workbench',   // Basic crafting station
  Forge = 'forge',           // For metalworking
  Enchanter = 'enchanter',   // For magical items
  Laboratory = 'laboratory', // For potions and chemicals
  Kiln = 'kiln',             // For pottery and glass
  Loom = 'loom'              // For textiles
}

export enum MaterialQuality {
  Raw = 'raw',
  Processed = 'processed',
  Refined = 'refined',
  Pristine = 'pristine'
}

export interface EnhancedCraftingResult {
  type: BlockType;
  count: number;
  quality: CraftingQuality;
  durability?: number;
  effects?: string[];
}

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

export default function EnhancedCrafting({
  isOpen,
  onClose,
  stationType,
  playerSkillLevel
}: EnhancedCraftingProps) {
  // Sample player inventory for demonstration
  const [playerInventory, setPlayerInventory] = useState<{ type: BlockType, count: number }[]>([
    { type: 'wood', count: 32 },
    { type: 'stone', count: 18 },
    { type: 'coal', count: 7 },
    { type: 'ironOre', count: 5 },
    { type: 'clay', count: 10 },
    { type: 'flower', count: 3 },
    { type: 'diamond', count: 1 },
  ]);
  
  const [craftingSlots, setCraftingSlots] = useState<MaterialSlot[]>([
    { type: null, quality: MaterialQuality.Raw, count: 0 },
    { type: null, quality: MaterialQuality.Raw, count: 0 },
    { type: null, quality: MaterialQuality.Raw, count: 0 },
    { type: null, quality: MaterialQuality.Raw, count: 0 },
  ]);
  
  const [selectedRecipe, setSelectedRecipe] = useState<CraftingRecipe | null>(null);
  const [selectedCategory, setSelectedCategory] = useState<RecipeCategory>('Basic');
  const [craftingResult, setCraftingResult] = useState<EnhancedCraftingResult | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  
  // Available recipe categories
  const recipeCategories: RecipeCategory[] = ['Basic', 'Tools', 'Weapons', 'Armor', 'Special', 'Building'];
  
  // Get recipes visible for the current station type
  const getAvailableRecipes = (): CraftingRecipe[] => {
    const allRecipes = CRAFTING_RECIPES; 

    // Apply filters based on station type
    let filteredRecipes = allRecipes.filter(recipe => {
      // Portable crafting only allows basic recipes that don't require a crafting table
      if (stationType === CraftingStationType.Portable) {
        return !recipe.requiresCraftingTable;
      }
      
      // Other stations have their specialties
      switch (stationType) {
        case CraftingStationType.Forge:
          return recipe.category === 'Tools' || recipe.category === 'Weapons' || 
                 recipe.id.includes('iron') || recipe.id.includes('gold');
          
        case CraftingStationType.Enchanter:
          return recipe.category === 'Special' || 
                 recipe.id.includes('gem') || recipe.id.includes('magic');
          
        case CraftingStationType.Laboratory:
          return recipe.id.includes('potion') || recipe.id.includes('chemical');
          
        case CraftingStationType.Kiln:
          return recipe.id.includes('glass') || recipe.id.includes('pottery') ||
                 recipe.id.includes('brick');
                 
        case CraftingStationType.Loom:
          return recipe.id.includes('cloth') || recipe.id.includes('fabric') ||
                 recipe.id.includes('leather');
          
        case CraftingStationType.Workbench:
        default:
          return true; // Workbench can craft anything
      }
    });
    
    // Apply category filter if selected
    if (selectedCategory) {
      filteredRecipes = filteredRecipes.filter(recipe => recipe.category === selectedCategory);
    }
    
    // Apply search term if any
    if (searchTerm) {
      const term = searchTerm.toLowerCase();
      filteredRecipes = filteredRecipes.filter(recipe => 
        recipe.name.toLowerCase().includes(term) || 
        recipe.output.type.toLowerCase().includes(term)
      );
    }
    
    return filteredRecipes;
  };
  
  // Check if a recipe can be crafted with current materials
  const canCraft = (recipe: CraftingRecipe): boolean => {
    // Check if we have enough materials
    for (const ingredient of recipe.ingredients) {
      // Get total count of this material across all slots
      const existingMaterialCount = playerInventory.find(item => item.type === ingredient.type)?.count || 0;
      
      if (existingMaterialCount < ingredient.count) {
        return false;
      }
    }
    
    return true;
  };
  
  // Add material to a crafting slot
  const addMaterialToSlot = (slotIndex: number, material: BlockType, count: number) => {
    // Check if player has this material
    const inventoryItem = playerInventory.find(item => item.type === material);
    if (!inventoryItem || inventoryItem.count < count) return;
    
    // Update slots
    const newSlots = [...craftingSlots];
    newSlots[slotIndex] = {
      type: material,
      quality: MaterialQuality.Raw, // Default quality
      count
    };
    setCraftingSlots(newSlots);
    
    // Update inventory
    const newInventory = playerInventory.map(item => {
      if (item.type === material) {
        return { ...item, count: item.count - count };
      }
      return item;
    });
    setPlayerInventory(newInventory);
  };
  
  // Remove material from a slot
  const removeMaterialFromSlot = (slotIndex: number) => {
    const slot = craftingSlots[slotIndex];
    if (!slot.type || slot.count <= 0) return;
    
    // Return materials to inventory
    const newInventory = [...playerInventory];
    const existingItem = newInventory.find(item => item.type === slot.type);
    
    if (existingItem) {
      existingItem.count += slot.count;
    } else {
      newInventory.push({ type: slot.type, count: slot.count });
    }
    
    // Clear slot
    const newSlots = [...craftingSlots];
    newSlots[slotIndex] = { type: null, quality: MaterialQuality.Raw, count: 0 };
    
    setCraftingSlots(newSlots);
    setPlayerInventory(newInventory);
  };
  
  // Get the best quality of materials used
  const getBestMaterialQuality = (): MaterialQuality => {
    let bestQuality = MaterialQuality.Raw;
    
    for (const slot of craftingSlots) {
      if (slot.type && slot.quality > bestQuality) {
        bestQuality = slot.quality;
      }
    }
    
    return bestQuality;
  };
  
  // Determine the quality of the crafting result based on skill and materials
  const determineResultQuality = (): CraftingQuality => {
    const materialQuality = getBestMaterialQuality();
    const skillFactor = playerSkillLevel / 100; // 0-1 range
    
    // Base chance for each quality tier
    const baseChances = {
      [CraftingQuality.Poor]: 0.1,
      [CraftingQuality.Standard]: 0.6,
      [CraftingQuality.Superior]: 0.2,
      [CraftingQuality.Exceptional]: 0.08,
      [CraftingQuality.Masterwork]: 0.02
    };
    
    // Adjust chances based on material quality
    let qualityModifier = 0;
    switch (materialQuality) {
      case MaterialQuality.Pristine:
        qualityModifier = 0.3;
        break;
      case MaterialQuality.Refined:
        qualityModifier = 0.2;
        break;
      case MaterialQuality.Processed:
        qualityModifier = 0.1;
        break;
      default:
        qualityModifier = 0;
    }
    
    // Adjust chances based on skill level
    const skillModifier = skillFactor * 0.5;
    
    // Calculate final chances
    const finalChances = {
      [CraftingQuality.Poor]: Math.max(0, baseChances[CraftingQuality.Poor] - qualityModifier - skillModifier),
      [CraftingQuality.Standard]: baseChances[CraftingQuality.Standard],
      [CraftingQuality.Superior]: baseChances[CraftingQuality.Superior] + qualityModifier * 0.5 + skillModifier * 0.3,
      [CraftingQuality.Exceptional]: baseChances[CraftingQuality.Exceptional] + qualityModifier * 0.3 + skillModifier * 0.4,
      [CraftingQuality.Masterwork]: baseChances[CraftingQuality.Masterwork] + qualityModifier * 0.2 + skillModifier * 0.3
    };
    
    // Normalize chances to sum to 1
    const total = Object.values(finalChances).reduce((sum, chance) => sum + chance, 0);
    Object.keys(finalChances).forEach(key => {
      finalChances[key as CraftingQuality] /= total;
    });
    
    // Roll for quality
    const roll = Math.random();
    let cumulativeChance = 0;
    
    for (const [quality, chance] of Object.entries(finalChances)) {
      cumulativeChance += chance;
      if (roll <= cumulativeChance) {
        return quality as CraftingQuality;
      }
    }
    
    return CraftingQuality.Standard; // Fallback
  };
  
  // Calculate durability based on quality
  const calculateDurability = (baseValue: number, quality: CraftingQuality): number => {
    const qualityMultipliers = {
      [CraftingQuality.Poor]: 0.7,
      [CraftingQuality.Standard]: 1.0,
      [CraftingQuality.Superior]: 1.3,
      [CraftingQuality.Exceptional]: 1.7,
      [CraftingQuality.Masterwork]: 2.5
    };
    
    return Math.round(baseValue * qualityMultipliers[quality]);
  };
  
  // Craft the selected recipe
  const craftItem = () => {
    if (!selectedRecipe) return;
    
    // Check if we can craft it
    if (!canCraft(selectedRecipe)) return;
    
    // Determine result quality
    const quality = determineResultQuality();
    
    // Create result
    const result: EnhancedCraftingResult = {
      type: selectedRecipe.output.type,
      count: selectedRecipe.output.count,
      quality
    };
    
    // Add durability for tools and weapons
    if (selectedRecipe.category === 'Tools' || selectedRecipe.category === 'Weapons') {
      result.durability = calculateDurability(100, quality);
    }
    
    // Apply special effects based on quality and skill
    if (quality === CraftingQuality.Exceptional || quality === CraftingQuality.Masterwork) {
      result.effects = [
        quality === CraftingQuality.Masterwork ? 'Unbreakable' : 'Extra Durable',
        playerSkillLevel >= 70 ? 'Efficient' : ''
      ].filter(Boolean);
    }
    
    setCraftingResult(result);
    
    // Use up ingredients
    const newInventory = [...playerInventory];
    
    for (const ingredient of selectedRecipe.ingredients) {
      const inventoryItem = newInventory.find(item => item.type === ingredient.type);
      if (inventoryItem) {
        inventoryItem.count -= ingredient.count;
      }
    }
    
    setPlayerInventory(newInventory.filter(item => item.count > 0));
    
    // Reset crafting slots
    setCraftingSlots(craftingSlots.map(() => ({ 
      type: null, 
      quality: MaterialQuality.Raw, 
      count: 0 
    })));
    
    // In a real app, this would add to inventory
    // useVoxelGame.getState().recipes.addToInventory(result);
    // useVoxelGame.getState().addPlayerHotbarItem(result.type, result.count);
    // useVoxelGame.getState().removePlayerInventoryItem(ingredientType, ingredientCount);
  };
  
  // Collect the crafted item
  const collectCraftedItem = () => {
    if (!craftingResult) return;
    
    // Add to inventory
    const newInventory = [...playerInventory];
    const existingItem = newInventory.find(item => item.type === craftingResult.type);
    
    if (existingItem) {
      existingItem.count += craftingResult.count;
    } else {
      newInventory.push({ 
        type: craftingResult.type, 
        count: craftingResult.count 
      });
    }
    
    setPlayerInventory(newInventory);
    setCraftingResult(null);
  };
  
  // Format quality for display
  const formatQuality = (quality: CraftingQuality): string => {
    return quality.charAt(0).toUpperCase() + quality.slice(1);
  };
  
  // Get color based on quality
  const getQualityColor = (quality: CraftingQuality): string => {
    switch (quality) {
      case CraftingQuality.Poor:
        return 'text-gray-400';
      case CraftingQuality.Standard:
        return 'text-white';
      case CraftingQuality.Superior:
        return 'text-green-400';
      case CraftingQuality.Exceptional:
        return 'text-blue-400';
      case CraftingQuality.Masterwork:
        return 'text-purple-400';
    }
  };
  
  // Get icon for recipe categories
  const getCategoryIcon = (category: RecipeCategory): string => {
    switch (category) {
      case 'Tools': return '🔨';
      case 'Weapons': return '⚔️';
      case 'Armor': return '🛡️';
      case 'Building': return '🧱';
      case 'Special': return '✨';
      default: return '📦';
    }
  };
  
  if (!isOpen) return null;
  
  return (
    <div className="fixed inset-0 z-40 flex items-center justify-center bg-black bg-opacity-70">
      <div className="bg-gray-800 rounded-lg w-4/5 max-w-6xl h-5/6 overflow-hidden flex flex-col">
        {/* Header */}
        <div className="bg-gray-900 p-4 flex justify-between items-center">
          <div className="flex items-center">
            <h2 className="text-2xl font-bold text-white">Enhanced Crafting</h2>
            <div className="ml-4 px-3 py-1 bg-blue-800 rounded-full text-sm text-blue-200">
              {stationType.charAt(0).toUpperCase() + stationType.slice(1)}
            </div>
            <div className="ml-3 px-3 py-1 bg-green-800 rounded-full text-sm text-green-200">
              Skill Level: {playerSkillLevel}
            </div>
          </div>
          <button 
            onClick={onClose}
            className="text-gray-400 hover:text-white"
          >
            <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>
        
        {/* Main content */}
        <div className="flex-1 grid grid-cols-12 gap-6 p-6 overflow-hidden">
          {/* Recipe list */}
          <div className="col-span-5 flex flex-col bg-gray-900 rounded-lg border border-gray-700 overflow-hidden">
            {/* Search and filter */}
            <div className="p-4 bg-gray-800">
              <div className="flex items-center mb-3">
                <input
                  type="text"
                  placeholder="Search recipes..."
                  className="flex-1 px-3 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                />
              </div>
              <div className="flex flex-wrap gap-2">
                {recipeCategories.map((category) => (
                  <button
                    key={category}
                    className={`px-3 py-1 rounded-full text-sm ${
                      selectedCategory === category
                        ? 'bg-blue-700 text-white'
                        : 'bg-gray-700 text-gray-300 hover:bg-gray-600'
                    }`}
                    onClick={() => setSelectedCategory(category)}
                  >
                    {getCategoryIcon(category)} {category}
                  </button>
                ))}
              </div>
            </div>
            
            {/* Recipe list */}
            <div className="flex-1 overflow-y-auto">
              {getAvailableRecipes().map(recipe => (
                <div
                  key={recipe.id}
                  className={`p-3 border-b border-gray-700 flex items-center hover:bg-gray-800 cursor-pointer ${
                    selectedRecipe?.id === recipe.id ? 'bg-gray-700' : ''
                  }`}
                  onClick={() => setSelectedRecipe(recipe)}
                >
                  <div className="w-10 h-10 bg-gray-700 rounded-md flex items-center justify-center mr-3">
                    <span className="text-xl">{recipe.id.includes('axe') ? '🪓' : 
                                               recipe.id.includes('pick') ? '⛏️' : 
                                               recipe.id.includes('sword') ? '🗡️' : 
                                               recipe.id.includes('bow') ? '🏹' : 
                                               recipe.id.includes('shovel') ? '🧹' : '📦'}</span>
                  </div>
                  <div className="flex-1">
                    <div className="font-medium text-white">{recipe.name}</div>
                    <div className="text-xs text-gray-400">
                      Yields: {recipe.output.count}x {recipe.output.type}
                    </div>
                  </div>
                  <div className={`px-2 py-1 rounded text-xs font-medium ${
                    canCraft(recipe) ? 'bg-green-800 text-green-200' : 'bg-red-800 text-red-200'
                  }`}>
                    {canCraft(recipe) ? 'Available' : 'Missing Materials'}
                  </div>
                </div>
              ))}
            </div>
          </div>
          
          {/* Crafting area */}
          <div className="col-span-4 flex flex-col bg-gray-900 rounded-lg border border-gray-700 overflow-hidden">
            <div className="p-4 bg-gray-800 border-b border-gray-700">
              <h3 className="text-lg font-medium text-white">Crafting Station</h3>
            </div>
            
            {/* Recipe details */}
            {selectedRecipe ? (
              <div className="p-4 border-b border-gray-700">
                <div className="flex items-center mb-3">
                  <div className="w-12 h-12 bg-gray-700 rounded-md flex items-center justify-center mr-3">
                    <span className="text-2xl">{selectedRecipe.id.includes('axe') ? '🪓' : 
                                               selectedRecipe.id.includes('pick') ? '⛏️' : 
                                               selectedRecipe.id.includes('sword') ? '🗡️' : 
                                               selectedRecipe.id.includes('bow') ? '🏹' : 
                                               selectedRecipe.id.includes('shovel') ? '🧹' : '📦'}</span>
                  </div>
                  <div>
                    <h4 className="text-lg font-medium text-white">{selectedRecipe.name}</h4>
                    <div className="text-sm text-gray-400">
                      Yields: {selectedRecipe.output.count}x {selectedRecipe.output.type}
                    </div>
                  </div>
                </div>
                
                <div className="mb-3">
                  <h5 className="text-sm font-medium text-gray-400 mb-1">Required Materials:</h5>
                  <div className="space-y-2">
                    {selectedRecipe.ingredients.map((ingredient, idx) => {
                      const inventoryItem = playerInventory.find(item => item.type === ingredient.type);
                      const hasEnough = (inventoryItem?.count || 0) >= ingredient.count;
                      
                      return (
                        <div key={idx} className="flex items-center justify-between">
                          <div className="flex items-center">
                            <div className="w-8 h-8 bg-gray-700 rounded-md flex items-center justify-center mr-2">
                              <span className="text-lg">{ingredient.type.includes('wood') ? '🪵' : 
                                                         ingredient.type.includes('stone') ? '🪨' : 
                                                         ingredient.type.includes('iron') ? '⚙️' : 
                                                         ingredient.type.includes('gold') ? '🔶' : 
                                                         ingredient.type.includes('diamond') ? '💎' : '📦'}</span>
                            </div>
                            <span className="text-sm">{ingredient.type} x{ingredient.count}</span>
                          </div>
                          <span className={hasEnough ? 'text-green-400' : 'text-red-400'}>
                            {inventoryItem?.count || 0}/{ingredient.count}
                          </span>
                        </div>
                      );
                    })}
                  </div>
                </div>
              </div>
            ) : (
              <div className="p-4 text-center text-gray-500">
                Select a recipe to start crafting
              </div>
            )}
            
            {/* Crafting slots */}
            <div className="p-4 border-b border-gray-700">
              <h5 className="text-sm font-medium text-gray-400 mb-2">Crafting Materials:</h5>
              <div className="grid grid-cols-2 gap-4">
                {craftingSlots.map((slot, idx) => (
                  <div
                    key={idx}
                    className="bg-gray-800 border border-gray-700 rounded-md p-2 flex items-center justify-between"
                  >
                    <div className="flex items-center">
                      <div className="w-8 h-8 bg-gray-700 rounded-md flex items-center justify-center mr-2">
                        <span className="text-lg">
                          {slot.type 
                            ? (slot.type.includes('wood') ? '🪵' : 
                               slot.type.includes('stone') ? '🪨' : 
                               slot.type.includes('iron') ? '⚙️' : 
                               slot.type.includes('gold') ? '🔶' : 
                               slot.type.includes('diamond') ? '💎' : '📦')
                            : '➕'}
                        </span>
                      </div>
                      <div>
                        <div className="text-sm">{slot.type || 'Empty Slot'}</div>
                        {slot.type && (
                          <div className="text-xs text-gray-400">
                            Qty: {slot.count} • {slot.quality}
                          </div>
                        )}
                      </div>
                    </div>
                    
                    {slot.type ? (
                      <button
                        className="ml-2 text-red-400 hover:text-red-300"
                        onClick={() => removeMaterialFromSlot(idx)}
                      >
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                          <path fillRule="evenodd" d="M9 2a1 1 0 00-.894.553L7.382 4H4a1 1 0 000 2v10a2 2 0 002 2h8a2 2 0 002-2V6a1 1 0 100-2h-3.382l-.724-1.447A1 1 0 0011 2H9zM7 8a1 1 0 012 0v6a1 1 0 11-2 0V8zm5-1a1 1 0 00-1 1v6a1 1 0 102 0V8a1 1 0 00-1-1z" clipRule="evenodd" />
                        </svg>
                      </button>
                    ) : (
                      selectedRecipe?.ingredients[idx] && (
                        <button
                          className="ml-2 px-2 py-1 bg-blue-800 text-blue-200 rounded-md text-xs"
                          onClick={() => addMaterialToSlot(
                            idx, 
                            selectedRecipe.ingredients[idx].type, 
                            selectedRecipe.ingredients[idx].count
                          )}
                        >
                          Add
                        </button>
                      )
                    )}
                  </div>
                ))}
              </div>
            </div>
            
            {/* Craft button */}
            <div className="p-4">
              <button
                className={`w-full py-3 px-4 rounded-lg font-medium text-center ${
                  selectedRecipe && canCraft(selectedRecipe)
                    ? 'bg-blue-600 hover:bg-blue-700 text-white'
                    : 'bg-gray-700 text-gray-500 cursor-not-allowed'
                }`}
                onClick={craftItem}
                disabled={!selectedRecipe || !canCraft(selectedRecipe)}
              >
                {selectedRecipe ? 'Craft Item' : 'Select a Recipe'}
              </button>
              
              <div className="mt-2 text-xs text-center text-gray-500">
                Crafting quality depends on your skill level and material quality
              </div>
            </div>
          </div>
          
          {/* Inventory area */}
          <div className="col-span-3 flex flex-col bg-gray-900 rounded-lg border border-gray-700 overflow-hidden">
            <div className="p-4 bg-gray-800 border-b border-gray-700">
              <h3 className="text-lg font-medium text-white">Your Inventory</h3>
            </div>
            
            {/* Inventory list */}
            <div className="flex-1 overflow-y-auto p-3">
              {playerInventory.map((item, idx) => (
                <div
                  key={idx}
                  className="bg-gray-800 border border-gray-700 rounded-md p-2 flex items-center mb-2"
                >
                  <div className="w-8 h-8 bg-gray-700 rounded-md flex items-center justify-center mr-2">
                    <span className="text-lg">{item.type.includes('wood') ? '🪵' : 
                                             item.type.includes('stone') ? '🪨' : 
                                             item.type.includes('iron') ? '⚙️' : 
                                             item.type.includes('gold') ? '🔶' : 
                                             item.type.includes('diamond') ? '💎' : 
                                             item.type.includes('coal') ? '🖤' : 
                                             item.type.includes('flower') ? '🌸' : 
                                             item.type.includes('clay') ? '🧱' : '📦'}</span>
                  </div>
                  <div className="flex-1">
                    <div className="text-sm font-medium text-white">{item.type}</div>
                    <div className="text-xs text-gray-400">Quantity: {item.count}</div>
                  </div>
                </div>
              ))}
            </div>
            
            {/* Crafting result */}
            {craftingResult && (
              <div className="p-4 border-t border-gray-700 bg-gray-800">
                <h4 className="text-lg font-medium text-white mb-2">Crafting Result</h4>
                <div className="bg-gray-900 border border-gray-700 rounded-md p-3 mb-3">
                  <div className="flex items-center mb-2">
                    <div className="w-12 h-12 bg-gray-800 rounded-md flex items-center justify-center mr-3">
                      <span className="text-2xl">{craftingResult.type.includes('axe') ? '🪓' : 
                                               craftingResult.type.includes('pick') ? '⛏️' : 
                                               craftingResult.type.includes('sword') ? '🗡️' : 
                                               craftingResult.type.includes('bow') ? '🏹' : 
                                               craftingResult.type.includes('shovel') ? '🧹' : '📦'}</span>
                    </div>
                    <div>
                      <h5 className="font-medium text-white">{craftingResult.type} x{craftingResult.count}</h5>
                      <div className={`text-sm ${getQualityColor(craftingResult.quality)}`}>
                        {formatQuality(craftingResult.quality)} Quality
                      </div>
                    </div>
                  </div>
                  
                  {craftingResult.durability && (
                    <div className="mb-2">
                      <div className="text-xs text-gray-400 mb-1">Durability:</div>
                      <div className="flex items-center">
                        <div className="flex-1 h-2 bg-gray-800 rounded-full overflow-hidden">
                          <div 
                            className={`h-full ${
                              craftingResult.quality === CraftingQuality.Poor ? 'bg-red-500' :
                              craftingResult.quality === CraftingQuality.Superior ? 'bg-green-500' :
                              craftingResult.quality === CraftingQuality.Exceptional ? 'bg-blue-500' :
                              craftingResult.quality === CraftingQuality.Masterwork ? 'bg-purple-500' :
                              'bg-gray-500'
                            }`}
                            style={{ width: '100%' }}
                          />
                        </div>
                        <div className="ml-2 text-sm font-medium text-white">
                          {craftingResult.durability}
                        </div>
                      </div>
                    </div>
                  )}
                  
                  {craftingResult.effects && craftingResult.effects.length > 0 && (
                    <div className="mb-2">
                      <div className="text-xs text-gray-400 mb-1">Effects:</div>
                      <div className="flex flex-wrap gap-1">
                        {craftingResult.effects.map((effect, idx) => (
                          <div 
                            key={idx}
                            className="px-2 py-1 rounded-full bg-blue-900 text-blue-200 text-xs"
                          >
                            {effect}
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
                
                <button
                  className="w-full py-2 px-4 rounded-lg font-medium text-center bg-green-600 hover:bg-green-700 text-white"
                  onClick={collectCraftedItem}
                >
                  Collect Item
                </button>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}