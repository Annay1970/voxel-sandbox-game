import { useMemo } from 'react';
import * as THREE from 'three';
import { useVoxelGame, WeatherType } from '../../lib/stores/useVoxelGame';

interface SkyDomeProps {
  timeOfDay?: number;
  weather?: WeatherType;
}

// Ultra simplified Sky component for critical performance
export default function SkyDome({ timeOfDay: propTimeOfDay, weather: propWeather }: SkyDomeProps = {}) {
  // Use props if provided, otherwise get values from store
  const storeTimeOfDay = useVoxelGame(state => state.timeOfDay);
  const storeWeather = useVoxelGame(state => state.weather);
  const bloodMoonEvent = useVoxelGame(state => state.bloodMoonEvent);
  
  // Use props if provided, otherwise fallback to store values
  const timeOfDay = propTimeOfDay !== undefined ? propTimeOfDay : storeTimeOfDay;
  const weather = propWeather !== undefined ? propWeather : storeWeather;
  
  // Check if Blood Moon is active
  const isBloodMoonActive = bloodMoonEvent.active;
  
  // Improved sky colors with transitions
  const skyColor = useMemo(() => {
    // Time-based gradient calculation
    if (isBloodMoonActive) {
      // Blood moon colors
      if (timeOfDay >= 0.25 && timeOfDay <= 0.75) {
        // Blood moon daytime - reddish
        return '#855555';
      } else if (timeOfDay > 0.75 && timeOfDay < 0.85) {
        // Blood moon sunset - deep red
        return '#662222';
      } else {
        // Blood moon night - dark red
        return '#330000';
      }
    } else {
      // Normal sky colors
      if (timeOfDay > 0.25 && timeOfDay < 0.75) {
        // Full daytime - blue sky
        return '#87CEEB';
      } else if ((timeOfDay >= 0.2 && timeOfDay <= 0.25) || (timeOfDay >= 0.75 && timeOfDay <= 0.8)) {
        // Dawn/dusk - light orange blue
        return '#FF9966';
      } else {
        // Night - dark blue
        return '#0A0A2A';
      }
    }
  }, [timeOfDay, isBloodMoonActive]);
  
  // Improved light settings with smoother transitions
  const lightIntensity = useMemo(() => {
    // Smooth day-night cycle
    if (timeOfDay > 0.25 && timeOfDay < 0.75) {
      // Full daytime
      return 1.0;
    } else if (timeOfDay >= 0.75 && timeOfDay <= 0.85) {
      // Sunset - gradual decrease
      const t = (timeOfDay - 0.75) / 0.1; // 0 to 1
      return 1.0 - (t * 0.8);
    } else if (timeOfDay >= 0.15 && timeOfDay <= 0.25) {
      // Sunrise - gradual increase
      const t = (timeOfDay - 0.15) / 0.1; // 0 to 1
      return 0.2 + (t * 0.8);
    } else {
      // Night
      return 0.2;
    }
  }, [timeOfDay]);
  
  // Improved light color with transitions
  const lightColor = useMemo(() => {
    if (isBloodMoonActive) {
      // Blood moon colors
      if (timeOfDay > 0.25 && timeOfDay < 0.75) {
        // Blood moon day
        return '#FFCCCC';
      } else if ((timeOfDay >= 0.75 && timeOfDay <= 0.85) || (timeOfDay >= 0.15 && timeOfDay <= 0.25)) {
        // Blood moon dawn/dusk
        return '#FF5555';
      } else {
        // Blood moon night
        return '#FF2222';
      }
    } else {
      // Normal colors
      if (timeOfDay > 0.25 && timeOfDay < 0.75) {
        // Day - white light
        return '#FFFFFF';
      } else if (timeOfDay >= 0.75 && timeOfDay <= 0.85) {
        // Sunset - orange light
        return '#FFA500';
      } else if (timeOfDay >= 0.15 && timeOfDay <= 0.25) {
        // Sunrise - yellow-orange light
        return '#FFCC88';
      } else {
        // Night - blue light
        return '#2B5797';
      }
    }
  }, [timeOfDay, isBloodMoonActive]);
  
  // Pure-minimum render for basic lighting
  return (
    <group>
      {/* Just set background color */}
      <color attach="background" args={[skyColor]} />
      
      {/* Ultra simplified fog - very short distance */}
      <fog attach="fog" args={[skyColor, 20, 70]} />
      
      {/* Single directional light */}
      <directionalLight 
        position={[0, 1, 0]} 
        intensity={lightIntensity} 
        color={lightColor}
        castShadow={false} // Disable shadows for performance
      />
      
      {/* Single ambient light */}
      <ambientLight intensity={lightIntensity * 0.5} color={lightColor} />
    </group>
  );
}
