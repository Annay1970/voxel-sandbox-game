import { useMemo } from 'react';
import * as THREE from 'three';
import { useVoxelGame } from '../../lib/stores/useVoxelGame';

export default function SkyDome() {
  const timeOfDay = useVoxelGame(state => state.timeOfDay);
  const weather = useVoxelGame(state => state.weather);
  
  // Calculate sky colors based on time of day and weather
  const colors = useMemo(() => {
    // Time of day is a value between 0 and 1
    // 0 = midnight, 0.25 = sunrise, 0.5 = noon, 0.75 = sunset
    
    let topColor, bottomColor;
    
    if (timeOfDay < 0.25) {
      // Night to sunrise transition
      const t = timeOfDay / 0.25;
      topColor = new THREE.Color().lerpColors(
        new THREE.Color('#0A0A2A'), // Night (made lighter for better visibility)
        new THREE.Color('#1E90FF'), // Dawn
        t
      );
      bottomColor = new THREE.Color().lerpColors(
        new THREE.Color('#0A0A2A'), // Night
        new THREE.Color('#FF7F50'), // Dawn horizon
        t
      );
    } else if (timeOfDay < 0.5) {
      // Sunrise to noon transition
      const t = (timeOfDay - 0.25) / 0.25;
      topColor = new THREE.Color().lerpColors(
        new THREE.Color('#1E90FF'), // Dawn
        new THREE.Color('#87CEEB'), // Day
        t
      );
      bottomColor = new THREE.Color().lerpColors(
        new THREE.Color('#FF7F50'), // Dawn horizon
        new THREE.Color('#87CEEB'), // Day horizon
        t
      );
    } else if (timeOfDay < 0.75) {
      // Noon to sunset transition
      const t = (timeOfDay - 0.5) / 0.25;
      topColor = new THREE.Color().lerpColors(
        new THREE.Color('#87CEEB'), // Day
        new THREE.Color('#1E90FF'), // Dusk
        t
      );
      bottomColor = new THREE.Color().lerpColors(
        new THREE.Color('#87CEEB'), // Day horizon
        new THREE.Color('#FF7F50'), // Dusk horizon
        t
      );
    } else {
      // Sunset to night transition
      const t = (timeOfDay - 0.75) / 0.25;
      topColor = new THREE.Color().lerpColors(
        new THREE.Color('#1E90FF'), // Dusk
        new THREE.Color('#0A0A2A'), // Night (made lighter for better visibility)
        t
      );
      bottomColor = new THREE.Color().lerpColors(
        new THREE.Color('#FF7F50'), // Dusk horizon
        new THREE.Color('#0A0A2A'), // Night horizon
        t
      );
    }
    
    // Adjust colors based on weather
    if (weather === 'rain') {
      topColor.lerp(new THREE.Color('#708090'), 0.5); // Darken for rain
      bottomColor.lerp(new THREE.Color('#708090'), 0.5);
    } else if (weather === 'cloudy') {
      topColor.lerp(new THREE.Color('#C0C0C0'), 0.3); // Lighten for clouds
      bottomColor.lerp(new THREE.Color('#C0C0C0'), 0.3);
    }
    
    return { topColor, bottomColor };
  }, [timeOfDay, weather]);
  
  // Log sky status for debugging
  console.log(`Sky rendering: time=${timeOfDay}, weather=${weather}`);
  
  // Create a gradient background effect
  const skyColor = colors.topColor.getStyle();
  const horizonColor = colors.bottomColor.getStyle();
  
  return (
    <group>
      {/* Apply sky color to renderer background */}
      <color attach="background" args={[skyColor]} />
    </group>
  );
}
