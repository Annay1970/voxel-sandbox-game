import React, { useState, useEffect } from 'react';

interface TemperatureIndicatorProps {
  position?: 'top-left' | 'top-right' | 'bottom-left' | 'bottom-right';
  showText?: boolean;
}

enum TemperatureState {
  FreezingCold = 'freezing-cold',
  Cold = 'cold',
  Cool = 'cool',
  Normal = 'normal',
  Warm = 'warm',
  Hot = 'hot',
  Scorching = 'scorching'
}

export default function TemperatureIndicator({
  position = 'top-right',
  showText = true
}: TemperatureIndicatorProps) {
  // In a real implementation, this would be connected to the game state
  // const temperature = useVoxelGame(state => state.player.temperature);
  const [temperatureValue, setTemperatureValue] = useState(72); // 0-100 range
  const [trend, setTrend] = useState<'rising' | 'falling' | 'stable'>('stable');
  
  // Simulate temperature changes
  useEffect(() => {
    const interval = setInterval(() => {
      // Small random fluctuation
      const change = (Math.random() - 0.5) * 5;
      
      setTemperatureValue(prev => {
        const newTemp = Math.max(0, Math.min(100, prev + change));
        if (newTemp > prev + 1) setTrend('rising');
        else if (newTemp < prev - 1) setTrend('falling');
        else setTrend('stable');
        return newTemp;
      });
    }, 3000);
    
    return () => clearInterval(interval);
  }, []);
  
  // Determine temperature state
  const getTemperatureState = (): TemperatureState => {
    if (temperatureValue < 10) return TemperatureState.FreezingCold;
    if (temperatureValue < 30) return TemperatureState.Cold;
    if (temperatureValue < 45) return TemperatureState.Cool;
    if (temperatureValue < 55) return TemperatureState.Normal;
    if (temperatureValue < 70) return TemperatureState.Warm;
    if (temperatureValue < 90) return TemperatureState.Hot;
    return TemperatureState.Scorching;
  };
  
  // Get icon based on temperature state
  const getTemperatureIcon = (): string => {
    const state = getTemperatureState();
    switch (state) {
      case TemperatureState.FreezingCold: return '❄️';
      case TemperatureState.Cold: return '🧊';
      case TemperatureState.Cool: return '🌡️';
      case TemperatureState.Normal: return '😊';
      case TemperatureState.Warm: return '☀️';
      case TemperatureState.Hot: return '🔥';
      case TemperatureState.Scorching: return '🌋';
      default: return '🌡️';
    }
  };
  
  // Get display text
  const getTemperatureText = (): string => {
    const state = getTemperatureState();
    return state.split('-').map(word => 
      word.charAt(0).toUpperCase() + word.slice(1)
    ).join(' ');
  };
  
  // Get color based on temperature
  const getTemperatureColor = (): string => {
    const state = getTemperatureState();
    switch (state) {
      case TemperatureState.FreezingCold: return 'bg-blue-800 text-blue-200';
      case TemperatureState.Cold: return 'bg-blue-600 text-blue-100';
      case TemperatureState.Cool: return 'bg-blue-400 text-gray-900';
      case TemperatureState.Normal: return 'bg-green-500 text-green-900';
      case TemperatureState.Warm: return 'bg-yellow-500 text-yellow-900';
      case TemperatureState.Hot: return 'bg-red-500 text-white';
      case TemperatureState.Scorching: return 'bg-red-800 text-red-100';
      default: return 'bg-gray-500 text-white';
    }
  };
  
  // Get trend indicator
  const getTrendIndicator = (): string => {
    switch (trend) {
      case 'rising': return '↑';
      case 'falling': return '↓';
      default: return '→';
    }
  };
  
  // Position classes
  const positionClasses = {
    'top-left': 'top-4 left-4',
    'top-right': 'top-20 right-4',
    'bottom-left': 'bottom-4 left-4',
    'bottom-right': 'bottom-4 right-4'
  };
  
  return (
    <div className={`fixed ${positionClasses[position]} z-10`}>
      <div className={`flex items-center rounded-full ${getTemperatureColor()} px-3 py-1.5 shadow-lg backdrop-blur-sm transition-colors duration-500`}>
        <span className="text-lg mr-2">{getTemperatureIcon()}</span>
        {showText && (
          <div className="flex flex-col">
            <div className="text-xs font-medium">{getTemperatureText()}</div>
            <div className="flex items-center text-xs">
              <span>{Math.round(temperatureValue)}°</span>
              <span className="ml-1">{getTrendIndicator()}</span>
            </div>
          </div>
        )}
      </div>
      
      {/* Effects when in extreme temperatures */}
      {(getTemperatureState() === TemperatureState.FreezingCold || 
        getTemperatureState() === TemperatureState.Scorching) && (
        <div className={`mt-2 px-3 py-1 rounded-md text-xs font-medium animate-pulse ${
          getTemperatureState() === TemperatureState.FreezingCold ? 'bg-blue-800 text-blue-200' : 'bg-red-800 text-red-200'
        }`}>
          {getTemperatureState() === TemperatureState.FreezingCold ? 'Losing health due to cold' : 'Losing health due to heat'}
        </div>
      )}
    </div>
  );
}