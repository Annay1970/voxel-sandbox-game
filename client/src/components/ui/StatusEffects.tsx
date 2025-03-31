import React, { useEffect, useState } from 'react';
import { useVoxelGame } from '../../lib/stores/useVoxelGame';

export type StatusEffectType = 'none' | 'haste' | 'mining_fatigue' | 'regeneration' | 
  'slowness' | 'strength' | 'weakness' | 'resistance' | 'poison' | 'night_vision' | 
  'saturation' | 'hunger' | 'glowing';

export interface StatusEffect {
  type: StatusEffectType;
  duration: number; // In seconds
  intensity: number; // 1-5 levels
  startTime: number; // When the effect started (timestamp)
}

// Icons for each status effect (emoji for simplicity)
const STATUS_EFFECT_ICONS: Record<StatusEffectType, string> = {
  'none': '',
  'haste': '⚒️',
  'mining_fatigue': '🔨',
  'regeneration': '❤️',
  'slowness': '🐢',
  'strength': '💪',
  'weakness': '🦴',
  'resistance': '🛡️',
  'poison': '☠️',
  'night_vision': '👁️',
  'saturation': '🍗',
  'hunger': '🍽️',
  'glowing': '✨'
};

// Colors for each status effect
const STATUS_EFFECT_COLORS: Record<StatusEffectType, string> = {
  'none': 'bg-gray-500',
  'haste': 'bg-yellow-500',
  'mining_fatigue': 'bg-gray-700',
  'regeneration': 'bg-pink-500',
  'slowness': 'bg-blue-700',
  'strength': 'bg-red-700',
  'weakness': 'bg-brown-500',
  'resistance': 'bg-gray-300',
  'poison': 'bg-green-700',
  'night_vision': 'bg-indigo-500',
  'saturation': 'bg-yellow-600',
  'hunger': 'bg-yellow-800',
  'glowing': 'bg-yellow-400'
};

// Description of each status effect
const STATUS_EFFECT_DESCRIPTIONS: Record<StatusEffectType, string> = {
  'none': 'No effect',
  'haste': 'Increases mining speed',
  'mining_fatigue': 'Decreases mining speed',
  'regeneration': 'Gradually restores health',
  'slowness': 'Decreases movement speed',
  'strength': 'Increases attack damage',
  'weakness': 'Decreases attack damage',
  'resistance': 'Decreases damage taken',
  'poison': 'Deals damage over time',
  'night_vision': 'Allows seeing in dark areas',
  'saturation': 'Gradually restores hunger',
  'hunger': 'Gradually depletes hunger',
  'glowing': 'Makes you visible through walls'
};

interface StatusEffectsProps {
  className?: string;
  position?: 'top-left' | 'top-right' | 'bottom-left' | 'bottom-right';
}

const StatusEffects: React.FC<StatusEffectsProps> = ({ 
  className = '',
  position = 'bottom-left'
}) => {
  // In a real game, this would be stored in the game state
  const [activeEffects, setActiveEffects] = useState<StatusEffect[]>([]);
  
  // Timer to update the duration
  useEffect(() => {
    const timer = setInterval(() => {
      const now = Date.now();
      setActiveEffects(prevEffects => 
        prevEffects
          .filter(effect => (effect.startTime + effect.duration * 1000) > now)
          .map(effect => ({
            ...effect
          }))
      );
    }, 1000);
    
    return () => clearInterval(timer);
  }, []);
  
  // Add a demonstration effect
  useEffect(() => {
    // Add a demonstration effect for Ancient Ruins
    // In a real game, this would be triggered by game events
    const ruinsEffect: StatusEffect = {
      type: 'night_vision',
      duration: 60, // 60 seconds
      intensity: 2,
      startTime: Date.now()
    };
    
    setActiveEffects(prev => [...prev, ruinsEffect]);
    
    // Add another effect after 5 seconds
    const timer = setTimeout(() => {
      const strengthEffect: StatusEffect = {
        type: 'strength',
        duration: 30, // 30 seconds
        intensity: 1,
        startTime: Date.now()
      };
      setActiveEffects(prev => [...prev, strengthEffect]);
    }, 5000);
    
    return () => clearTimeout(timer);
  }, []);
  
  // Get position classes
  const positionClasses = {
    'top-left': 'top-2 left-2',
    'top-right': 'top-2 right-2',
    'bottom-left': 'bottom-2 left-2',
    'bottom-right': 'bottom-2 right-2'
  }[position];
  
  // If no active effects, don't render anything
  if (activeEffects.length === 0) {
    return null;
  }
  
  return (
    <div className={`fixed ${positionClasses} z-20 ${className}`}>
      <div className="flex flex-col gap-1">
        {activeEffects.map((effect, index) => {
          // Calculate remaining duration
          const elapsedMs = Date.now() - effect.startTime;
          const remainingSeconds = Math.max(0, effect.duration - Math.floor(elapsedMs / 1000));
          const remainingPercentage = (remainingSeconds / effect.duration) * 100;
          
          return (
            <div 
              key={`${effect.type}-${index}`}
              className="flex items-center bg-black/70 rounded-md p-1 border border-white/20"
              title={STATUS_EFFECT_DESCRIPTIONS[effect.type]}
            >
              {/* Icon */}
              <div className={`w-8 h-8 ${STATUS_EFFECT_COLORS[effect.type]} rounded-full flex items-center justify-center text-white`}>
                {STATUS_EFFECT_ICONS[effect.type]}
              </div>
              
              {/* Name and duration */}
              <div className="ml-2 text-white">
                <div className="text-xs font-bold capitalize">
                  {effect.type.replace('_', ' ')} {Array(effect.intensity).fill('I').join('')}
                </div>
                <div className="text-xs text-gray-300">
                  {Math.floor(remainingSeconds / 60)}:{(remainingSeconds % 60).toString().padStart(2, '0')}
                </div>
              </div>
              
              {/* Duration bar */}
              <div className="ml-2 w-16 h-1 bg-gray-700 rounded-full overflow-hidden">
                <div 
                  className={`h-full ${STATUS_EFFECT_COLORS[effect.type]}`}
                  style={{ width: `${remainingPercentage}%` }}
                />
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default StatusEffects;