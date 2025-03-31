import React, { useState, useEffect } from 'react';
import { useVoxelGame } from '../../lib/stores/useVoxelGame';

interface TemperatureIndicatorProps {
  className?: string;
}

const TemperatureIndicator: React.FC<TemperatureIndicatorProps> = ({ className = '' }) => {
  const { player } = useVoxelGame();
  const { temperature, temperatureEffects } = player;
  
  // Convert temperature range (-1 to 1) to percentage (0 to 100)
  const temperaturePercentage = ((temperature + 1) / 2) * 100;
  
  // Visual effects for extreme temperatures
  const [showEffect, setShowEffect] = useState(false);
  
  useEffect(() => {
    // Pulse the visual effect when active
    if (temperatureEffects.visualEffect !== 'none') {
      const interval = setInterval(() => {
        setShowEffect(prev => !prev);
      }, 500);
      
      return () => clearInterval(interval);
    }
  }, [temperatureEffects.visualEffect]);
  
  return (
    <div className={`fixed top-24 right-4 flex flex-col items-center ${className}`}>
      {/* Temperature meter */}
      <div className="w-6 h-32 bg-gray-800 rounded-full overflow-hidden relative flex flex-col-reverse">
        {/* Cold indicator (blue) */}
        <div 
          className="w-full bg-blue-500 transition-all duration-300"
          style={{ 
            height: `${Math.max(0, 50 - temperaturePercentage)}%`,
            opacity: temperature < 0 ? Math.abs(temperature) : 0.3
          }}
        />
        
        {/* Neutral zone (green) */}
        <div 
          className="w-full bg-green-500 transition-all duration-300"
          style={{ 
            height: temperature > 0 && temperature < 0 ? '20%' : '10%',
            opacity: Math.abs(temperature) < 0.2 ? 1 : 0.3
          }}
        />
        
        {/* Hot indicator (red) */}
        <div 
          className="w-full bg-red-500 transition-all duration-300"
          style={{ 
            height: `${Math.max(0, temperaturePercentage - 50)}%`,
            opacity: temperature > 0 ? temperature : 0.3
          }}
        />
        
        {/* Indicator marker */}
        <div 
          className="absolute w-8 h-1 bg-white right-6 transform translate-y-1/2"
          style={{ bottom: `${temperaturePercentage}%` }}
        />
      </div>
      
      {/* Temperature labels */}
      <div className="text-white font-bold mt-2">
        {temperature <= -0.7 ? (
          <span className="text-blue-400">Freezing</span>
        ) : temperature >= 0.7 ? (
          <span className="text-red-400">Burning</span>
        ) : (
          <span className="text-green-400">Normal</span>
        )}
      </div>
      
      {/* Temperature effect overlay - only show if effect is active */}
      {temperatureEffects.visualEffect !== 'none' && showEffect && (
        <div className={`fixed inset-0 pointer-events-none z-10 ${
          temperatureEffects.visualEffect === 'frost' 
            ? 'bg-blue-500/10 border-8 border-blue-200/20' 
            : 'bg-red-500/10 border-8 border-orange-200/20'
        }`} style={{ 
          opacity: temperatureEffects.effectIntensity * 0.7
        }} />
      )}
    </div>
  );
};

export default TemperatureIndicator;