import { useMemo } from 'react';
import * as THREE from 'three';
import { useVoxelGame, WeatherType } from '../../lib/stores/useVoxelGame';

interface SkyDomeProps {
  timeOfDay?: number;
  weather?: WeatherType;
}

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
  const bloodMoonIntensity = bloodMoonEvent.intensity;
  
  // Calculate sky colors based on time of day, weather, and Blood Moon
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
    
    // Apply Blood Moon effect if active
    if (isBloodMoonActive) {
      // Blood Moon effect is stronger at night
      const bloodMoonEffect = bloodMoonIntensity * (timeOfDay > 0.75 || timeOfDay < 0.25 ? 1 : 0.3);
      
      // Blend towards red tones based on intensity
      topColor.lerp(new THREE.Color('#400000'), bloodMoonEffect);  // Dark red for sky
      bottomColor.lerp(new THREE.Color('#800000'), bloodMoonEffect); // Brighter red for horizon
    }
    
    return { topColor, bottomColor };
  }, [timeOfDay, weather, isBloodMoonActive, bloodMoonIntensity]);
  
  // Log sky status for debugging
  if (isBloodMoonActive) {
    console.log(`Blood Moon active: intensity=${bloodMoonIntensity.toFixed(2)}, time=${timeOfDay.toFixed(2)}`);
  }
  
  // Create a gradient background effect
  const skyColor = colors.topColor.getStyle();
  const horizonColor = colors.bottomColor.getStyle();
  
  // Calculate positions for the sun and moon
  const celestialRadius = 300;
  const sunPosition = useMemo(() => {
    // Sun makes a complete rotation based on time of day
    const angle = Math.PI * 2 * (timeOfDay - 0.5); // Offset by 0.5 so noon is at the top
    return [
      Math.sin(angle) * celestialRadius,
      Math.cos(angle) * celestialRadius,
      0
    ] as [number, number, number];
  }, [timeOfDay, celestialRadius]);
  
  const moonPosition = useMemo(() => {
    // Moon is opposite to the sun
    const angle = Math.PI * 2 * (timeOfDay - 0.5) + Math.PI;
    return [
      Math.sin(angle) * celestialRadius,
      Math.cos(angle) * celestialRadius,
      0
    ] as [number, number, number];
  }, [timeOfDay, celestialRadius]);
  
  // Calculate the intensity of directional light based on time of day
  const sunLightIntensity = useMemo(() => {
    // Maximum at noon, minimum at midnight
    if (timeOfDay < 0.25 || timeOfDay > 0.75) {
      // Night time, minimal light
      return 0.1;
    } else if (timeOfDay < 0.5) {
      // Morning, increasing light
      return 0.1 + (timeOfDay - 0.25) * 4 * 0.9;
    } else {
      // Afternoon, decreasing light
      return 0.1 + (0.75 - timeOfDay) * 4 * 0.9;
    }
  }, [timeOfDay]);
  
  // Calculate the light color based on time of day and Blood Moon
  const sunLightColor = useMemo(() => {
    let baseColor;
    
    if (timeOfDay < 0.25) {
      // Night to dawn - blueish
      baseColor = new THREE.Color('#2B5797');
    } else if (timeOfDay < 0.3) {
      // Dawn - orange
      baseColor = new THREE.Color('#FF7F50');
    } else if (timeOfDay < 0.7) {
      // Day - white
      baseColor = new THREE.Color('#FFFFFF');
    } else if (timeOfDay < 0.75) {
      // Dusk - orange
      baseColor = new THREE.Color('#FF7F50');
    } else {
      // Night - blueish
      baseColor = new THREE.Color('#2B5797');
    }
    
    // Adjust color for Blood Moon
    if (isBloodMoonActive) {
      // Blood Moon effect is stronger at night
      const bloodMoonEffect = bloodMoonIntensity * (timeOfDay > 0.75 || timeOfDay < 0.25 ? 1 : 0.3);
      baseColor.lerp(new THREE.Color('#FF3030'), bloodMoonEffect);
    }
    
    return baseColor;
  }, [timeOfDay, isBloodMoonActive, bloodMoonIntensity]);
  
  // Calculate ambient light intensity based on time, weather, and Blood Moon
  const ambientIntensity = useMemo(() => {
    // Reduced ambient light at night
    let baseIntensity = timeOfDay < 0.25 || timeOfDay > 0.75 ? 0.2 : 0.5;
    
    // Reduce intensity for bad weather
    if (weather === 'rain') {
      baseIntensity *= 0.7;
    } else if (weather === 'thunderstorm') {
      baseIntensity *= 0.5;
    } else if (weather === 'cloudy') {
      baseIntensity *= 0.8;
    }
    
    // During Blood Moon, increase ambient light at night for the red glow effect
    if (isBloodMoonActive && (timeOfDay > 0.75 || timeOfDay < 0.25)) {
      baseIntensity += 0.1 * bloodMoonIntensity;
    }
    
    return baseIntensity;
  }, [timeOfDay, weather, isBloodMoonActive, bloodMoonIntensity]);

  // Determine fog color based on time of day, weather, and Blood Moon
  const fogColor = useMemo(() => {
    let baseFogColor = colors.bottomColor.clone();
    
    // Apply weather effects to fog
    if (weather === 'rain') {
      baseFogColor.lerp(new THREE.Color('#708090'), 0.7);
    } else if (weather === 'thunderstorm') {
      baseFogColor.lerp(new THREE.Color('#4F4F4F'), 0.8);
    } else if (weather === 'cloudy') {
      baseFogColor.lerp(new THREE.Color('#A9A9A9'), 0.5);
    }
    
    // Apply Blood Moon effect to fog
    if (isBloodMoonActive) {
      const bloodMoonEffect = bloodMoonIntensity * (timeOfDay > 0.75 || timeOfDay < 0.25 ? 0.7 : 0.3);
      baseFogColor.lerp(new THREE.Color('#700000'), bloodMoonEffect);
    }
    
    return baseFogColor;
  }, [colors, weather, isBloodMoonActive, bloodMoonIntensity, timeOfDay]);
  
  // Calculate fog density based on weather and Blood Moon
  const fogDensity = useMemo(() => {
    let density = 0.005; // Default clear weather
    
    if (weather === 'thunderstorm') {
      density = 0.03;
    } else if (weather === 'rain') {
      density = 0.02;
    } else if (weather === 'cloudy') {
      density = 0.01;
    } else if (weather === 'fog') {
      density = 0.04;
    } else if (weather === 'snow') {
      density = 0.015;
    }
    
    // During Blood Moon, increase fog density for ominous effect
    if (isBloodMoonActive && (timeOfDay > 0.75 || timeOfDay < 0.25)) {
      density += 0.01 * bloodMoonIntensity;
    }
    
    return density;
  }, [weather, isBloodMoonActive, bloodMoonIntensity, timeOfDay]);

  // Determine moon color based on Blood Moon status
  const moonColor = useMemo(() => {
    if (isBloodMoonActive) {
      // Lerp between normal white and blood red based on intensity
      return new THREE.Color().lerpColors(
        new THREE.Color('#F0F0F0'), // Normal moon color
        new THREE.Color('#FF0000'), // Blood red
        bloodMoonIntensity
      ).getStyle();
    }
    return '#F0F0F0'; // Default white moon
  }, [isBloodMoonActive, bloodMoonIntensity]);

  // Moon glow color and size effect for Blood Moon
  const moonGlowColor = useMemo(() => {
    if (isBloodMoonActive) {
      return new THREE.Color().lerpColors(
        new THREE.Color('#C0C0FF'), // Normal moon glow
        new THREE.Color('#FF0000'), // Blood red glow
        bloodMoonIntensity
      ).getStyle();
    }
    return '#C0C0FF'; // Default blue-ish glow
  }, [isBloodMoonActive, bloodMoonIntensity]);

  // Make the moon glow larger during Blood Moon
  const moonGlowScale = isBloodMoonActive ? 30 + (bloodMoonIntensity * 15) : 30;
  const moonGlowOpacity = isBloodMoonActive ? 0.3 + (bloodMoonIntensity * 0.3) : 0.3;

  return (
    <group>
      {/* Apply sky color to renderer background */}
      <color attach="background" args={[skyColor]} />
      
      {/* Add fog */}
      <fog attach="fog" args={[fogColor.getHex(), 5, 100]} />
      
      {/* Sun (visible during day) */}
      <mesh 
        visible={timeOfDay > 0.25 && timeOfDay < 0.75}
        position={[sunPosition[0], sunPosition[1], sunPosition[2]]}
      >
        <sphereGeometry args={[15, 16, 16]} />
        <meshBasicMaterial color="#FFFF77" />
      </mesh>
      
      {/* Sun glow */}
      <sprite 
        visible={timeOfDay > 0.25 && timeOfDay < 0.75} 
        scale={50}
        position={[sunPosition[0], sunPosition[1], sunPosition[2]]}
      >
        <spriteMaterial attach="material" map={null} transparent opacity={0.4} color="#FFFFA0" />
      </sprite>
      
      {/* Moon (visible during night) */}
      <mesh 
        visible={timeOfDay < 0.25 || timeOfDay > 0.75}
        position={[moonPosition[0], moonPosition[1], moonPosition[2]]}
      >
        <sphereGeometry args={[8, 16, 16]} />
        <meshBasicMaterial color={moonColor} />
      </mesh>
      
      {/* Moon glow */}
      <sprite 
        visible={timeOfDay < 0.25 || timeOfDay > 0.75} 
        scale={moonGlowScale}
        position={[moonPosition[0], moonPosition[1], moonPosition[2]]}
      >
        <spriteMaterial attach="material" map={null} transparent opacity={moonGlowOpacity} color={moonGlowColor} />
      </sprite>
      
      {/* Blood Moon particles (only visible during Blood Moon night) */}
      {isBloodMoonActive && (timeOfDay < 0.25 || timeOfDay > 0.75) && (
        <>
          {/* Create a subtle red particle effect around the moon */}
          <points>
            <bufferGeometry>
              <bufferAttribute
                attach="attributes-position"
                count={200}
                array={Float32Array.from(Array(600).fill(0).map((_, i) => {
                  // Generate positions in a sphere around the moon
                  if (i % 3 === 0) {
                    return moonPosition[0] + (Math.random() - 0.5) * 50;
                  } else if (i % 3 === 1) {
                    return moonPosition[1] + (Math.random() - 0.5) * 50;
                  } else {
                    return moonPosition[2] + (Math.random() - 0.5) * 10;
                  }
                }))}
                itemSize={3}
              />
            </bufferGeometry>
            <pointsMaterial
              attach="material"
              color="#FF0000"
              size={2}
              transparent
              opacity={0.4 * bloodMoonIntensity}
              sizeAttenuation
            />
          </points>
        </>
      )}
      
      {/* Directional light from sun/moon - Position set directly */}
      <directionalLight 
        position={[
          (timeOfDay > 0.25 && timeOfDay < 0.75 ? sunPosition[0] : moonPosition[0]),
          (timeOfDay > 0.25 && timeOfDay < 0.75 ? sunPosition[1] : moonPosition[1]),
          (timeOfDay > 0.25 && timeOfDay < 0.75 ? sunPosition[2] : moonPosition[2])
        ]}
        intensity={sunLightIntensity} 
        color={sunLightColor.getHex()} 
        castShadow
        shadow-mapSize-width={2048}
        shadow-mapSize-height={2048}
        shadow-camera-far={500}
        shadow-camera-left={-100}
        shadow-camera-right={-100}
        shadow-camera-top={100}
        shadow-camera-bottom={-100}
      />
      
      {/* Ambient light */}
      <ambientLight intensity={ambientIntensity} />
      
      {/* Hemisphere light (sky/ground contrast) */}
      <hemisphereLight
        args={[colors.topColor.getHex(), colors.bottomColor.getHex(), 0.6]}
      />
      
      {/* Additional red light during Blood Moon night */}
      {isBloodMoonActive && (timeOfDay < 0.25 || timeOfDay > 0.75) && (
        <pointLight
          position={[moonPosition[0], moonPosition[1], moonPosition[2]]}
          color="#FF0000"
          intensity={0.2 * bloodMoonIntensity}
          distance={500}
        />
      )}
    </group>
  );
}
