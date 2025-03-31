import { useRef, useMemo } from 'react';
import * as THREE from 'three';
import { useFrame } from '@react-three/fiber';
import { Sky } from '@react-three/drei';
import { WeatherType } from '../../lib/stores/useVoxelGame';

interface SkyDomeProps {
  timeOfDay: number; // 0-24 hour cycle
  weather: WeatherType;
}

/**
 * Dynamic sky dome with day/night cycle and weather effects
 */
export default function SkyDome({ timeOfDay, weather }: SkyDomeProps) {
  // Reference to the sky component
  const skyRef = useRef<any>(null);
  const directionalLightRef = useRef<THREE.DirectionalLight>(null);
  
  // Calculate sun position based on time of day
  const sunPosition = useMemo(() => {
    // Convert 24-hour time to radians (0-2PI)
    const timeInRadians = (timeOfDay / 24) * Math.PI * 2;
    
    // Calculate sun position on a unit circle
    // Offset by -PI/2 so that noon is at the top
    const x = Math.cos(timeInRadians - Math.PI / 2) * 100;
    const y = Math.sin(timeInRadians - Math.PI / 2) * 100;
    
    // Place sun on a circle in the xz-plane
    return [x, y, 0];
  }, [timeOfDay]);

  // Determine sky parameters based on time and weather
  const skyParams = useMemo(() => {
    // Is it night time?
    const isNight = timeOfDay < 6 || timeOfDay > 18;
    
    // Is it dawn/dusk?
    const isDawnDusk = (timeOfDay > 5 && timeOfDay < 7) || (timeOfDay > 17 && timeOfDay < 19);
    
    // Base parameters for clear day
    let params = {
      turbidity: 10,
      rayleigh: 0.5,
      mieCoefficient: 0.005,
      mieDirectionalG: 0.7,
    };
    
    // Adjust for time of day
    if (isNight) {
      // Night time - darker sky
      params.turbidity = 0.1;
      params.rayleigh = 0.2;
      params.mieCoefficient = 0.001;
    } else if (isDawnDusk) {
      // Dawn/dusk - orange-red hues
      params.turbidity = 12;
      params.rayleigh = 1.5;
      params.mieCoefficient = 0.01;
      params.mieDirectionalG = 0.8;
    }
    
    // Adjust for weather
    if (weather === 'rain' || weather === 'thunderstorm') {
      // Rainy or stormy - grayish sky
      params.turbidity = Math.min(params.turbidity + 5, 20);
      params.rayleigh = Math.min(params.rayleigh + 0.5, 4);
      params.mieCoefficient = Math.min(params.mieCoefficient + 0.01, 0.1);
    } else if (weather === 'snow') {
      // Snowy - bright but diffuse light
      params.turbidity = Math.max(params.turbidity - 2, 0.1);
      params.rayleigh = Math.min(params.rayleigh + 1, 4);
      params.mieCoefficient = Math.min(params.mieCoefficient + 0.02, 0.1);
    } else if (weather === 'fog') {
      // Foggy - diffuse light
      params.turbidity = Math.min(params.turbidity + 2, 20);
      params.rayleigh = Math.min(params.rayleigh + 0.8, 4);
      params.mieCoefficient = Math.min(params.mieCoefficient + 0.03, 0.1);
    } else if (weather === 'cloudy') {
      // Cloudy skies
      params.turbidity = Math.min(params.turbidity + 3, 15);
      params.rayleigh = Math.min(params.rayleigh + 0.3, 3);
      params.mieCoefficient = Math.min(params.mieCoefficient + 0.005, 0.08);
    }
    
    return params;
  }, [timeOfDay, weather]);

  // Update sun position and light intensity on every frame
  useFrame(() => {
    if (directionalLightRef.current) {
      // Copy the sun position for the light
      directionalLightRef.current.position.set(
        sunPosition[0],
        sunPosition[1],
        sunPosition[2]
      );
      
      // Adjust light intensity based on time of day and weather
      let intensity = 0;
      
      // Day/night cycle intensity
      if (timeOfDay > 6 && timeOfDay < 18) {
        // Daytime - sun intensity follows a sine curve peaking at noon
        const dayProgress = (timeOfDay - 6) / 12; // 0 to 1 from 6AM to 6PM
        intensity = Math.sin(dayProgress * Math.PI) * 0.8 + 0.2;
      } else {
        // Nighttime - very low intensity
        intensity = 0.05;
      }
      
      // Weather modifier
      if (weather === 'rain') {
        intensity *= 0.6; // Reduced intensity during rain
      } else if (weather === 'thunderstorm') {
        intensity *= 0.3; // Heavily reduced during storms
      } else if (weather === 'snow') {
        intensity *= 0.8; // Slightly reduced during snow
      } else if (weather === 'fog') {
        intensity *= 0.7; // Reduced for foggy conditions
      } else if (weather === 'cloudy') {
        intensity *= 0.9; // Slightly reduced for cloudy weather
      }
      
      directionalLightRef.current.intensity = intensity;
    }
  });
  
  // Determine if we should show stars (night time)
  const showStars = timeOfDay < 6 || timeOfDay > 18;

  return (
    <>
      {/* Sky component from drei */}
      <Sky
        ref={skyRef}
        distance={450000}
        sunPosition={[sunPosition[0], sunPosition[1], sunPosition[2]]}
        turbidity={skyParams.turbidity}
        rayleigh={skyParams.rayleigh}
        mieCoefficient={skyParams.mieCoefficient}
        mieDirectionalG={skyParams.mieDirectionalG}
      />
      {/* Note: Removed exposure prop as it might not be supported in the current version */}
      
      {/* Directional light following sun position */}
      <directionalLight 
        ref={directionalLightRef}
        position={[sunPosition[0], sunPosition[1], sunPosition[2]]}
        intensity={1}
        castShadow
        shadow-mapSize-width={1024}
        shadow-mapSize-height={1024}
        shadow-camera-far={60}
        shadow-camera-left={-25}
        shadow-camera-right={25}
        shadow-camera-top={25}
        shadow-camera-bottom={-25}
      />
      
      {/* Stars at night */}
      {showStars && (
        <group>
          {/* Generate a field of stars */}
          {Array.from({ length: 1000 }).map((_, i) => {
            // Generate random position on a sphere
            const theta = Math.random() * Math.PI * 2;
            const phi = Math.acos(2 * Math.random() - 1);
            const radius = 300;
            
            const x = radius * Math.sin(phi) * Math.cos(theta);
            const y = radius * Math.sin(phi) * Math.sin(theta);
            const z = radius * Math.cos(phi);
            
            // Randomize star appearance
            const size = Math.random() * 0.5 + 0.1;
            
            return (
              <mesh key={`star-${i}`} position={[x, y, z]}>
                <sphereGeometry args={[size, 4, 4]} />
                <meshBasicMaterial color="white" />
              </mesh>
            );
          })}
        </group>
      )}
    </>
  );
}