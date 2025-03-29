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
  
  // Calculate the light color based on time of day
  const sunLightColor = useMemo(() => {
    if (timeOfDay < 0.25) {
      // Night to dawn - blueish
      return new THREE.Color('#2B5797');
    } else if (timeOfDay < 0.3) {
      // Dawn - orange
      return new THREE.Color('#FF7F50');
    } else if (timeOfDay < 0.7) {
      // Day - white
      return new THREE.Color('#FFFFFF');
    } else if (timeOfDay < 0.75) {
      // Dusk - orange
      return new THREE.Color('#FF7F50');
    } else {
      // Night - blueish
      return new THREE.Color('#2B5797');
    }
  }, [timeOfDay]);
  
  // Calculate ambient light intensity based on time and weather
  const ambientIntensity = useMemo(() => {
    // Reduced ambient light at night
    let baseIntensity = timeOfDay < 0.25 || timeOfDay > 0.75 ? 0.2 : 0.5;
    
    // Reduce intensity for bad weather
    if (weather === 'rain') {
      baseIntensity *= 0.7;
    } else if (weather === 'storm') {
      baseIntensity *= 0.5;
    } else if (weather === 'cloudy') {
      baseIntensity *= 0.8;
    }
    
    return baseIntensity;
  }, [timeOfDay, weather]);

  // Determine fog color based on time of day and weather
  const fogColor = useMemo(() => {
    let baseFogColor = colors.bottomColor.clone();
    
    // Apply weather effects to fog
    if (weather === 'rain') {
      baseFogColor.lerp(new THREE.Color('#708090'), 0.7);
    } else if (weather === 'storm') {
      baseFogColor.lerp(new THREE.Color('#4F4F4F'), 0.8);
    } else if (weather === 'cloudy') {
      baseFogColor.lerp(new THREE.Color('#A9A9A9'), 0.5);
    }
    
    return baseFogColor;
  }, [colors, weather]);
  
  // Calculate fog density based on weather
  const fogDensity = useMemo(() => {
    if (weather === 'storm') {
      return 0.03;
    } else if (weather === 'rain') {
      return 0.02;
    } else if (weather === 'cloudy') {
      return 0.01;
    } else {
      return 0.005;
    }
  }, [weather]);

  return (
    <group>
      {/* Apply sky color to renderer background */}
      <color attach="background" args={[skyColor]} />
      
      {/* Add fog */}
      <fog attach="fog" args={[fogColor.getHex(), 5, 100]} />
      
      {/* Sun (visible during day) */}
      <mesh visible={timeOfDay > 0.25 && timeOfDay < 0.75}>
        <sphereGeometry args={[15, 16, 16]} />
        <meshBasicMaterial color="#FFFF77" />
        <primitive object={new THREE.Vector3(sunPosition[0], sunPosition[1], sunPosition[2])} attach="position" />
      </mesh>
      
      {/* Sun glow */}
      <sprite visible={timeOfDay > 0.25 && timeOfDay < 0.75} scale={50}>
        <spriteMaterial attach="material" map={null} transparent opacity={0.4} color="#FFFFA0" />
        <primitive object={new THREE.Vector3(sunPosition[0], sunPosition[1], sunPosition[2])} attach="position" />
      </sprite>
      
      {/* Moon (visible during night) */}
      <mesh visible={timeOfDay < 0.25 || timeOfDay > 0.75}>
        <sphereGeometry args={[8, 16, 16]} />
        <meshBasicMaterial color="#F0F0F0" />
        <primitive object={new THREE.Vector3(moonPosition[0], moonPosition[1], moonPosition[2])} attach="position" />
      </mesh>
      
      {/* Moon glow */}
      <sprite visible={timeOfDay < 0.25 || timeOfDay > 0.75} scale={30}>
        <spriteMaterial attach="material" map={null} transparent opacity={0.3} color="#C0C0FF" />
        <primitive object={new THREE.Vector3(moonPosition[0], moonPosition[1], moonPosition[2])} attach="position" />
      </sprite>
      
      {/* Directional light from sun/moon */}
      <directionalLight 
        intensity={sunLightIntensity} 
        color={sunLightColor.getHex()} 
        castShadow
        shadow-mapSize-width={2048}
        shadow-mapSize-height={2048}
        shadow-camera-far={500}
        shadow-camera-left={-100}
        shadow-camera-right={100}
        shadow-camera-top={100}
        shadow-camera-bottom={-100}
      >
        <primitive 
          object={new THREE.Vector3(
            (timeOfDay > 0.25 && timeOfDay < 0.75 ? sunPosition[0] : moonPosition[0]),
            (timeOfDay > 0.25 && timeOfDay < 0.75 ? sunPosition[1] : moonPosition[1]),
            (timeOfDay > 0.25 && timeOfDay < 0.75 ? sunPosition[2] : moonPosition[2])
          )} 
          attach="position" 
        />
      </directionalLight>
      
      {/* Ambient light */}
      <ambientLight intensity={ambientIntensity} />
      
      {/* Hemisphere light (sky/ground contrast) */}
      <hemisphereLight
        args={[colors.topColor.getHex(), colors.bottomColor.getHex(), 0.6]}
      />
    </group>
  );
}
