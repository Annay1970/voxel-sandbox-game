import { useEffect, useState } from 'react';
import { useVoxelGame, WeatherType } from '../../lib/stores/useVoxelGame';

interface WeatherInfoProps {
  position?: 'top-left' | 'top-right' | 'bottom-left' | 'bottom-right';
  detailed?: boolean;
}

// Weather display names for UI
const WEATHER_DISPLAY_NAMES: Record<WeatherType, string> = {
  'clear': 'Clear',
  'cloudy': 'Cloudy',
  'rain': 'Rainy',
  'thunderstorm': 'Thunderstorm',
  'fog': 'Foggy',
  'snow': 'Snowy'
};

// Weather icons (using emoji for simplicity)
const WEATHER_ICONS: Record<WeatherType, string> = {
  'clear': '☀️',
  'cloudy': '☁️',
  'rain': '🌧️',
  'thunderstorm': '⛈️',
  'fog': '🌫️',
  'snow': '❄️'
};

// Movement effect descriptions
const MOVEMENT_DESCRIPTIONS: Record<WeatherType, string> = {
  'clear': 'Normal movement',
  'cloudy': 'Slightly slowed movement',
  'rain': 'Slowed movement, reduced jump height',
  'thunderstorm': 'Severely slowed movement, reduced jump height, danger of lightning',
  'fog': 'Moderately slowed movement, reduced visibility',
  'snow': 'Significantly slowed movement, reduced jump height'
};

/**
 * UI component that displays the current weather information
 * and its effects on player movement
 */
export default function WeatherInfo({
  position = 'top-right',
  detailed = true
}: WeatherInfoProps) {
  // Get weather data from game state
  const weatherSystem = useVoxelGame(state => state.weatherSystem);
  const [showDetailed, setShowDetailed] = useState(false);
  
  // Get CSS classes for positioning
  const positionClasses = {
    'top-left': 'top-2 left-2',
    'top-right': 'top-2 right-2',
    'bottom-left': 'bottom-2 left-2',
    'bottom-right': 'bottom-2 right-2'
  }[position];
  
  // Toggle detailed view
  useEffect(() => {
    setShowDetailed(detailed);
  }, [detailed]);
  
  return (
    <div 
      className={`fixed ${positionClasses} bg-black/60 p-3 rounded-md z-10 text-white font-medium shadow-lg border border-white/20 select-none`}
      onClick={() => setShowDetailed(!showDetailed)}
    >
      <div className="flex items-center gap-2">
        <span className="text-xl">{WEATHER_ICONS[weatherSystem.currentWeather]}</span>
        <span className="font-bold">{WEATHER_DISPLAY_NAMES[weatherSystem.currentWeather]}</span>
        {weatherSystem.transitionTarget && (
          <div className="text-sm text-gray-300 ml-2">
            Changing to {WEATHER_DISPLAY_NAMES[weatherSystem.transitionTarget]}...
          </div>
        )}
      </div>
      
      {/* Expanded view with details */}
      {showDetailed && (
        <div className="mt-2 text-sm border-t border-white/20 pt-2">
          <div className="flex items-center gap-2 mb-1">
            <span className="w-24 text-gray-300">Intensity:</span>
            <div className="w-full bg-gray-700 h-2 rounded-full overflow-hidden">
              <div 
                className="h-full bg-blue-400 rounded-full" 
                style={{width: `${weatherSystem.intensity * 100}%`}}
              />
            </div>
            <span className="text-xs">{Math.round(weatherSystem.intensity * 100)}%</span>
          </div>
          
          <div className="flex items-center gap-2 mb-1">
            <span className="w-24 text-gray-300">Visibility:</span>
            <div className="w-full bg-gray-700 h-2 rounded-full overflow-hidden">
              <div 
                className="h-full bg-green-400 rounded-full" 
                style={{width: `${weatherSystem.effects.visibility * 100}%`}}
              />
            </div>
            <span className="text-xs">{Math.round(weatherSystem.effects.visibility * 100)}%</span>
          </div>
          
          <div className="flex items-center gap-2 mb-1">
            <span className="w-24 text-gray-300">Movement:</span>
            <div className="w-full bg-gray-700 h-2 rounded-full overflow-hidden">
              <div 
                className="h-full bg-yellow-400 rounded-full" 
                style={{width: `${weatherSystem.effects.movementModifier * 100}%`}}
              />
            </div>
            <span className="text-xs">{Math.round(weatherSystem.effects.movementModifier * 100)}%</span>
          </div>
          
          {weatherSystem.effects.dangerLevel > 0 && (
            <div className="flex items-center gap-2 mb-1">
              <span className="w-24 text-gray-300">Danger:</span>
              <div className="w-full bg-gray-700 h-2 rounded-full overflow-hidden">
                <div 
                  className="h-full bg-red-500 rounded-full" 
                  style={{width: `${weatherSystem.effects.dangerLevel * 100}%`}}
                />
              </div>
              <span className="text-xs">{Math.round(weatherSystem.effects.dangerLevel * 100)}%</span>
            </div>
          )}
          
          <p className="mt-2 text-xs text-gray-200">
            {MOVEMENT_DESCRIPTIONS[weatherSystem.currentWeather]}
          </p>
        </div>
      )}
    </div>
  );
}