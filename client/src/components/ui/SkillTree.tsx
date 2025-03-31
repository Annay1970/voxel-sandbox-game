import React, { useState, useRef, useEffect } from 'react';

export enum SkillCategory {
  Combat = 'combat',
  Mining = 'mining',
  Building = 'building',
  Crafting = 'crafting',
  Farming = 'farming',
  Magic = 'magic'
}

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

export interface SkillTreeNode {
  skill: Skill;
  position: {
    x: number;
    y: number;
  };
  connections: string[]; // IDs of connected skills
}

interface SkillTreeProps {
  isOpen: boolean;
  onClose: () => void;
}

// Sample skills for demonstration
const SAMPLE_SKILLS: Skill[] = [
  {
    id: 'mining_efficiency',
    name: 'Mining Efficiency',
    description: 'Increase mining speed by 10% per level',
    category: SkillCategory.Mining,
    level: 2,
    maxLevel: 5,
    icon: '⛏️',
    requiredSkills: [],
    requiredLevel: 0,
    effects: ['10% faster mining per level'],
    unlocked: true
  },
  {
    id: 'ore_sense',
    name: 'Ore Sense',
    description: 'Highlight nearby ores when mining',
    category: SkillCategory.Mining,
    level: 0,
    maxLevel: 3,
    icon: '👁️',
    requiredSkills: ['mining_efficiency'],
    requiredLevel: 2,
    effects: ['Level 1: Highlight common ores', 'Level 2: Highlight rare ores', 'Level 3: See ores through walls'],
    unlocked: false
  },
  {
    id: 'melee_damage',
    name: 'Melee Damage',
    description: 'Increase melee damage by 15% per level',
    category: SkillCategory.Combat,
    level: 1,
    maxLevel: 5,
    icon: '⚔️',
    requiredSkills: [],
    requiredLevel: 0,
    effects: ['15% increased melee damage per level'],
    unlocked: true
  },
  {
    id: 'critical_strike',
    name: 'Critical Strike',
    description: 'Chance to deal double damage with melee attacks',
    category: SkillCategory.Combat,
    level: 0,
    maxLevel: 3,
    icon: '🎯',
    requiredSkills: ['melee_damage'],
    requiredLevel: 1,
    effects: ['5% critical chance per level'],
    unlocked: false
  },
  {
    id: 'advanced_crafting',
    name: 'Advanced Crafting',
    description: 'Unlock more crafting recipes',
    category: SkillCategory.Crafting,
    level: 1,
    maxLevel: 3,
    icon: '🔧',
    requiredSkills: [],
    requiredLevel: 0,
    effects: ['Level 1: Unlock improved tools', 'Level 2: Unlock special items', 'Level 3: Unlock masterwork crafting'],
    unlocked: true
  },
  {
    id: 'resource_efficiency',
    name: 'Resource Efficiency',
    description: 'Chance to not consume materials when crafting',
    category: SkillCategory.Crafting,
    level: 0,
    maxLevel: 3,
    icon: '♻️',
    requiredSkills: ['advanced_crafting'],
    requiredLevel: 1,
    effects: ['5% chance to save materials per level'],
    unlocked: false
  }
];

// Node positions for the skill tree visualization
const SKILL_TREE_LAYOUT: SkillTreeNode[] = [
  {
    skill: SAMPLE_SKILLS.find(s => s.id === 'mining_efficiency')!,
    position: { x: 100, y: 100 },
    connections: ['ore_sense']
  },
  {
    skill: SAMPLE_SKILLS.find(s => s.id === 'ore_sense')!,
    position: { x: 250, y: 100 },
    connections: []
  },
  {
    skill: SAMPLE_SKILLS.find(s => s.id === 'melee_damage')!,
    position: { x: 100, y: 250 },
    connections: ['critical_strike']
  },
  {
    skill: SAMPLE_SKILLS.find(s => s.id === 'critical_strike')!,
    position: { x: 250, y: 250 },
    connections: []
  },
  {
    skill: SAMPLE_SKILLS.find(s => s.id === 'advanced_crafting')!,
    position: { x: 100, y: 400 },
    connections: ['resource_efficiency']
  },
  {
    skill: SAMPLE_SKILLS.find(s => s.id === 'resource_efficiency')!,
    position: { x: 250, y: 400 },
    connections: []
  }
];

const SkillTree: React.FC<SkillTreeProps> = ({ isOpen, onClose }) => {
  const [selectedSkill, setSelectedSkill] = useState<Skill | null>(null);
  const [skills, setSkills] = useState<Skill[]>(SAMPLE_SKILLS);
  const [selectedCategory, setSelectedCategory] = useState<SkillCategory>(SkillCategory.Mining);
  const [skillPoints, setSkillPoints] = useState(5); // Available skill points for the player
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  
  useEffect(() => {
    if (isOpen && canvasRef.current && containerRef.current) {
      const canvas = canvasRef.current;
      const ctx = canvas.getContext('2d');
      
      if (ctx) {
        // Set canvas dimensions
        canvas.width = containerRef.current.clientWidth;
        canvas.height = 500;
        
        // Clear canvas
        ctx.clearRect(0, 0, canvas.width, canvas.height);
        
        // Draw connections between nodes
        ctx.strokeStyle = '#666';
        ctx.lineWidth = 2;
        
        SKILL_TREE_LAYOUT.forEach(node => {
          node.connections.forEach(targetId => {
            const targetNode = SKILL_TREE_LAYOUT.find(n => n.skill.id === targetId);
            if (targetNode) {
              ctx.beginPath();
              ctx.moveTo(node.position.x + 30, node.position.y + 30);
              ctx.lineTo(targetNode.position.x + 30, targetNode.position.y + 30);
              
              // Check if the connection is active (both nodes unlocked)
              const sourceSkill = skills.find(s => s.id === node.skill.id);
              const targetSkill = skills.find(s => s.id === targetId);
              
              if (sourceSkill?.unlocked && targetSkill?.unlocked) {
                ctx.strokeStyle = '#4CAF50';
              } else if (sourceSkill?.unlocked) {
                ctx.strokeStyle = '#FFA726';
              } else {
                ctx.strokeStyle = '#666';
              }
              
              ctx.stroke();
            }
          });
        });
      }
    }
  }, [isOpen, skills, selectedCategory]);
  
  // Check if a skill can be unlocked based on prerequisites
  const canUnlockSkill = (skill: Skill): boolean => {
    if (skill.level >= skill.maxLevel) return false;
    if (skillPoints <= 0) return false;
    
    // Check if all required skills are unlocked and at required level
    return skill.requiredSkills.every(reqId => {
      const requiredSkill = skills.find(s => s.id === reqId);
      return requiredSkill?.unlocked && requiredSkill.level >= skill.requiredLevel;
    });
  };
  
  // Unlock or level up a skill
  const unlockSkill = (skillId: string) => {
    const updatedSkills = skills.map(skill => {
      if (skill.id === skillId) {
        if (!skill.unlocked) {
          // Unlock the skill
          return { ...skill, unlocked: true, level: 1 };
        } else if (skill.level < skill.maxLevel) {
          // Level up the skill
          return { ...skill, level: skill.level + 1 };
        }
      }
      return skill;
    });
    
    setSkills(updatedSkills);
    setSkillPoints(prev => prev - 1);
    
    // In a real app, you would save this to your game state
    // useVoxelGame.getState().updatePlayerSkills(updatedSkills);
  };
  
  if (!isOpen) return null;
  
  return (
    <div className="fixed inset-0 z-40 flex items-center justify-center bg-black bg-opacity-70">
      <div className="bg-gray-800 rounded-lg w-4/5 max-w-4xl h-5/6 overflow-hidden flex flex-col">
        {/* Header */}
        <div className="bg-gray-900 p-4 flex justify-between items-center">
          <h2 className="text-2xl font-bold text-white">Skill Tree</h2>
          <div className="flex items-center">
            <div className="mr-6 text-yellow-400 font-bold">
              Skill Points: {skillPoints}
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
        </div>
        
        {/* Category tabs */}
        <div className="bg-gray-900 px-4 flex gap-4 border-t border-gray-700">
          {Object.values(SkillCategory).map((category) => (
            <button
              key={category}
              className={`py-2 px-4 font-medium ${selectedCategory === category ? 'text-blue-400 border-b-2 border-blue-400' : 'text-gray-400'}`}
              onClick={() => setSelectedCategory(category)}
            >
              {category.charAt(0).toUpperCase() + category.slice(1)}
            </button>
          ))}
        </div>
        
        {/* Main content */}
        <div className="flex-1 p-6 flex gap-6 overflow-hidden">
          {/* Skill tree visualization */}
          <div 
            ref={containerRef}
            className="flex-1 relative border border-gray-700 rounded-lg bg-gray-900 overflow-hidden"
          >
            <canvas ref={canvasRef} className="absolute inset-0" />
            {SKILL_TREE_LAYOUT
              .filter(node => node.skill.category === selectedCategory)
              .map(node => {
                const skill = skills.find(s => s.id === node.skill.id) || node.skill;
                return (
                  <div
                    key={skill.id}
                    className={`absolute w-16 h-16 flex flex-col items-center justify-center rounded-full cursor-pointer transform hover:scale-110 transition-transform 
                      ${skill.unlocked 
                        ? 'bg-gradient-to-br from-blue-600 to-blue-800 border-2 border-blue-400' 
                        : 'bg-gradient-to-br from-gray-700 to-gray-900 border border-gray-600'
                      }`}
                    style={{
                      left: node.position.x + 'px',
                      top: node.position.y + 'px',
                    }}
                    onClick={() => setSelectedSkill(skill)}
                  >
                    <div className="text-2xl">{skill.icon}</div>
                    {skill.level > 0 && (
                      <div className="absolute -bottom-2 -right-2 bg-yellow-500 text-black text-xs font-bold rounded-full w-5 h-5 flex items-center justify-center">
                        {skill.level}
                      </div>
                    )}
                  </div>
                );
              })}
          </div>
          
          {/* Skill details */}
          <div className="w-72 bg-gray-900 rounded-lg border border-gray-700 p-4 overflow-y-auto">
            {selectedSkill ? (
              <div className="text-white">
                <div className="text-3xl mb-2">{selectedSkill.icon}</div>
                <h3 className="text-xl font-bold mb-1">{selectedSkill.name}</h3>
                <div className="text-sm text-gray-400 mb-3">{selectedSkill.description}</div>
                
                <div className="mb-4">
                  <div className="text-sm text-gray-400 mb-1">Progress</div>
                  <div className="flex items-center">
                    <div className="flex-1 h-2 bg-gray-700 rounded-full overflow-hidden">
                      <div 
                        className="h-full bg-blue-500"
                        style={{ width: `${(selectedSkill.level / selectedSkill.maxLevel) * 100}%` }}
                      />
                    </div>
                    <div className="ml-2 text-sm font-medium">
                      {selectedSkill.level}/{selectedSkill.maxLevel}
                    </div>
                  </div>
                </div>
                
                <div className="mb-4">
                  <div className="text-sm text-gray-400 mb-1">Effects</div>
                  <ul className="list-disc list-inside text-sm">
                    {selectedSkill.effects.map((effect, index) => (
                      <li key={index} className={index < selectedSkill.level ? 'text-green-400' : 'text-gray-500'}>
                        {effect}
                      </li>
                    ))}
                  </ul>
                </div>
                
                {selectedSkill.requiredSkills.length > 0 && (
                  <div className="mb-4">
                    <div className="text-sm text-gray-400 mb-1">Requirements</div>
                    <ul className="list-disc list-inside text-sm">
                      {selectedSkill.requiredSkills.map(reqId => {
                        const requiredSkill = skills.find(s => s.id === reqId);
                        return (
                          <li key={reqId} className={requiredSkill?.unlocked ? 'text-green-400' : 'text-red-400'}>
                            {requiredSkill?.name || reqId} (Level {selectedSkill.requiredLevel})
                          </li>
                        );
                      })}
                    </ul>
                  </div>
                )}
                
                <button
                  className={`w-full py-2 px-4 rounded-lg font-medium text-center 
                    ${canUnlockSkill(selectedSkill)
                      ? 'bg-blue-600 hover:bg-blue-700 text-white'
                      : 'bg-gray-700 text-gray-500 cursor-not-allowed'
                    }`}
                  onClick={() => {
                    if (canUnlockSkill(selectedSkill)) {
                      unlockSkill(selectedSkill.id);
                    }
                  }}
                  disabled={!canUnlockSkill(selectedSkill)}
                >
                  {selectedSkill.unlocked
                    ? selectedSkill.level >= selectedSkill.maxLevel
                      ? 'Maxed Out'
                      : `Upgrade (${skillPoints} point${skillPoints !== 1 ? 's' : ''} left)`
                    : `Unlock (${skillPoints} point${skillPoints !== 1 ? 's' : ''} left)`
                  }
                </button>
              </div>
            ) : (
              <div className="text-gray-500 text-center py-10">
                Select a skill to view details
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default SkillTree;