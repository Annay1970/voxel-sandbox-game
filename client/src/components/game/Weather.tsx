import { useRef, useMemo, useState } from 'react';
import * as THREE from 'three';
import { useFrame } from '@react-three/fiber';
import { useVoxelGame, WeatherType } from '../../lib/stores/useVoxelGame';

/**
 * Weather effects component for the game world
 */
export default function Weather() {
  // Get current weather state from the game store
  const weather = useVoxelGame(state => state.weather);
  const playerPosition = useVoxelGame(state => state.player.position);
  
  // References for animation
  const rainParticlesRef = useRef<THREE.Points>(null);
  const snowParticlesRef = useRef<THREE.Points>(null);
  const lightningRef = useRef<THREE.PointLight>(null);
  
  // Fix for remaining "storm" references in this file - map thunderstorm to storm for compatibility
  const isStormyWeather = weather === 'thunderstorm';
  
  // Lightning state needs to be tracked with useState to persist across renders
  const [lightningState, setLightningState] = useState({
    active: false,
    nextStrike: Math.random() * 10,
    duration: 0,
  });
  
  // Determine if we should show weather effects
  const shouldShowRain = weather === 'rain' || weather === 'thunderstorm';
  const shouldShowSnow = weather === 'snow';
  const shouldShowLightning = weather === 'thunderstorm';
  const shouldShowFog = weather === 'fog' || weather === 'rain' || weather === 'snow' || weather === 'thunderstorm';
  
  // Generate particles for rain
  const rainParticles = useMemo(() => {
    // Skip if not raining
    if (!shouldShowRain) return null;
    
    // Rain count based on intensity
    const count = weather === 'thunderstorm' ? 5000 : 2000;
    
    // Create geometry with random positions
    const geometry = new THREE.BufferGeometry();
    const positions = new Float32Array(count * 3);
    const velocities = new Float32Array(count); // Store velocity for each raindrop
    const spread = 40; // How far the rain spreads
    
    for (let i = 0; i < count; i++) {
      // Positions
      const i3 = i * 3;
      positions[i3] = (Math.random() * 2 - 1) * spread;
      positions[i3 + 1] = Math.random() * 40; // Up to 40 units above ground
      positions[i3 + 2] = (Math.random() * 2 - 1) * spread;
      
      // Velocities (for animation)
      velocities[i] = 0.1 + Math.random() * 0.2; // Between 0.1 and 0.3
    }
    
    geometry.setAttribute('position', new THREE.BufferAttribute(positions, 3));
    
    // Create material
    const material = new THREE.PointsMaterial({
      color: weather === 'thunderstorm' ? 0xCCCCCC : 0xAAAAAA,
      size: weather === 'thunderstorm' ? 0.2 : 0.1,
      transparent: true,
      opacity: 0.6,
      sizeAttenuation: true,
    });
    
    return { geometry, material, velocities };
  }, [weather, shouldShowRain]);

  // Generate particles for snow
  const snowParticles = useMemo(() => {
    // Skip if not snowing
    if (!shouldShowSnow) return null;
    
    // Snow count
    const count = 1500;
    
    // Create geometry with random positions
    const geometry = new THREE.BufferGeometry();
    const positions = new Float32Array(count * 3);
    const velocities = new Float32Array(count * 2); // Speed and rotation for each snowflake
    const sizes = new Float32Array(count); // Different sizes for snowflakes
    const spread = 40; // How far the snow spreads
    
    for (let i = 0; i < count; i++) {
      // Positions
      const i3 = i * 3;
      positions[i3] = (Math.random() * 2 - 1) * spread;
      positions[i3 + 1] = Math.random() * 40; // Up to 40 units above ground
      positions[i3 + 2] = (Math.random() * 2 - 1) * spread;
      
      // Velocities (for animation)
      const i2 = i * 2;
      velocities[i2] = 0.02 + Math.random() * 0.05; // Fall speed between 0.02 and 0.07
      velocities[i2 + 1] = Math.random() * 0.01; // Rotation speed
      
      // Sizes
      sizes[i] = 0.2 + Math.random() * 0.3; // Between 0.2 and 0.5
    }
    
    geometry.setAttribute('position', new THREE.BufferAttribute(positions, 3));
    geometry.setAttribute('size', new THREE.BufferAttribute(sizes, 1));
    
    // Create material
    const material = new THREE.PointsMaterial({
      color: 0xFFFFFF,
      size: 0.4,
      transparent: true,
      opacity: 0.8,
      sizeAttenuation: true,
    });
    
    return { geometry, material, velocities };
  }, [weather, shouldShowSnow]);

  // Animate weather effects
  useFrame(({ clock }) => {
    const time = clock.getElapsedTime();
    
    // Animate rain particles
    if (rainParticlesRef.current && rainParticles) {
      const positions = (rainParticlesRef.current.geometry as THREE.BufferGeometry)
        .attributes.position.array as Float32Array;
      
      for (let i = 0; i < positions.length / 3; i++) {
        const i3 = i * 3;
        
        // Move rain down based on velocity
        positions[i3 + 1] -= rainParticles.velocities[i];
        
        // Reset position if below ground
        if (positions[i3 + 1] < 0) {
          positions[i3] = (Math.random() * 2 - 1) * 40 + playerPosition[0];
          positions[i3 + 1] = 40; // Reset to top
          positions[i3 + 2] = (Math.random() * 2 - 1) * 40 + playerPosition[2];
        }
      }
      
      // Follow player position (roughly)
      const centerX = playerPosition[0];
      const centerZ = playerPosition[2];
      
      rainParticlesRef.current.position.x = centerX;
      rainParticlesRef.current.position.z = centerZ;
      
      // Update geometry
      (rainParticlesRef.current.geometry as THREE.BufferGeometry)
        .attributes.position.needsUpdate = true;
    }
    
    // Animate snow particles
    if (snowParticlesRef.current && snowParticles) {
      const positions = (snowParticlesRef.current.geometry as THREE.BufferGeometry)
        .attributes.position.array as Float32Array;
      
      for (let i = 0; i < positions.length / 3; i++) {
        const i3 = i * 3;
        const i2 = i * 2;
        
        // Move snow down based on velocity
        positions[i3 + 1] -= snowParticles.velocities[i2];
        
        // Add gentle swaying using sine waves and time
        positions[i3] += Math.sin(time * 2 + i) * 0.01 * snowParticles.velocities[i2 + 1];
        positions[i3 + 2] += Math.cos(time * 2 + i) * 0.01 * snowParticles.velocities[i2 + 1];
        
        // Reset position if below ground
        if (positions[i3 + 1] < 0) {
          positions[i3] = (Math.random() * 2 - 1) * 40 + playerPosition[0];
          positions[i3 + 1] = 40; // Reset to top
          positions[i3 + 2] = (Math.random() * 2 - 1) * 40 + playerPosition[2];
        }
      }
      
      // Follow player position (roughly)
      const centerX = playerPosition[0];
      const centerZ = playerPosition[2];
      
      snowParticlesRef.current.position.x = centerX;
      snowParticlesRef.current.position.z = centerZ;
      
      // Update geometry
      (snowParticlesRef.current.geometry as THREE.BufferGeometry)
        .attributes.position.needsUpdate = true;
    }
    
    // Handle lightning for thunderstorms
    if (shouldShowLightning && lightningRef.current) {
      let newLightningState = { ...lightningState };
      
      if (lightningState.active) {
        // Flash is active, count down duration
        newLightningState.duration -= clock.getDelta();
        
        if (newLightningState.duration <= 0) {
          // Turn off lightning
          newLightningState.active = false;
          lightningRef.current.intensity = 0;
          
          // Set time for next strike
          newLightningState.nextStrike = 5 + Math.random() * 15; // Between 5 and 20 seconds
        } else {
          // Flicker the light for effect
          const flicker = 0.8 + Math.random() * 0.4;
          lightningRef.current.intensity = 1.5 * flicker;
        }
      } else {
        // Count down to next lightning strike
        newLightningState.nextStrike -= clock.getDelta();
        
        if (newLightningState.nextStrike <= 0) {
          // Trigger lightning strike
          newLightningState.active = true;
          newLightningState.duration = 0.1 + Math.random() * 0.3; // Flash lasts 0.1-0.4 seconds
          
          // Position lightning near player
          const strikeX = playerPosition[0] + (Math.random() * 100 - 50);
          const strikeZ = playerPosition[2] + (Math.random() * 100 - 50);
          
          lightningRef.current.position.set(strikeX, 20, strikeZ);
          lightningRef.current.intensity = 2;
          
          // TODO: Play thunder sound here
          // We would need to add audio support to the app
        }
      }
      
      // Update lightning state
      if (newLightningState.active !== lightningState.active ||
          newLightningState.duration !== lightningState.duration ||
          newLightningState.nextStrike !== lightningState.nextStrike) {
        setLightningState(newLightningState);
      }
    }
  });

  return (
    <group>
      {/* Rain particles */}
      {shouldShowRain && rainParticles && (
        <points ref={rainParticlesRef}>
          <primitive object={rainParticles.geometry} attach="geometry" />
          <primitive object={rainParticles.material} attach="material" />
        </points>
      )}
      
      {/* Snow particles */}
      {shouldShowSnow && snowParticles && (
        <points ref={snowParticlesRef}>
          <primitive object={snowParticles.geometry} attach="geometry" />
          <primitive object={snowParticles.material} attach="material" />
        </points>
      )}
      
      {/* Lightning for thunderstorms */}
      {shouldShowLightning && (
        <pointLight
          ref={lightningRef}
          position={[0, 20, 0]}
          intensity={0}
          distance={200}
          decay={2}
          color="#E0FFFF"
        />
      )}
      
      {/* Fog effect based on weather */}
      {shouldShowFog && (
        <fog
          attach="fog"
          args={[
            // Color
            weather === 'snow' ? '#EDEFF2' : 
            weather === 'thunderstorm' ? '#232323' : 
            weather === 'fog' ? '#C8D6E5' :
            '#7E8AA2',
            // Near
            weather === 'thunderstorm' ? 10 : 
            weather === 'fog' ? 5 : 20,
            // Far
            weather === 'thunderstorm' ? 60 : 
            weather === 'fog' ? 30 : 100
          ]}
        />
      )}
    </group>
  );
}