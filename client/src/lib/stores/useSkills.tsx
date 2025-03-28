import { create } from 'zustand';

// Define the types of skills the player can have
export type SkillType = 'mining' | 'woodcutting' | 'farming' | 'combat' | 'building' | 'crafting';

// Level thresholds - how much XP is needed for each level
const XP_PER_LEVEL = 100; // Base XP needed for level 1
const XP_MULTIPLIER = 1.5; // XP needed increases by this factor for each level

// Interface defining what a skill contains
export interface Skill {
  level: number;        // Current level (starts at 0)
  xp: number;           // Current XP
  nextLevelXp: number;  // XP needed for next level
  bonuses: {            // Bonuses granted by this skill
    speed: number;      // Speed bonus (e.g., mining faster)
    efficiency: number; // Efficiency bonus (e.g., more resources)
    strength: number;   // Strength bonus (e.g., more damage)
  };
}

// Interface for the skill state manager
interface SkillState {
  // Skill data
  skills: Record<SkillType, Skill>;
  
  // Total stats derived from all skills
  totalLevel: number;
  
  // Character growth indicators
  characterSize: number;   // Player size grows slightly with levels
  characterSpeed: number;  // Movement speed increases with levels
  strengthMultiplier: number;  // Damage dealt increases with levels
  
  // Actions
  addXp: (skillType: SkillType, amount: number) => void;
  getProgressPercent: (skillType: SkillType) => number;
  getLevelUpMessage: (skillType: SkillType) => string;
}

// Calculate XP needed for a given level
function calculateXpForLevel(level: number): number {
  return Math.floor(XP_PER_LEVEL * Math.pow(XP_MULTIPLIER, level));
}

// Helper function to create a fresh skill object
function createSkill(): Skill {
  return {
    level: 0,
    xp: 0,
    nextLevelXp: XP_PER_LEVEL,
    bonuses: {
      speed: 0,
      efficiency: 0,
      strength: 0,
    }
  };
}

// Create the skill store
export const useSkills = create<SkillState>((set, get) => ({
  // Initialize all skills at level 0
  skills: {
    mining: createSkill(),
    woodcutting: createSkill(),
    farming: createSkill(),
    combat: createSkill(),
    building: createSkill(),
    crafting: createSkill(),
  },
  
  // Start with baseline stats
  totalLevel: 0,
  characterSize: 1.0,  // Base character size
  characterSpeed: 1.0, // Base movement speed
  strengthMultiplier: 1.0, // Base strength
  
  // Add XP to a skill and handle level-ups
  addXp: (skillType, amount) => {
    set(state => {
      // Get the current skill
      const skill = state.skills[skillType];
      
      // Add XP
      const newXp = skill.xp + amount;
      
      // Check if this XP results in level up
      let level = skill.level;
      let nextLevelXp = skill.nextLevelXp;
      let levelUp = false;
      
      // Keep leveling up as long as we have enough XP
      while (newXp >= nextLevelXp) {
        level++;
        levelUp = true;
        nextLevelXp = calculateXpForLevel(level);
      }
      
      // Calculate new bonuses based on level
      const bonuses = {
        speed: level * 0.05,        // 5% speed increase per level
        efficiency: level * 0.1,    // 10% efficiency increase per level
        strength: level * 0.08,     // 8% strength increase per level
      };
      
      // Update the skill
      const updatedSkill: Skill = {
        level,
        xp: newXp,
        nextLevelXp,
        bonuses,
      };
      
      // Calculate new totals
      const skills = {
        ...state.skills,
        [skillType]: updatedSkill
      };
      
      // Calculate total level across all skills
      const totalLevel = Object.values(skills).reduce(
        (sum, skill) => sum + skill.level, 
        0
      );
      
      // Calculate character growth indicators based on total level
      const characterSize = 1.0 + (totalLevel * 0.005); // Max +50% size at level 100
      const characterSpeed = 1.0 + (totalLevel * 0.01); // Max +100% speed at level 100
      const strengthMultiplier = 1.0 + (totalLevel * 0.02); // Max +200% strength at level 100
      
      // Print level up message if needed
      if (levelUp) {
        console.log(`Level up! ${skillType} is now level ${level}`);
      }
      
      // Return the new state
      return {
        skills,
        totalLevel,
        characterSize,
        characterSpeed,
        strengthMultiplier
      };
    });
  },
  
  // Calculate progress percentage to next level
  getProgressPercent: (skillType) => {
    const { xp, nextLevelXp, level } = get().skills[skillType];
    
    // If level 0, calculate from 0 to first level threshold
    if (level === 0) {
      return (xp / nextLevelXp) * 100;
    }
    
    // Otherwise, calculate progress between current level and next
    const prevLevelXp = calculateXpForLevel(level - 1);
    const progress = (xp - prevLevelXp) / (nextLevelXp - prevLevelXp);
    return progress * 100;
  },
  
  // Get skill level up message with benefits
  getLevelUpMessage: (skillType) => {
    const { level, bonuses } = get().skills[skillType];
    
    // Different messages based on skill type
    switch (skillType) {
      case 'mining':
        return `Mining level ${level}! +${(bonuses.speed * 100).toFixed(0)}% mining speed, +${(bonuses.efficiency * 100).toFixed(0)}% ore yield`;
      case 'woodcutting':
        return `Woodcutting level ${level}! +${(bonuses.speed * 100).toFixed(0)}% chopping speed, +${(bonuses.efficiency * 100).toFixed(0)}% wood yield`;
      case 'farming':
        return `Farming level ${level}! +${(bonuses.speed * 100).toFixed(0)}% growth rate, +${(bonuses.efficiency * 100).toFixed(0)}% crop yield`;
      case 'combat':
        return `Combat level ${level}! +${(bonuses.strength * 100).toFixed(0)}% damage, +${(bonuses.speed * 100).toFixed(0)}% attack speed`;
      case 'building':
        return `Building level ${level}! +${(bonuses.speed * 100).toFixed(0)}% building speed, +${(bonuses.efficiency * 100).toFixed(0)}% resource efficiency`;
      case 'crafting':
        return `Crafting level ${level}! +${(bonuses.speed * 100).toFixed(0)}% crafting speed, +${(bonuses.efficiency * 100).toFixed(0)}% item quality`;
      default:
        return `${skillType} level ${level}!`;
    }
  }
}));