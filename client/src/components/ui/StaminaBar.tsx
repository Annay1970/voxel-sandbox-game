import React, { useEffect, useState } from 'react';
import { useVoxelGame } from '../../lib/stores/useVoxelGame';

interface StaminaBarProps {
  className?: string;
}

const StaminaBar: React.FC<StaminaBarProps> = ({ className = '' }) => {
  const { player, getStaminaPercentage } = useVoxelGame();
  const [staminaPercentage, setStaminaPercentage] = useState(100);
  
  // Update stamina percentage when player stamina changes
  useEffect(() => {
    setStaminaPercentage(getStaminaPercentage());
  }, [player.stamina, getStaminaPercentage]);
  
  // Determine color based on stamina level
  const getStaminaColor = () => {
    if (staminaPercentage > 70) return 'bg-green-500';
    if (staminaPercentage > 30) return 'bg-yellow-500';
    return 'bg-red-500';
  };
  
  return (
    <div className={`fixed bottom-16 left-1/2 transform -translate-x-1/2 w-64 h-3 bg-gray-800 rounded-full overflow-hidden ${className}`}>
      <div 
        className={`h-full transition-all duration-300 ${getStaminaColor()}`}
        style={{ width: `${staminaPercentage}%` }}
      />
      {/* Show a sprinting icon when player is sprinting */}
      {player.isSprinting && (
        <div className="absolute -top-6 right-0 text-yellow-400 font-bold">
          SPRINT
        </div>
      )}
    </div>
  );
};

export default StaminaBar;