import React, { useRef, useState, useEffect, useMemo } from 'react';
import * as THREE from 'three';
import { useFrame } from '@react-three/fiber';
import { useVoxelGame, WeatherType } from '../../lib/stores/useVoxelGame';
import { useAudio } from '../../lib/stores/useAudio';
import { createNoise2D } from 'simplex-noise';

interface WeatherProps {
  intensity?: number; // 0 to 1, controls intensity of weather effects
}

/**
 * Weather component that renders various weather effects like rain, snow, fog, and lightning
 */
export default function Weather({ intensity: propIntensity }: WeatherProps) {
  // References for animation and particle systems
  const rainRef = useRef<THREE.Points>(null);
  const snowRef = useRef<THREE.Points>(null);
  const lightningRef = useRef<THREE.PointLight>(null);
  
  // For snow animation - noise function and time
  const noiseRef = useRef<((x: number, y: number) => number) | null>(null);
  const timeRef = useRef<number>(0);
  
  // Global game state
  const weather = useVoxelGame(state => state.weatherSystem);
  const timeOfDay = useVoxelGame(state => state.timeOfDay);
  const playerPosition = useVoxelGame(state => state.player.position);
  
  // Audio system for weather sounds
  const audioSystem = useAudio();
  
  // Use prop intensity or fall back to store value
  const intensity = propIntensity !== undefined ? propIntensity : weather.intensity;
  
  // Lightning flash state
  const [lightningFlash, setLightningFlash] = useState(false);
  const [nextLightningTime, setNextLightningTime] = useState(0);
  
  // Initialize noise function for snow drift
  useEffect(() => {
    noiseRef.current = createNoise2D();
    return () => {
      noiseRef.current = null;
    };
  }, []);
  
  // Lightning properties (position, intensity, etc.)
  const [lightningProps, setLightningProps] = useState({
    position: [0, 20, 0] as [number, number, number],
    color: '#f9f9ff',
    intensity: 5,
    distance: 100,
    decay: 2
  });
  
  // Create rain particle system
  const rainSystem = useMemo(() => {
    if (weather.currentWeather !== 'rain' && weather.currentWeather !== 'thunderstorm') {
      return null;
    }
    
    // Rain particle geometry
    const particleCount = 5000;
    const rainGeometry = new THREE.BufferGeometry();
    
    // Create positions for rain particles in a volume above the player
    const positions = new Float32Array(particleCount * 3);
    const velocities = new Float32Array(particleCount);
    const sizes = new Float32Array(particleCount);
    
    // Fill the arrays with random values
    for (let i = 0; i < particleCount; i++) {
      // Position in a 100x100 area centered on origin (will follow player)
      const x = (Math.random() - 0.5) * 100;
      const z = (Math.random() - 0.5) * 100;
      const y = Math.random() * 50 + 20; // Height between 20-70 units
      
      positions[i * 3] = x;
      positions[i * 3 + 1] = y;
      positions[i * 3 + 2] = z;
      
      // Random fall speed
      velocities[i] = 0.1 + Math.random() * 0.2;
      
      // Random size
      sizes[i] = 0.1 + Math.random() * 0.2;
    }
    
    // Add attributes to geometry
    rainGeometry.setAttribute('position', new THREE.BufferAttribute(positions, 3));
    rainGeometry.setAttribute('velocity', new THREE.BufferAttribute(velocities, 1));
    rainGeometry.setAttribute('size', new THREE.BufferAttribute(sizes, 1));
    
    // Create material for rain particles
    const rainMaterial = new THREE.PointsMaterial({
      color: '#99ccff',
      size: 0.2,
      transparent: true,
      opacity: 0.6,
      blending: THREE.AdditiveBlending,
      sizeAttenuation: true
    });
    
    return { geometry: rainGeometry, material: rainMaterial };
  }, [weather.currentWeather]);
  
  // Create snow particle system
  const snowSystem = useMemo(() => {
    if (weather.currentWeather !== 'snow') {
      return null;
    }
    
    // Snow particle geometry
    const particleCount = 3000;
    const snowGeometry = new THREE.BufferGeometry();
    
    // Create positions for snow particles in a volume above the player
    const positions = new Float32Array(particleCount * 3);
    const velocities = new Float32Array(particleCount);
    const sizes = new Float32Array(particleCount);
    const driftFactors = new Float32Array(particleCount); // How much each particle drifts
    
    // Fill the arrays with random values
    for (let i = 0; i < particleCount; i++) {
      // Position in a 100x100 area centered on origin (will follow player)
      const x = (Math.random() - 0.5) * 100;
      const z = (Math.random() - 0.5) * 100;
      const y = Math.random() * 50 + 20; // Height between 20-70 units
      
      positions[i * 3] = x;
      positions[i * 3 + 1] = y;
      positions[i * 3 + 2] = z;
      
      // Snow falls slower than rain
      velocities[i] = 0.05 + Math.random() * 0.1;
      
      // Snowflakes are larger than rain drops
      sizes[i] = 0.2 + Math.random() * 0.3;
      
      // Random drift factor
      driftFactors[i] = Math.random() * 0.5 + 0.1;
    }
    
    // Add attributes to geometry
    snowGeometry.setAttribute('position', new THREE.BufferAttribute(positions, 3));
    snowGeometry.setAttribute('velocity', new THREE.BufferAttribute(velocities, 1));
    snowGeometry.setAttribute('size', new THREE.BufferAttribute(sizes, 1));
    snowGeometry.setAttribute('drift', new THREE.BufferAttribute(driftFactors, 1));
    
    // Create material for snow particles
    const snowMaterial = new THREE.PointsMaterial({
      color: '#ffffff',
      size: 0.3,
      transparent: true,
      opacity: 0.8,
      blending: THREE.AdditiveBlending,
      sizeAttenuation: true
    });
    
    return { geometry: snowGeometry, material: snowMaterial };
  }, [weather.currentWeather]);
  
  // Handle lightning effects
  useEffect(() => {
    if (weather.currentWeather === 'thunderstorm') {
      // Set initial next lightning time
      if (nextLightningTime === 0) {
        setNextLightningTime(Math.random() * 10000 + 5000); // 5-15 seconds
      }
    } else {
      // Reset lightning when not in a thunderstorm
      setLightningFlash(false);
      setNextLightningTime(0);
    }
  }, [weather.currentWeather, nextLightningTime]);
  
  // Update audio system based on weather
  useEffect(() => {
    // Update ambient sounds based on weather
    audioSystem.updateAmbience(
      timeOfDay, 
      weather.currentWeather,
      0, // player depth (not used here)
      false // near water (not used here)
    );
    
    return () => {
      // Clean up any ambient timers
    };
  }, [weather.currentWeather, timeOfDay, audioSystem]);
  
  // Animate weather systems
  useFrame((state, delta) => {
    // Increment time for snow drift animation
    timeRef.current += delta;
    
    // Animate rain if active
    if (rainSystem && (weather.currentWeather === 'rain' || weather.currentWeather === 'thunderstorm') && rainRef.current) {
      const positions = (rainRef.current.geometry.attributes.position as THREE.BufferAttribute).array as Float32Array;
      const velocities = (rainRef.current.geometry.attributes.velocity as THREE.BufferAttribute).array;
      
      // Update position of each particle
      for (let i = 0; i < positions.length / 3; i++) {
        // Move particle down based on velocity
        positions[i * 3 + 1] -= velocities[i] * 30 * delta;
        
        // If particle is below ground, reset it to the top
        if (positions[i * 3 + 1] < 0) {
          positions[i * 3 + 1] = Math.random() * 50 + 20;
          positions[i * 3] = (Math.random() - 0.5) * 100 + playerPosition[0];
          positions[i * 3 + 2] = (Math.random() - 0.5) * 100 + playerPosition[2];
        }
      }
      
      // Center the rain system around the player
      rainRef.current.position.set(playerPosition[0], 0, playerPosition[2]);
      
      // Update the geometry
      rainRef.current.geometry.attributes.position.needsUpdate = true;
    }
    
    // Animate snow if active
    if (snowSystem && weather.currentWeather === 'snow' && snowRef.current && noiseRef.current) {
      const positions = (snowRef.current.geometry.attributes.position as THREE.BufferAttribute).array as Float32Array;
      const velocities = (snowRef.current.geometry.attributes.velocity as THREE.BufferAttribute).array;
      const driftFactors = (snowRef.current.geometry.attributes.drift as THREE.BufferAttribute).array;
      
      // Update position of each particle
      for (let i = 0; i < positions.length / 3; i++) {
        // Move particle down based on velocity
        positions[i * 3 + 1] -= velocities[i] * 15 * delta;
        
        // Add some horizontal drift using noise
        const noiseScale = 0.1;
        const noiseX = noiseRef.current(
          positions[i * 3] * noiseScale, 
          timeRef.current * 0.5
        ) * driftFactors[i];
        
        const noiseZ = noiseRef.current(
          positions[i * 3 + 2] * noiseScale, 
          timeRef.current * 0.5 + 100
        ) * driftFactors[i];
        
        // Apply horizontal drift to the snowflake
        positions[i * 3] += noiseX * delta;
        positions[i * 3 + 2] += noiseZ * delta;
        
        // If particle is below ground or drifted far, reset it to the top
        if (positions[i * 3 + 1] < 0 || 
            Math.abs(positions[i * 3]) > 60 || 
            Math.abs(positions[i * 3 + 2]) > 60) {
          positions[i * 3 + 1] = Math.random() * 50 + 20;
          positions[i * 3] = (Math.random() - 0.5) * 100 + playerPosition[0];
          positions[i * 3 + 2] = (Math.random() - 0.5) * 100 + playerPosition[2];
        }
      }
      
      // Center the snow system around the player
      snowRef.current.position.set(playerPosition[0], 0, playerPosition[2]);
      
      // Update the geometry
      snowRef.current.geometry.attributes.position.needsUpdate = true;
    }
    
    // Animate lightning
    if (weather.currentWeather === 'thunderstorm') {
      // Handle lightning flash
      if (lightningFlash) {
        if (lightningRef.current) {
          // Fade out the lightning flash
          lightningRef.current.intensity -= delta * 20;
          
          // Turn off lightning when it fades out
          if (lightningRef.current.intensity <= 0) {
            setLightningFlash(false);
            
            // Set time for next lightning
            setNextLightningTime(Math.random() * 15000 + 5000); // 5-20 seconds
          }
        }
      } else {
        // Check if it's time for a new lightning flash
        setNextLightningTime(prevTime => {
          if (prevTime <= 0) return 0;
          
          const newTime = prevTime - delta * 1000;
          if (newTime <= 0) {
            // Create new lightning flash
            createLightningFlash();
            return 0;
          }
          
          return newTime;
        });
      }
    }
  });
  
  // Create a lightning flash at a random position
  const createLightningFlash = () => {
    // Random position within view distance but offset from player
    const distance = Math.random() * 80 + 20; // 20-100 units away
    const angle = Math.random() * Math.PI * 2; // Random angle
    
    const x = playerPosition[0] + Math.cos(angle) * distance;
    const z = playerPosition[2] + Math.sin(angle) * distance;
    const y = 50; // Height of the lightning
    
    // Random intensity and color variation
    const baseIntensity = 5 + Math.random() * 15; // 5-20 intensity
    const colorVariation = Math.random() * 0.2; // 0-0.2 color shift
    
    // Set lightning properties
    setLightningProps({
      position: [x, y, z],
      color: `rgb(${240 + colorVariation * 15}, ${240 + colorVariation * 15}, ${255})`,
      intensity: baseIntensity,
      distance: 150 + Math.random() * 100, // 150-250 units
      decay: 1.5 + Math.random() * 1 // 1.5-2.5 decay
    });
    
    // Activate lightning flash
    setLightningFlash(true);
    
    // Play thunder sound with delay based on distance
    const distanceToPlayer = Math.sqrt(
      Math.pow(x - playerPosition[0], 2) + 
      Math.pow(z - playerPosition[2], 2)
    );
    
    // Sound travels at roughly 343 m/s, we'll use a scale factor for game feel
    const soundDelayMs = distanceToPlayer * 20; // Rough approximation for game feel
    
    // Play thunder sound after delay
    setTimeout(() => {
      // Check if thunderSound exists before playing
      if (audioSystem.thunderSound) {
        audioSystem.playSound('thunderSound', { 
          volume: 0.7 * audioSystem.ambientVolume * audioSystem.masterVolume 
        });
      }
    }, soundDelayMs);
  };
  
  return (
    <group>
      {/* Rain particles */}
      {rainSystem && (weather.currentWeather === 'rain' || weather.currentWeather === 'thunderstorm') && (
        <points ref={rainRef} geometry={rainSystem.geometry} material={rainSystem.material} />
      )}
      
      {/* Snow particles */}
      {snowSystem && weather.currentWeather === 'snow' && (
        <points ref={snowRef} geometry={snowSystem.geometry} material={snowSystem.material} />
      )}
      
      {/* Lightning */}
      {lightningFlash && (
        <pointLight 
          ref={lightningRef}
          position={lightningProps.position}
          color={lightningProps.color}
          intensity={lightningProps.intensity}
          distance={lightningProps.distance}
          decay={lightningProps.decay}
        />
      )}
      
      {/* Fog effect for various weather types */}
      {(weather.currentWeather === 'rain' || weather.currentWeather === 'thunderstorm' || weather.currentWeather === 'snow') && (
        <fog 
          attach="fog" 
          color={
            weather.currentWeather === 'thunderstorm' ? '#445566' : 
            weather.currentWeather === 'snow' ? '#ccddee' : 
            '#667788'
          } 
          near={10} 
          far={
            weather.currentWeather === 'snow' ? 40 + (1 - intensity) * 30 :
            50 + (1 - intensity) * 30
          } // Snow has reduced visibility
        />
      )}
      
      {/* Lighting adjustments for weather */}
      {(weather.currentWeather === 'rain' || weather.currentWeather === 'thunderstorm' || weather.currentWeather === 'snow') && (
        <ambientLight 
          color={
            weather.currentWeather === 'thunderstorm' ? '#334455' : 
            weather.currentWeather === 'snow' ? '#b0c4de' : 
            '#556677'
          }
          intensity={
            weather.currentWeather === 'snow' ? 0.7 - intensity * 0.1 :
            0.5 - intensity * 0.2
          } // Snow has brighter ambient light due to reflections
        />
      )}
      
      {/* Additional soft light for snow to simulate reflection */}
      {weather.currentWeather === 'snow' && (
        <hemisphereLight 
          color="#ffffff" 
          groundColor="#b0c4de" 
          intensity={0.4 + intensity * 0.2}
        />
      )}
    </group>
  );
}