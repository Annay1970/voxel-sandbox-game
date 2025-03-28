import React, { useState } from 'react';
import { useSkills, SkillType } from '../../lib/stores/useSkills';

interface SkillBarProps {
  skillType: SkillType;
  name: string;
  color: string;
}

// Individual skill bar component
const SkillBar: React.FC<SkillBarProps> = ({ skillType, name, color }) => {
  const skill = useSkills(state => state.skills[skillType]);
  const getProgressPercent = useSkills(state => state.getProgressPercent);
  
  const progressPercent = getProgressPercent(skillType);
  
  return (
    <div className="flex flex-col mb-2">
      <div className="flex justify-between items-center mb-1">
        <span className="text-white text-xs font-semibold">{name}</span>
        <span className="text-white text-xs font-medium">Level {skill.level}</span>
      </div>
      <div className="h-2 w-full bg-gray-700 rounded overflow-hidden">
        <div 
          className="h-full rounded transition-all duration-500 ease-out" 
          style={{ 
            width: `${progressPercent}%`,
            backgroundColor: color
          }}
        />
      </div>
      <div className="flex justify-end">
        <span className="text-gray-300 text-xs mt-1">
          {skill.xp}/{skill.nextLevelXp} XP
        </span>
      </div>
    </div>
  );
};

// Skills UI panel
export default function SkillsUI() {
  const [isOpen, setIsOpen] = useState(false);
  
  // Skills data for rendering
  const skills = [
    { type: 'mining' as SkillType, name: 'Mining', color: '#ff6666' },
    { type: 'woodcutting' as SkillType, name: 'Woodcutting', color: '#66ff66' },
    { type: 'farming' as SkillType, name: 'Farming', color: '#66ffff' },
    { type: 'combat' as SkillType, name: 'Combat', color: '#6666ff' },
    { type: 'building' as SkillType, name: 'Building', color: '#ffaa66' },
    { type: 'crafting' as SkillType, name: 'Crafting', color: '#ff66ff' }
  ];
  
  // Get total level for display
  const totalLevel = useSkills(state => state.totalLevel);
  
  if (!isOpen) {
    return (
      <button 
        className="fixed bottom-4 right-4 bg-gray-800 hover:bg-gray-700 text-white font-bold py-2 px-4 rounded shadow-lg"
        onClick={() => setIsOpen(true)}
      >
        Skills (Level {totalLevel})
      </button>
    );
  }
  
  return (
    <div className="fixed bottom-4 right-4 bg-gray-800 bg-opacity-90 p-4 rounded-lg shadow-lg w-64 z-50">
      <div className="flex justify-between items-center mb-4">
        <h3 className="text-white font-bold">Skills</h3>
        <div className="flex space-x-2">
          <span className="text-white text-sm">Total Level: {totalLevel}</span>
          <button 
            className="text-white hover:text-gray-300 font-bold"
            onClick={() => setIsOpen(false)}
          >
            X
          </button>
        </div>
      </div>
      
      <div className="space-y-4">
        {skills.map(skill => (
          <SkillBar
            key={skill.type}
            skillType={skill.type}
            name={skill.name}
            color={skill.color}
          />
        ))}
      </div>
      
      {/* Skill effects summary */}
      <div className="mt-4 border-t border-gray-600 pt-3">
        <h4 className="text-white font-semibold text-sm mb-2">Skill Effects</h4>
        <ul className="text-gray-300 text-xs space-y-1">
          <li>• Movement Speed: +{((useSkills(state => state.characterSpeed) - 1) * 100).toFixed(0)}%</li>
          <li>• Character Size: +{((useSkills(state => state.characterSize) - 1) * 100).toFixed(0)}%</li>
          <li>• Strength: +{((useSkills(state => state.strengthMultiplier) - 1) * 100).toFixed(0)}%</li>
        </ul>
      </div>
    </div>
  );
}