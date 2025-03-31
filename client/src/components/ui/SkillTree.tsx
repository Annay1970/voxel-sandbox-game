import React, { useState, useEffect } from 'react';
import { useVoxelGame } from '../../lib/stores/useVoxelGame';
import { MiningSkillLevel, MiningEffect } from '../game/EnhancedMining';

// Skill categories
export enum SkillCategory {
  Combat = 'combat',
  Mining = 'mining',
  Building = 'building',
  Crafting = 'crafting',
  Farming = 'farming',
  Magic = 'magic'
}

// Common skill interface
export interface Skill {
  id: string;
  name: string;
  description: string;
  category: SkillCategory;
  level: number;
  maxLevel: number;
  icon: string;
  requiredSkills: string[];
  requiredLevel: number;
  effects: string[];
  unlocked: boolean;
}

// Skill tree data structure
export interface SkillTreeNode {
  skill: Skill;
  position: {
    x: number;
    y: number;
  };
  connections: string[]; // IDs of connected skills
}

// Combat skills
const COMBAT_SKILLS: Skill[] = [
  {
    id: 'combat_basic',
    name: 'Basic Combat',
    description: 'Learn the basics of combat, improving attack speed by 10%',
    category: SkillCategory.Combat,
    level: 1,
    maxLevel: 1,
    icon: '⚔️',
    requiredSkills: [],
    requiredLevel: 0,
    effects: ['Increases attack speed by 10%'],
    unlocked: true
  },
  {
    id: 'combat_swordsmanship',
    name: 'Swordsmanship',
    description: 'Improve your sword attacks, increasing damage by 20%',
    category: SkillCategory.Combat,
    level: 0,
    maxLevel: 3,
    icon: '🗡️',
    requiredSkills: ['combat_basic'],
    requiredLevel: 5,
    effects: [
      'Level 1: Increases sword damage by 20%',
      'Level 2: Increases sword damage by 40%',
      'Level 3: Increases sword damage by 60%'
    ],
    unlocked: false
  },
  {
    id: 'combat_critical_hits',
    name: 'Critical Strikes',
    description: 'Chance to deal critical hits that do double damage',
    category: SkillCategory.Combat,
    level: 0,
    maxLevel: 3,
    icon: '💥',
    requiredSkills: ['combat_basic'],
    requiredLevel: 5,
    effects: [
      'Level 1: 10% chance for critical hits',
      'Level 2: 20% chance for critical hits',
      'Level 3: 30% chance for critical hits'
    ],
    unlocked: false
  },
  {
    id: 'combat_combos',
    name: 'Combat Combos',
    description: 'Learn special attack combinations for devastating effects',
    category: SkillCategory.Combat,
    level: 0,
    maxLevel: 2,
    icon: '🔄',
    requiredSkills: ['combat_swordsmanship', 'combat_critical_hits'],
    requiredLevel: 15,
    effects: [
      'Level 1: Unlocks basic combo attacks',
      'Level 2: Unlocks advanced combo attacks'
    ],
    unlocked: false
  },
  {
    id: 'combat_defense',
    name: 'Improved Defense',
    description: 'Reduce damage taken from attacks',
    category: SkillCategory.Combat,
    level: 0,
    maxLevel: 3,
    icon: '🛡️',
    requiredSkills: ['combat_basic'],
    requiredLevel: 10,
    effects: [
      'Level 1: Reduces damage taken by 10%',
      'Level 2: Reduces damage taken by 20%',
      'Level 3: Reduces damage taken by 30%'
    ],
    unlocked: false
  }
];

// Mining skills
const MINING_SKILLS: Skill[] = [
  {
    id: 'mining_basic',
    name: 'Basic Mining',
    description: 'Learn the basics of mining, improving mining speed by 10%',
    category: SkillCategory.Mining,
    level: 1,
    maxLevel: 1,
    icon: '⛏️',
    requiredSkills: [],
    requiredLevel: 0,
    effects: ['Increases mining speed by 10%'],
    unlocked: true
  },
  {
    id: 'mining_efficiency',
    name: 'Mining Efficiency',
    description: 'Mine blocks faster',
    category: SkillCategory.Mining,
    level: 0,
    maxLevel: 3,
    icon: '⚒️',
    requiredSkills: ['mining_basic'],
    requiredLevel: 5,
    effects: [
      'Level 1: Increases mining speed by 20%',
      'Level 2: Increases mining speed by 40%',
      'Level 3: Increases mining speed by 60%'
    ],
    unlocked: false
  },
  {
    id: 'mining_fortune',
    name: 'Fortune',
    description: 'Chance to get extra resources when mining',
    category: SkillCategory.Mining,
    level: 0,
    maxLevel: 3,
    icon: '💎',
    requiredSkills: ['mining_basic'],
    requiredLevel: 10,
    effects: [
      'Level 1: 10% chance for extra drops',
      'Level 2: 20% chance for extra drops',
      'Level 3: 30% chance for extra drops'
    ],
    unlocked: false
  },
  {
    id: 'mining_silk_touch',
    name: 'Silk Touch',
    description: 'Mine blocks without breaking them',
    category: SkillCategory.Mining,
    level: 0,
    maxLevel: 1,
    icon: '🧵',
    requiredSkills: ['mining_fortune'],
    requiredLevel: 20,
    effects: ['Allows you to mine blocks without breaking them'],
    unlocked: false
  },
  {
    id: 'mining_explosive',
    name: 'Explosive Mining',
    description: 'Mine multiple blocks at once',
    category: SkillCategory.Mining,
    level: 0,
    maxLevel: 3,
    icon: '💣',
    requiredSkills: ['mining_efficiency'],
    requiredLevel: 15,
    effects: [
      'Level 1: Mine blocks in a 1-block radius',
      'Level 2: Mine blocks in a 2-block radius',
      'Level 3: Mine blocks in a 3-block radius'
    ],
    unlocked: false
  }
];

// Building skills
const BUILDING_SKILLS: Skill[] = [
  {
    id: 'building_basic',
    name: 'Basic Building',
    description: 'Learn the basics of building, improving placement speed by 10%',
    category: SkillCategory.Building,
    level: 1,
    maxLevel: 1,
    icon: '🧱',
    requiredSkills: [],
    requiredLevel: 0,
    effects: ['Increases block placement speed by 10%'],
    unlocked: true
  },
  {
    id: 'building_reach',
    name: 'Extended Reach',
    description: 'Place blocks from further away',
    category: SkillCategory.Building,
    level: 0,
    maxLevel: 3,
    icon: '👐',
    requiredSkills: ['building_basic'],
    requiredLevel: 5,
    effects: [
      'Level 1: Increases placement range by 1 block',
      'Level 2: Increases placement range by 2 blocks',
      'Level 3: Increases placement range by 3 blocks'
    ],
    unlocked: false
  }
];

// All skills combined
const ALL_SKILLS = [
  ...COMBAT_SKILLS,
  ...MINING_SKILLS,
  ...BUILDING_SKILLS
];

// Skill tree layout
const SKILL_TREE_LAYOUT: Record<SkillCategory, SkillTreeNode[]> = {
  [SkillCategory.Combat]: [
    {
      skill: COMBAT_SKILLS[0], // Basic Combat
      position: { x: 50, y: 20 },
      connections: ['combat_swordsmanship', 'combat_critical_hits', 'combat_defense']
    },
    {
      skill: COMBAT_SKILLS[1], // Swordsmanship
      position: { x: 30, y: 40 },
      connections: ['combat_combos']
    },
    {
      skill: COMBAT_SKILLS[2], // Critical Hits
      position: { x: 70, y: 40 },
      connections: ['combat_combos']
    },
    {
      skill: COMBAT_SKILLS[3], // Combos
      position: { x: 50, y: 60 },
      connections: []
    },
    {
      skill: COMBAT_SKILLS[4], // Defense
      position: { x: 50, y: 80 },
      connections: []
    }
  ],
  [SkillCategory.Mining]: [
    {
      skill: MINING_SKILLS[0], // Basic Mining
      position: { x: 50, y: 20 },
      connections: ['mining_efficiency', 'mining_fortune']
    },
    {
      skill: MINING_SKILLS[1], // Efficiency
      position: { x: 30, y: 40 },
      connections: ['mining_explosive']
    },
    {
      skill: MINING_SKILLS[2], // Fortune
      position: { x: 70, y: 40 },
      connections: ['mining_silk_touch']
    },
    {
      skill: MINING_SKILLS[3], // Silk Touch
      position: { x: 70, y: 60 },
      connections: []
    },
    {
      skill: MINING_SKILLS[4], // Explosive Mining
      position: { x: 30, y: 60 },
      connections: []
    }
  ],
  [SkillCategory.Building]: [
    {
      skill: BUILDING_SKILLS[0], // Basic Building
      position: { x: 50, y: 20 },
      connections: ['building_reach']
    },
    {
      skill: BUILDING_SKILLS[1], // Extended Reach
      position: { x: 50, y: 40 },
      connections: []
    }
  ],
  [SkillCategory.Crafting]: [],
  [SkillCategory.Farming]: [],
  [SkillCategory.Magic]: []
};

interface SkillTreeProps {
  isOpen: boolean;
  onClose: () => void;
}

const SkillTree: React.FC<SkillTreeProps> = ({ isOpen, onClose }) => {
  // Selected category
  const [selectedCategory, setSelectedCategory] = useState<SkillCategory>(SkillCategory.Combat);
  
  // Player skills from game state
  const [playerSkills, setPlayerSkills] = useState<Record<string, number>>({
    // Default unlocked skills
    'combat_basic': 1,
    'mining_basic': 1,
    'building_basic': 1
  });
  
  // Skill points available
  const [skillPoints, setSkillPoints] = useState<number>(5);
  
  // Player level
  const [playerLevel, setPlayerLevel] = useState<number>(10);
  
  // For real implementation, we'd get player skills from voxelGame state
  const { updatePlayerSkills } = useVoxelGame(state => ({
    updatePlayerSkills: state.updatePlayerSkills || (() => {})
  }));
  
  // Check if a skill is unlockable
  const canUnlockSkill = (skill: Skill): boolean => {
    // Already unlocked to max level
    if (playerSkills[skill.id] >= skill.maxLevel) return false;
    
    // Player doesn't have enough skill points
    if (skillPoints <= 0) return false;
    
    // Player level not high enough
    if (playerLevel < skill.requiredLevel) return false;
    
    // Check if prerequisites are met
    for (const requiredSkillId of skill.requiredSkills) {
      if (!playerSkills[requiredSkillId]) return false;
    }
    
    return true;
  };
  
  // Unlock a skill
  const unlockSkill = (skillId: string) => {
    const skill = ALL_SKILLS.find(s => s.id === skillId);
    if (!skill) return;
    
    // Check if we can unlock it
    if (!canUnlockSkill(skill)) return;
    
    // Update player skills
    const currentLevel = playerSkills[skillId] || 0;
    setPlayerSkills(prev => ({
      ...prev,
      [skillId]: currentLevel + 1
    }));
    
    // Update skill points
    setSkillPoints(prev => prev - 1);
    
    // In a real implementation, update the game state
    // updatePlayerSkills(skillId, currentLevel + 1);
    
    console.log(`Unlocked skill: ${skill.name} to level ${currentLevel + 1}`);
  };
  
  // Reset skills (for demonstration)
  const resetSkills = () => {
    setPlayerSkills({
      'combat_basic': 1,
      'mining_basic': 1,
      'building_basic': 1
    });
    setSkillPoints(5);
  };
  
  if (!isOpen) return null;
  
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-70">
      <div className="bg-gray-800 rounded-lg shadow-lg w-4/5 max-w-4xl h-4/5 flex flex-col overflow-hidden">
        {/* Header */}
        <div className="bg-gray-900 px-4 py-3 flex justify-between items-center">
          <h2 className="text-xl font-bold text-white">Skill Tree</h2>
          <div className="flex items-center space-x-4">
            <span className="text-yellow-400">
              Skill Points: {skillPoints}
            </span>
            <span className="text-blue-400">
              Player Level: {playerLevel}
            </span>
            <button 
              onClick={onClose}
              className="text-gray-400 hover:text-white"
            >
              Close
            </button>
          </div>
        </div>
        
        {/* Category tabs */}
        <div className="bg-gray-700 flex overflow-x-auto">
          {Object.values(SkillCategory).map(category => (
            <button
              key={category}
              className={`px-4 py-2 ${
                selectedCategory === category
                  ? 'bg-gray-800 text-white font-bold border-b-2 border-blue-500'
                  : 'text-gray-300 hover:bg-gray-800'
              }`}
              onClick={() => setSelectedCategory(category)}
            >
              {category.charAt(0).toUpperCase() + category.slice(1)}
            </button>
          ))}
        </div>
        
        {/* Skill tree content */}
        <div className="flex-1 overflow-auto p-6 bg-gray-800 relative">
          {/* Skill nodes */}
          {SKILL_TREE_LAYOUT[selectedCategory].map((node) => {
            const skill = node.skill;
            const currentLevel = playerSkills[skill.id] || 0;
            const isUnlocked = currentLevel > 0;
            const isMaxLevel = currentLevel >= skill.maxLevel;
            const canUnlock = canUnlockSkill(skill);
            
            return (
              <div
                key={skill.id}
                className={`absolute w-24 h-24 transform -translate-x-1/2 -translate-y-1/2 rounded-full ${
                  isUnlocked
                    ? isMaxLevel
                      ? 'bg-purple-700 border-2 border-purple-400'
                      : 'bg-blue-600 border-2 border-blue-400'
                    : canUnlock
                    ? 'bg-green-600 border-2 border-green-400 cursor-pointer'
                    : 'bg-gray-600 border-2 border-gray-500 opacity-70'
                }`}
                style={{ 
                  left: `${node.position.x}%`, 
                  top: `${node.position.y}%`,
                }}
                onClick={() => canUnlock && unlockSkill(skill.id)}
              >
                <div className="absolute inset-0 flex flex-col items-center justify-center text-white">
                  <div className="text-2xl">{skill.icon}</div>
                  <div className="text-xs font-bold mt-1">{skill.name}</div>
                  {currentLevel > 0 && (
                    <div className="text-xs mt-1">
                      Level: {currentLevel}/{skill.maxLevel}
                    </div>
                  )}
                </div>
              </div>
            );
          })}
          
          {/* Connection lines */}
          <svg className="absolute inset-0 w-full h-full pointer-events-none">
            {SKILL_TREE_LAYOUT[selectedCategory].map((node) => 
              node.connections.map((targetId) => {
                const targetNode = SKILL_TREE_LAYOUT[selectedCategory].find(
                  n => n.skill.id === targetId
                );
                
                if (!targetNode) return null;
                
                const sourceUnlocked = playerSkills[node.skill.id] > 0;
                const targetUnlocked = playerSkills[targetId] > 0;
                
                return (
                  <line
                    key={`${node.skill.id}-${targetId}`}
                    x1={`${node.position.x}%`}
                    y1={`${node.position.y}%`}
                    x2={`${targetNode.position.x}%`}
                    y2={`${targetNode.position.y}%`}
                    stroke={
                      sourceUnlocked && targetUnlocked
                        ? '#3b82f6' // blue-500
                        : sourceUnlocked
                        ? '#10b981' // green-500
                        : '#6b7280' // gray-500
                    }
                    strokeWidth="4"
                    strokeOpacity={sourceUnlocked ? '1' : '0.3'}
                  />
                );
              })
            )}
          </svg>
        </div>
        
        {/* Skill description */}
        <div className="bg-gray-900 p-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <h3 className="text-lg font-bold text-white mb-2">Selected Skill</h3>
              {/* Display selected skill info here */}
              <button
                onClick={resetSkills}
                className="mt-2 px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded"
              >
                Reset Skills (Demo)
              </button>
            </div>
            <div>
              <h3 className="text-lg font-bold text-white mb-2">Effects</h3>
              {/* List effects for the current skill level and next level */}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default SkillTree;