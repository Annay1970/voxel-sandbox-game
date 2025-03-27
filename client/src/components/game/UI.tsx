import { useState, useEffect } from 'react';
import { useKeyboardControls } from '@react-three/drei';
import { useVoxelGame, Controls, WeatherType } from '../../lib/stores/useVoxelGame';
import { useAudio } from '../../lib/stores/useAudio';
import Inventory from './Inventory';
import Crafting from './Crafting';
import { cn } from '../../lib/utils';

export default function UI() {
  const [inventoryOpen, setInventoryOpen] = useState(false);
  const [craftingOpen, setCraftingOpen] = useState(false);
  
  const playerPosition = useVoxelGame(state => state.playerPosition);
  const selectedBlock = useVoxelGame(state => state.selectedBlock);
  const inventory = useVoxelGame(state => state.inventory);
  const timeOfDay = useVoxelGame(state => state.timeOfDay);
  const weather = useVoxelGame(state => state.weather);
  const playerHealth = useVoxelGame(state => state.playerHealth);
  const playerHunger = useVoxelGame(state => state.playerHunger);
  
  const { toggleMute, isMuted } = useAudio();
  
  // Listen for inventory key
  const inventoryPressed = useKeyboardControls<Controls>(state => state.inventory);
  
  useEffect(() => {
    if (inventoryPressed && !craftingOpen) {
      setInventoryOpen(prev => !prev);
    }
  }, [inventoryPressed, craftingOpen]);
  
  // Get selected block item from inventory
  const selectedItem = inventory.find(item => item.type === selectedBlock);
  
  // Format time of day as hours
  const gameHour = Math.floor(timeOfDay * 24);
  const formattedTime = `${gameHour.toString().padStart(2, '0')}:00`;
  
  // Get weather icon
  const weatherIcon = getWeatherIcon(weather);
  
  // Format player coordinates
  const formattedCoords = `${Math.floor(playerPosition.x)}, ${Math.floor(playerPosition.y)}, ${Math.floor(playerPosition.z)}`;
  
  // Calculate hotbar width based on inventory size
  const totalSlots = Math.min(9, inventory.length);
  
  return (
    <>
      {/* Main HUD (always visible) */}
      <div className="fixed inset-0 pointer-events-none flex flex-col">
        {/* Top HUD with time, weather, coordinates */}
        <div className="p-4 flex justify-between pointer-events-auto">
          <div className="bg-gray-800 bg-opacity-70 text-white px-3 py-1 rounded-md flex items-center">
            <span className="mr-2">{formattedTime}</span>
            <span className="text-lg">{weatherIcon}</span>
          </div>
          
          <div className="bg-gray-800 bg-opacity-70 text-white px-3 py-1 rounded-md">
            {formattedCoords}
          </div>
        </div>
        
        {/* Center crosshair */}
        <div className="flex-grow flex items-center justify-center">
          <div className="text-white text-2xl opacity-70">+</div>
        </div>
        
        {/* Bottom HUD with hotbar, health */}
        <div className="p-4">
          {/* Health and hunger meters */}
          <div className="flex justify-center mb-2 gap-4">
            <div className="bg-gray-800 bg-opacity-70 p-2 rounded-md flex items-center gap-1">
              <span className="text-red-500">❤</span>
              <div className="w-32 h-4 bg-gray-700 rounded-full overflow-hidden">
                <div 
                  className="h-full bg-red-600 transition-all duration-300" 
                  style={{ width: `${playerHealth}%` }}
                ></div>
              </div>
            </div>
            
            <div className="bg-gray-800 bg-opacity-70 p-2 rounded-md flex items-center gap-1">
              <span className="text-yellow-500">🍖</span>
              <div className="w-32 h-4 bg-gray-700 rounded-full overflow-hidden">
                <div 
                  className="h-full bg-yellow-600 transition-all duration-300" 
                  style={{ width: `${playerHunger}%` }}
                ></div>
              </div>
            </div>
          </div>
          
          {/* Hotbar */}
          <div className="flex justify-center">
            <div className="bg-gray-800 bg-opacity-70 p-2 rounded-md flex pointer-events-auto">
              {inventory.slice(0, 9).map((item, index) => (
                <div 
                  key={`hotbar-${index}`}
                  className={cn(
                    "w-16 h-16 bg-gray-700 rounded-md m-1 flex flex-col items-center justify-center cursor-pointer hover:bg-gray-600",
                    selectedBlock === item.type ? "ring-2 ring-white" : ""
                  )}
                  onClick={() => useVoxelGame.getState().setSelectedBlock(item.type)}
                >
                  <div className="w-10 h-10 flex items-center justify-center rounded" style={{
                    backgroundColor: getBlockColor(item.type)
                  }}>
                    {item.type.charAt(0).toUpperCase()}
                  </div>
                  <span className="text-white text-xs mt-1">{item.count}</span>
                </div>
              ))}
              
              {/* Fill empty slots up to 9 */}
              {Array.from({ length: Math.max(0, 9 - inventory.length) }).map((_, index) => (
                <div 
                  key={`empty-${index}`}
                  className="w-16 h-16 bg-gray-700 rounded-md m-1"
                ></div>
              ))}
            </div>
          </div>
        </div>
      </div>
      
      {/* Controls info */}
      <div className="fixed left-4 bottom-24 bg-gray-800 bg-opacity-70 text-white p-3 rounded-md text-sm max-w-xs">
        <p><strong>WASD</strong> - Move</p>
        <p><strong>Space</strong> - Jump</p>
        <p><strong>Shift</strong> - Sprint</p>
        <p><strong>E</strong> - Mine block</p>
        <p><strong>Q</strong> - Place block</p>
        <p><strong>I</strong> - Inventory</p>
      </div>
      
      {/* Sound toggle button */}
      <button
        className="fixed top-4 right-4 bg-gray-800 bg-opacity-70 text-white p-2 rounded-md pointer-events-auto"
        onClick={toggleMute}
      >
        {isMuted ? '🔇' : '🔊'}
      </button>
      
      {/* Inventory modal */}
      <Inventory 
        isOpen={inventoryOpen} 
        onClose={() => setInventoryOpen(false)} 
      />
      
      {/* Crafting modal */}
      <Crafting 
        isOpen={craftingOpen}
        onClose={() => setCraftingOpen(false)}
      />
      
      {/* Debug button to open crafting */}
      <button
        className="fixed right-4 bottom-24 bg-gray-800 bg-opacity-70 text-white px-3 py-2 rounded-md pointer-events-auto"
        onClick={() => setCraftingOpen(true)}
      >
        Open Crafting
      </button>
    </>
  );
}

// Helper function to get a color for block type
function getBlockColor(type: string): string {
  switch (type) {
    case 'grass': return '#7cac5d';
    case 'dirt': return '#9b7653';
    case 'stone': return '#aaaaaa';
    case 'sand': return '#e5b962';
    case 'wood': return '#8c6e4b';
    case 'log': return '#6e4b2c';
    case 'leaves': return '#2ecc71';
    case 'water': return '#3498db';
    default: return '#ffffff';
  }
}

// Helper function to get weather icon
function getWeatherIcon(weather: WeatherType): string {
  switch (weather) {
    case 'clear': return '☀️';
    case 'cloudy': return '☁️';
    case 'rain': return '🌧️';
    case 'snow': return '❄️';
    default: return '☀️';
  }
}
