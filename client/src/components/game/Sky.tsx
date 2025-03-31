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
  
  // Ultra-simplified sky colors - only day/night with no transitions
  const skyColor = useMemo(() => {
    // Just two states: day or night
    const isDaytime = timeOfDay >= 0.25 && timeOfDay <= 0.75;
    
    if (isDaytime) {
      // Day - blue sky
      return isBloodMoonActive ? '#855555' : '#87CEEB';
    } else {
      // Night - dark blue
      return isBloodMoonActive ? '#330000' : '#0A0A2A';
    }
  }, [timeOfDay, isBloodMoonActive]);
  
  // Ultra-simplified light settings - directly calculate based on time
  const lightIntensity = useMemo(() => {
    // Just two states: day or night
    const isDaytime = timeOfDay >= 0.25 && timeOfDay <= 0.75;
    return isDaytime ? 1.0 : 0.2;
  }, [timeOfDay]);
  
  // Ultra-simplified light color
  const lightColor = useMemo(() => {
    // Just two states: day or night
    const isDaytime = timeOfDay >= 0.25 && timeOfDay <= 0.75;
    
    if (isDaytime) {
      return isBloodMoonActive ? '#FFCCCC' : '#FFFFFF';
    } else {
      return isBloodMoonActive ? '#FF2222' : '#2B5797';
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
