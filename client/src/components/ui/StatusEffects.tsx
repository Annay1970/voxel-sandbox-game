import React, { useEffect, useState } from 'react';

export interface StatusEffect {
  id: string;
  name: string;
  description: string;
  icon: string;
  duration: number; // in seconds, -1 for permanent
  intensity: number; // 1-5, used for stacking or intensity of effect
  type: 'buff' | 'debuff' | 'neutral';
  timestamp: number; // when the effect was applied
}

interface StatusEffectsProps {
  position?: 'top-left' | 'top-right' | 'bottom-left' | 'bottom-right';
}

export default function StatusEffects({ position = 'bottom-left' }: StatusEffectsProps) {
  // This would normally come from a game state
  const [activeEffects, setActiveEffects] = useState<StatusEffect[]>([
    {
      id: 'well_fed',
      name: 'Well Fed',
      description: 'Hunger decreases slower',
      icon: '🍖',
      duration: 300, // 5 minutes
      intensity: 2,
      type: 'buff',
      timestamp: Date.now()
    },
    {
      id: 'chilled',
      name: 'Chilled',
      description: 'Movement speed reduced',
      icon: '❄️',
      duration: 120, // 2 minutes
      intensity: 1,
      type: 'debuff',
      timestamp: Date.now()
    }
  ]);

  // Position classes mapping
  const positionClasses = {
    'top-left': 'top-4 left-4',
    'top-right': 'top-4 right-4',
    'bottom-left': 'bottom-4 left-4',
    'bottom-right': 'bottom-4 right-4'
  };

  // Clean up expired effects
  useEffect(() => {
    const intervalId = setInterval(() => {
      const now = Date.now();
      setActiveEffects(prev => 
        prev.filter(effect => 
          effect.duration === -1 || // permanent effects
          now - effect.timestamp < effect.duration * 1000 // timed effects
        )
      );
    }, 1000);

    return () => clearInterval(intervalId);
  }, []);

  // Calculate remaining time for an effect
  const getRemainingTime = (effect: StatusEffect): string => {
    if (effect.duration === -1) return 'Permanent';
    
    const elapsed = (Date.now() - effect.timestamp) / 1000;
    const remaining = effect.duration - elapsed;
    
    if (remaining <= 0) return 'Expired';
    
    // Format remaining time
    const minutes = Math.floor(remaining / 60);
    const seconds = Math.floor(remaining % 60);
    return `${minutes}:${seconds.toString().padStart(2, '0')}`;
  };

  // Get color based on effect type
  const getEffectColor = (type: StatusEffect['type']): string => {
    switch(type) {
      case 'buff': return 'bg-green-800 border-green-500';
      case 'debuff': return 'bg-red-800 border-red-500';
      case 'neutral': return 'bg-blue-800 border-blue-500';
      default: return 'bg-gray-800 border-gray-500';
    }
  };

  if (activeEffects.length === 0) return null;

  return (
    <div className={`fixed ${positionClasses[position]} flex flex-col space-y-2 z-10`}>
      {activeEffects.map(effect => (
        <div 
          key={effect.id}
          className={`px-3 py-2 rounded-lg border ${getEffectColor(effect.type)} text-white flex items-center space-x-2 backdrop-blur-sm`}
          style={{ minWidth: '160px' }}
        >
          <div className="text-2xl">{effect.icon}</div>
          <div className="flex-1">
            <div className="flex justify-between items-center">
              <span className="font-medium">{effect.name}</span>
              <span className="text-xs opacity-80">{getRemainingTime(effect)}</span>
            </div>
            <div className="text-xs opacity-70">{effect.description}</div>
            {/* Intensity indicators */}
            <div className="flex mt-1 space-x-1">
              {Array.from({ length: 5 }).map((_, i) => (
                <div 
                  key={i}
                  className={`h-1 w-2 rounded-sm ${i < effect.intensity ? 'bg-white' : 'bg-gray-600'}`}
                />
              ))}
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}