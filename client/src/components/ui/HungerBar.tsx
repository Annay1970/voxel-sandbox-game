import React, { useEffect, useState } from 'react';
import { useVoxelGame } from '../../lib/stores/useVoxelGame';

interface HungerBarProps {
  className?: string;
}

const HungerBar: React.FC<HungerBarProps> = ({ className = '' }) => {
  const { player } = useVoxelGame();
  const [hungerPercentage, setHungerPercentage] = useState(100);
  const [isHungerWarning, setIsHungerWarning] = useState(false);
  
  // Update hunger percentage when player hunger changes
  useEffect(() => {
    const percentage = (player.hunger / player.maxHunger) * 100;
    setHungerPercentage(percentage);
    
    // Show warning animation when hunger is low
    setIsHungerWarning(percentage < 20);
  }, [player.hunger, player.maxHunger]);
  
  // Determine color based on hunger level
  const getHungerColor = () => {
    if (hungerPercentage > 70) return 'bg-yellow-500';
    if (hungerPercentage > 30) return 'bg-yellow-600';
    return 'bg-red-600';
  };
  
  // Pulsing animation for low hunger warning
  useEffect(() => {
    if (!isHungerWarning) return;
    
    const interval = setInterval(() => {
      const elem = document.getElementById('hunger-bar');
      if (elem) {
        elem.classList.toggle('opacity-50');
      }
    }, 500);
    
    return () => clearInterval(interval);
  }, [isHungerWarning]);
  
  return (
    <div className={`fixed bottom-10 left-1/2 transform -translate-x-1/2 w-64 h-3 bg-gray-800 rounded-full overflow-hidden ${className}`}>
      <div 
        id="hunger-bar"
        className={`h-full transition-all duration-300 ${getHungerColor()}`}
        style={{ width: `${hungerPercentage}%` }}
      />
      
      {/* Show hunger icon and value */}
      <div className="absolute -top-6 left-0 text-yellow-400 font-bold flex items-center">
        <span className="mr-1">🍖</span>
        <span>{Math.ceil(player.hunger)}/{player.maxHunger}</span>
      </div>
      
      {/* Show warning when hunger is very low */}
      {isHungerWarning && (
        <div className="absolute -bottom-6 left-0 text-red-500 text-sm font-bold animate-pulse">
          HUNGRY!
        </div>
      )}
    </div>
  );
};

export default HungerBar;