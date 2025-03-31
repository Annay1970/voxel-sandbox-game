import React, { useState, useEffect } from 'react';

interface StaminaBarProps {
  maxValue?: number;
  width?: number;
  height?: number;
}

export default function StaminaBar({
  maxValue = 100,
  width = 200,
  height = 16
}: StaminaBarProps) {
  // Simulated stamina value - in a real game this would come from game state
  // const stamina = useVoxelGame(state => state.player.stamina);
  const [stamina, setStamina] = useState(80);
  const [isRecovering, setIsRecovering] = useState(true);
  const [isDepletingFast, setIsDepletingFast] = useState(false);
  
  // Simulate stamina usage/recovery
  useEffect(() => {
    const interval = setInterval(() => {
      if (isRecovering) {
        setStamina(prev => Math.min(maxValue, prev + 2));
        if (stamina >= maxValue) {
          setIsRecovering(false);
          setIsDepletingFast(true);
        }
      } else {
        const rate = isDepletingFast ? 5 : 1;
        setStamina(prev => Math.max(0, prev - rate));
        if (stamina <= 0) {
          setIsRecovering(true);
          setIsDepletingFast(false);
        }
        
        // Switch after a while to simulate different activity levels
        if (isDepletingFast && stamina < 60) {
          setIsDepletingFast(false);
        }
      }
    }, 200);
    
    return () => clearInterval(interval);
  }, [stamina, isRecovering, isDepletingFast, maxValue]);
  
  // Calculate percentage
  const percentage = (stamina / maxValue) * 100;
  
  // Determine color based on stamina level
  const getStaminaColor = () => {
    if (percentage > 70) return 'bg-blue-500';
    if (percentage > 30) return 'bg-blue-400';
    return 'bg-blue-300';
  };
  
  // Determine background color
  const getBackgroundColor = () => {
    if (percentage < 20) return 'bg-red-900';
    return 'bg-gray-700';
  };
  
  // Determine text and its color
  const getStaminaText = () => {
    if (percentage > 70) return 'Full Energy';
    if (percentage > 30) return 'Moderate Energy';
    return 'Low Energy';
  };
  
  const getTextColor = () => {
    if (percentage < 30) return 'text-red-300';
    return 'text-white';
  };
  
  return (
    <div className="fixed bottom-4 left-1/2 transform -translate-x-1/2 z-10">
      <div className="text-xs font-medium text-center mb-1">{getStaminaText()}</div>
      <div className="flex items-center">
        <div 
          className={`relative ${getBackgroundColor()} rounded-full overflow-hidden backdrop-blur-sm`}
          style={{ width: `${width}px`, height: `${height}px` }}
        >
          <div 
            className={`absolute left-0 top-0 h-full transition-all duration-200 ease-out ${getStaminaColor()}`}
            style={{ width: `${percentage}%` }}
          />
          <div 
            className={`absolute inset-0 flex items-center justify-center ${getTextColor()} text-xs font-bold`}
          >
            {Math.round(stamina)} / {maxValue}
          </div>
        </div>
      </div>
      
      {/* Display current status */}
      {isDepletingFast && (
        <div className="text-xs text-red-400 text-center mt-1 font-medium animate-pulse">
          Sprinting
        </div>
      )}
      {stamina < 20 && (
        <div className="text-xs text-red-500 text-center mt-1 font-medium">
          Exhausted
        </div>
      )}
    </div>
  );
}