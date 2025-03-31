import React, { useState, useEffect } from 'react';

interface HungerBarProps {
  position?: 'top' | 'right' | 'bottom' | 'left';
  maxValue?: number;
  showText?: boolean;
}

export default function HungerBar({
  position = 'right',
  maxValue = 20,
  showText = true
}: HungerBarProps) {
  // In a real implementation, this would be connected to the game state
  // const hunger = useVoxelGame(state => state.player.hunger);
  const [hunger, setHunger] = useState(16); // Simulate hunger level (0-20)
  
  // Add this to simulate hunger depletion
  useEffect(() => {
    const interval = setInterval(() => {
      setHunger(prev => Math.max(0, prev - 0.2));
    }, 3000);
    
    return () => clearInterval(interval);
  }, []);
  
  // Position styling
  const positionStyles = {
    top: 'top-4 left-1/2 transform -translate-x-1/2 flex-row',
    right: 'right-4 top-1/2 transform -translate-y-1/2 flex-col',
    bottom: 'bottom-4 left-1/2 transform -translate-x-1/2 flex-row',
    left: 'left-4 top-1/2 transform -translate-y-1/2 flex-col'
  };
  
  // Calculate food icons
  const fullIcons = Math.floor(hunger / 2);
  const halfIcon = hunger % 2 === 1;
  const emptyIcons = maxValue / 2 - fullIcons - (halfIcon ? 1 : 0);
  
  // Get hunger status color
  const getHungerColor = () => {
    const percentage = (hunger / maxValue) * 100;
    if (percentage > 70) return 'text-green-500';
    if (percentage > 30) return 'text-yellow-500';
    return 'text-red-500';
  };
  
  // Get hunger status text
  const getHungerStatus = () => {
    const percentage = (hunger / maxValue) * 100;
    if (percentage > 70) return 'Well Fed';
    if (percentage > 30) return 'Hungry';
    return 'Starving';
  };
  
  return (
    <div className={`fixed ${positionStyles[position]} gap-1 z-10`}>
      {/* If top or bottom, we show horizontal layout */}
      {(position === 'top' || position === 'bottom') ? (
        <>
          {showText && (
            <div className={`text-center text-sm font-medium ${getHungerColor()} mb-1`}>
              {getHungerStatus()}
            </div>
          )}
          <div className="flex items-center bg-gray-900 bg-opacity-50 backdrop-blur-sm rounded-full p-2">
            {[...Array(fullIcons)].map((_, i) => (
              <div key={`full-${i}`} className="text-yellow-500 px-0.5">🍖</div>
            ))}
            {halfIcon && <div className="text-yellow-500 px-0.5">🍗</div>}
            {[...Array(Math.floor(emptyIcons))].map((_, i) => (
              <div key={`empty-${i}`} className="text-gray-500 px-0.5">🍖</div>
            ))}
          </div>
        </>
      ) : (
        // Vertical layout for left/right
        <div className="bg-gray-900 bg-opacity-50 backdrop-blur-sm rounded-lg p-2">
          {showText && (
            <div className={`text-center text-sm font-medium ${getHungerColor()} mb-2`}>
              {getHungerStatus()}
            </div>
          )}
          <div className="flex flex-col items-center">
            {[...Array(fullIcons)].map((_, i) => (
              <div key={`full-${i}`} className="text-yellow-500 py-0.5">🍖</div>
            ))}
            {halfIcon && <div className="text-yellow-500 py-0.5">🍗</div>}
            {[...Array(Math.floor(emptyIcons))].map((_, i) => (
              <div key={`empty-${i}`} className="text-gray-500 py-0.5">🍖</div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}