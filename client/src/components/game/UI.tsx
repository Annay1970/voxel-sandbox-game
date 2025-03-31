import React, { useEffect, useState, useRef } from 'react';
import { BlockType } from '../../lib/blocks';
import { WeatherType } from '../../lib/stores/useVoxelGame';
import { useVoxelGame } from '../../lib/stores/useVoxelGame';
import { useSkills, SkillType } from '../../lib/stores/useSkills';
import Crosshair from './Crosshair';
import MobileControls from './MobileControls';

export default function UI() {
  // Voxel game state
  const selectedBlock = useVoxelGame(state => state.selectedBlock);
  const inventory = useVoxelGame(state => state.inventory);
  const selectedInventorySlot = useVoxelGame(state => state.selectedInventorySlot);
  const blocks = useVoxelGame(state => state.blocks);
  const timeOfDay = useVoxelGame(state => state.timeOfDay);
  const weather = useVoxelGame(state => state.weather);
  const bloodMoonEvent = useVoxelGame(state => state.bloodMoonEvent);
  const dayCount = useVoxelGame(state => state.dayCount);
  
  // Blood moon particle effect refs
  const particlesRef = useRef<HTMLDivElement>(null);
  const [particles, setParticles] = useState<Array<{id: number, x: number, y: number, size: number, speed: number}>>([]);
  
  // Skills state
  const skills = useSkills(state => state.skills);
  const getProgressPercent = useSkills(state => state.getProgressPercent);
  
  // Debug state
  const [showDebug, setShowDebug] = useState(false);
  const [fps, setFps] = useState(0);
  
  // Blood moon particles animation
  useEffect(() => {
    if (!bloodMoonEvent.active || bloodMoonEvent.intensity < 0.5) return;
    
    // Generate initial particles
    const newParticles = [];
    for (let i = 0; i < 20; i++) {
      newParticles.push({
        id: i,
        x: Math.random() * 100,
        y: Math.random() * 100,
        size: 1 + Math.random() * 3,
        speed: 0.2 + Math.random() * 0.5
      });
    }
    setParticles(newParticles);
    
    // Animation frame to update particles
    let animId: number;
    const updateParticles = () => {
      setParticles(prev => prev.map(particle => ({
        ...particle,
        y: particle.y + particle.speed,
        x: particle.x + Math.sin(particle.y / 20) * 0.5,
        // Reset particles that go off screen
        ...(particle.y > 100 ? { y: -10, x: Math.random() * 100 } : {})
      })));
      
      animId = requestAnimationFrame(updateParticles);
    };
    
    animId = requestAnimationFrame(updateParticles);
    
    return () => {
      cancelAnimationFrame(animId);
      setParticles([]);
    };
  }, [bloodMoonEvent.active, bloodMoonEvent.intensity]);
  
  // Selected block info
  const selectedBlockType = selectedBlock ? 
    blocks[`${selectedBlock[0]},${selectedBlock[1]},${selectedBlock[2]}`] || 'air' 
    : null;
  
  // Calculate time of day string
  const getTimeString = () => {
    const hours = Math.floor(timeOfDay * 24);
    const minutes = Math.floor((timeOfDay * 24 * 60) % 60);
    return `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}`;
  };
  
  // Debug mode toggle (F3 key)
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'F3') {
        setShowDebug(prev => !prev);
      }
    };
    
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);
  
  // FPS counter
  useEffect(() => {
    let frameCount = 0;
    let lastTime = performance.now();
    
    const updateFps = () => {
      const now = performance.now();
      frameCount++;
      
      if (now - lastTime >= 1000) {
        setFps(frameCount);
        frameCount = 0;
        lastTime = now;
      }
      
      requestAnimationFrame(updateFps);
    };
    
    const animationId = requestAnimationFrame(updateFps);
    return () => cancelAnimationFrame(animationId);
  }, []);
  
  // Calculate days until next blood moon
  const daysUntilBloodMoon = bloodMoonEvent.active ? 0 : (14 - (dayCount % 14));
  
  return (
    <div className="fixed inset-0 pointer-events-none">
      {/* Crosshair */}
      <Crosshair />
      
      {/* Mobile Controls - pointer-events-auto allows touch through the UI container */}
      <div className="pointer-events-auto">
        <MobileControls />
      </div>
      
      {/* Blood Moon Particles */}
      {bloodMoonEvent.active && (
        <div ref={particlesRef} className="fixed inset-0 overflow-hidden pointer-events-none">
          {particles.map(particle => (
            <div 
              key={particle.id}
              className="absolute rounded-full" 
              style={{
                left: `${particle.x}%`,
                top: `${particle.y}%`,
                width: `${particle.size}px`,
                height: `${particle.size}px`,
                backgroundColor: '#FF2222',
                opacity: 0.7,
                boxShadow: '0 0 4px #FF0000',
                filter: 'blur(1px)'
              }}
            />
          ))}
        </div>
      )}
      
      {/* Blood Moon Alert */}
      {bloodMoonEvent.active && (
        <div className="absolute top-16 left-1/2 transform -translate-x-1/2 bg-red-900 bg-opacity-75 text-white p-2 rounded flex items-center gap-2 animate-pulse">
          <span className="text-red-300">🌑</span>
          <span className="font-bold text-red-100">BLOOD MOON</span>
          <span className="text-red-300">🌑</span>
        </div>
      )}
      
      {/* Blood Moon Countdown */}
      {!bloodMoonEvent.active && daysUntilBloodMoon <= 3 && (
        <div className="absolute top-16 left-1/2 transform -translate-x-1/2 bg-gray-800 bg-opacity-75 text-white p-2 rounded">
          <span className="text-red-300">{daysUntilBloodMoon === 1 ? 'Blood Moon Tonight!' : `Blood Moon in ${daysUntilBloodMoon} days`}</span>
        </div>
      )}
      
      {/* Inventory bar */}
      <div className="absolute bottom-4 left-1/2 transform -translate-x-1/2 flex gap-1">
        {inventory.map((item, index) => (
          <div 
            key={index}
            className={`w-14 h-14 flex items-center justify-center rounded ${
              index === selectedInventorySlot ? 'bg-white' : 'bg-gray-800'
            } border-2 ${
              index === selectedInventorySlot ? 'border-yellow-400' : 'border-gray-700'
            }`}
          >
            {item && item.count > 0 ? (
              <>
                <div 
                  className="w-10 h-10 rounded" 
                  style={{ backgroundColor: getBlockColor(item.type) }}
                />
                <div className="absolute bottom-0 right-1 text-white text-xs">
                  {item.count}
                </div>
              </>
            ) : null}
          </div>
        ))}
      </div>
      
      {/* Selected block info */}
      {selectedBlock && selectedBlockType && (
        <div className="absolute top-4 left-1/2 transform -translate-x-1/2 bg-gray-800 bg-opacity-75 text-white p-2 rounded">
          {selectedBlockType !== 'air' ? (
            <div className="flex items-center gap-2">
              <div 
                className="w-4 h-4 rounded" 
                style={{ backgroundColor: getBlockColor(selectedBlockType) }}
              />
              <span className="capitalize">{selectedBlockType}</span>
              <span className="text-xs text-gray-300">
                {selectedBlock[0]}, {selectedBlock[1]}, {selectedBlock[2]}
              </span>
            </div>
          ) : null}
        </div>
      )}
      
      {/* Time and weather */}
      <div className="absolute top-4 right-4 bg-gray-800 bg-opacity-75 text-white p-2 rounded flex items-center gap-2">
        <span>{getTimeString()}</span>
        <span>{getWeatherIcon(weather)}</span>
        <span>Day {dayCount}</span>
        {bloodMoonEvent.active && (
          <span className="text-red-400 ml-1">🌑</span>
        )}
      </div>
      
      {/* Skills display */}
      <div className="absolute left-4 top-1/2 transform -translate-y-1/2 space-y-2">
        {Object.entries(skills).map(([skillType, skill]) => (
          <div 
            key={skillType} 
            className="bg-gray-800 bg-opacity-75 text-white p-2 rounded"
          >
            <div className="flex justify-between items-center">
              <span className="capitalize">{skillType}</span>
              <span>Level {skill.level}</span>
            </div>
            <div className="w-32 h-2 bg-gray-700 rounded-full overflow-hidden mt-1">
              <div 
                className="h-full rounded-full" 
                style={{ 
                  width: `${getProgressPercent(skillType as SkillType)}%`,
                  backgroundColor: skillType === 'mining' ? '#F9A825' :
                                  skillType === 'woodcutting' ? '#8D6E63' :
                                  skillType === 'farming' ? '#4CAF50' :
                                  skillType === 'combat' ? '#F44336' :
                                  skillType === 'building' ? '#2196F3' :
                                  '#9C27B0'
                }}
              />
            </div>
          </div>
        ))}
      </div>
      
      {/* Debug overlay */}
      {showDebug && (
        <div className="absolute top-20 left-4 bg-gray-900 bg-opacity-90 text-white p-3 rounded text-xs font-mono">
          <h3 className="font-bold mb-2">Debug Info (F3)</h3>
          <div>FPS: {fps}</div>
          <div>Block Count: {Object.keys(blocks).length}</div>
          <div>Player Pos: {selectedBlock ? `${selectedBlock[0]}, ${selectedBlock[1]}, ${selectedBlock[2]}` : 'Unknown'}</div>
          <div>Time: {getTimeString()}</div>
          <div>Weather: {weather}</div>
          <div>Day: {dayCount}</div>
          <div>Blood Moon: {bloodMoonEvent.active ? 'Active' : `In ${daysUntilBloodMoon} days`}</div>
          <div>Blood Moon Intensity: {bloodMoonEvent.intensity.toFixed(2)}</div>
          <div>Inventory Slot: {selectedInventorySlot + 1}/9</div>
        </div>
      )}
    </div>
  );
}

// Helper function to get block color for display
function getBlockColor(type: string): string {
  switch (type) {
    case 'grass': return '#4CAF50';
    case 'dirt': return '#795548';
    case 'stone': return '#9E9E9E';
    case 'sand': return '#FDD835';
    case 'wood': return '#8D6E63';
    case 'leaves': return '#81C784';
    case 'water': return '#2196F3';
    case 'log': return '#5D4037';
    case 'stick': return '#A1887F';
    case 'craftingTable': return '#6D4C41';
    case 'woodenPickaxe': return '#A1887F';
    case 'stonePickaxe': return '#78909C';
    case 'woodenAxe': return '#A1887F';
    case 'woodenShovel': return '#A1887F';
    case 'coal': return '#263238';
    case 'torch': return '#FFB300';
    case 'obsidian': return '#1E1E1E';
    case 'clay': return '#B39DDB';
    case 'glowstone': return '#FFFF00';
    case 'lava': return '#FF5722';
    case 'ice': return '#B3E5FC';
    case 'glass': return '#E0E0E0';
    case 'ironOre': return '#E8EAF6';
    case 'goldOre': return '#FFC107';
    case 'redstone': return '#F44336';
    case 'diamond': return '#00BCD4';
    case 'emerald': return '#4CAF50';
    case 'flower': return '#FF4081';
    case 'roseflower': return '#FF80AB';
    case 'blueflower': return '#2196F3';
    case 'snow': return '#FFFFFF';
    case 'gravel': return '#607D8B';
    case 'cactus': return '#2E7D32';
    default: return '#FFFFFF';
  }
}

// Helper function to get weather icon
function getWeatherIcon(weather: WeatherType): string {
  switch (weather) {
    case 'clear': return '☀️';
    case 'cloudy': return '☁️';
    case 'rain': return '🌧️';
    default: return '☀️';
  }
}