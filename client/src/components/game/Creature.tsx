import { useRef, useEffect, useState, Suspense } from 'react';
import { useFrame } from '@react-three/fiber';
import { useGLTF } from '@react-three/drei';
import * as THREE from 'three';
import { GLTF } from 'three-stdlib';
import { useAudio } from '../../lib/stores/useAudio';

// OPTIMIZATION: Disable model preloading to improve initial load time
// useGLTF.preload('/models/zombie.glb');

// No preloading - simplified for performance

interface CreatureProps {
  type: string;
  position: { x: number, y: number, z: number };
  rotation: { y: number };
  state?: string;
  mood?: string;
  animationState?: string;
  animationSpeed?: number;
  animationProgress?: number;
  targetPosition?: { x: number, y: number, z: number } | null;
  flockId?: string;
  leader?: boolean;
  // Health properties
  health?: number;
  maxHealth?: number;
  // Flag to show active loot bag
  hasLoot?: boolean;
  showHealth?: boolean;
}

export default function Creature({ 
  type, 
  position, 
  rotation,
  state = 'idle',
  mood = 'calm',
  animationState = 'idle',
  animationSpeed = 1,
  animationProgress = 0,
  targetPosition = null,
  flockId,
  leader = false,
  // Health parameters with defaults
  health = 10,
  maxHealth = 10,
  hasLoot = false,
  showHealth = true
}: CreatureProps) {
  const meshRef = useRef<THREE.Mesh>(null);
  const groupRef = useRef<THREE.Group>(null);
  const [color, setColor] = useState<string>('#ffffff');
  const [modelLoaded, setModelLoaded] = useState(false);
  const [modelError, setModelError] = useState(false);
  
  // Single model reference with proper typing
  const [model, setModel] = useState<THREE.Group | null>(null);
  
  // Load model based on creature type - optimized to avoid async loading within component
  useEffect(() => {
    // Skip loading if we already tried or got an error
    if (modelLoaded || modelError) return;
    
    // OPTIMIZATION: Use a fallback for all non-zombie creatures for now
    if (type === 'zombie') {
      try {
        // SIMPLIFIED: Use synchronous loading with preloaded model
        const modelPath = '/models/zombie.glb';
        
        // Since we preloaded the zombie model, this should be quick
        try {
          const gltf = useGLTF(modelPath) as GLTF & {
            scene: THREE.Group
          };
          
          // Store the model and update state
          setModel(gltf.scene);
          setModelLoaded(true);
        } catch (err) {
          console.warn(`Failed to load ${type} model, using fallback`);
          setModelError(true);
        }
      } catch (error) {
        console.warn(`Error initializing model for ${type}`);
        setModelError(true);
      }
    } else {
      // For now, just use the fallback for other creature types
      setModelError(true);
    }
  }, [type, modelLoaded, modelError]);
  
  // Set up creature appearance based on type
  useEffect(() => {
    switch (type) {
      case 'cow':
        setColor('#8D6E63');
        break;
      case 'pig':
        setColor('#FFCDD2');
        break;
      case 'sheep':
        setColor('#ECEFF1');
        break;
      case 'chicken':
        setColor('#FFF9C4');
        break;
      case 'zombie':
        setColor('#8BC34A');
        break;
      case 'skeleton':
        setColor('#EEEEEE');
        break;
      case 'spider':
        setColor('#4E342E');
        break;
      case 'bee':
        setColor('#FFC107');
        break;
      case 'wraith':
        setColor('#9C27B0'); // Purple for the wraith
        break;
      default:
        setColor('#FF5722');
    }
  }, [type]);
  
  // Handle sound effects for creatures
  useEffect(() => {
    // Try to play creature sounds when created
    const audioStore = useAudio.getState();
    
    if (audioStore) {
      try {
        // Initial idle sound with some randomization to avoid all creatures sounding at once
        const initialDelay = Math.random() * 2000;
        setTimeout(() => {
          audioStore.playCreatureSound(type, 'idle');
        }, initialDelay);
        
        // Periodic sounds for alive creatures
        const soundInterval = setInterval(() => {
          // Only make sounds occasionally
          if (Math.random() < 0.3 && state === 'idle') {
            audioStore.playCreatureSound(type, 'idle');
          }
          
          // More sounds when aggressive
          if (mood === 'aggressive' && Math.random() < 0.5) {
            audioStore.playCreatureSound(type, 'idle');
          }
        }, 7000 + Math.random() * 15000); // Random interval between sounds
        
        return () => clearInterval(soundInterval);
      } catch (error) {
        console.warn('Could not play creature sounds:', error);
      }
    }
  }, [type, mood, state]);

  // Add animations
  useFrame(() => {
    // For base mesh (fallback or creatures without 3D models)
    if (meshRef.current) {
      // Idle bobbing animation
      if (animationState === 'idle') {
        meshRef.current.position.y = position.y + Math.sin(Date.now() * 0.003) * 0.05;
      }
      
      // If afraid, add slight trembling
      if (mood === 'afraid') {
        meshRef.current.position.x = position.x + Math.sin(Date.now() * 0.01) * 0.03;
        meshRef.current.position.z = position.z + Math.cos(Date.now() * 0.01) * 0.03;
      }
      
      // If leader, add slight up/down motion to indicate status
      if (leader) {
        meshRef.current.position.y = position.y + 0.2 + Math.sin(Date.now() * 0.002) * 0.1;
      }
      
      // If aggressive or attacking, add more intense motion
      if (mood === 'aggressive' && animationState === 'attack') {
        meshRef.current.position.z = position.z + Math.sin(Date.now() * 0.01) * 0.2;
      }
    }
    
    // For 3D models (when loaded)
    if (groupRef.current && model) {
      // Different animations for different creature models
      if (type === 'zombie') {
        if (animationState === 'idle') {
          // Subtle swaying for zombie model
          groupRef.current.rotation.y = rotation.y + Math.sin(Date.now() * 0.001) * 0.05;
        } else if (animationState === 'walk') {
          // Walking animation - bob up and down slightly
          groupRef.current.position.y = Math.sin(Date.now() * 0.01) * 0.05;
        } else if (animationState === 'attack') {
          // Attack animation - lunge forward slightly
          groupRef.current.position.z = Math.sin(Date.now() * 0.01) * 0.1;
        }
      } 
      else if (type === 'wraith') {
        // More ethereal, floating animations for wraith
        if (animationState === 'idle' || animationState === 'hunt') {
          // Ghostly hovering animation for wraith
          groupRef.current.position.y = Math.sin(Date.now() * 0.002) * 0.1;
          // Slow rotation
          groupRef.current.rotation.y = rotation.y + Math.sin(Date.now() * 0.0005) * 0.1;
        } else if (animationState === 'attack') {
          // Attack animation - more aggressive motion
          groupRef.current.position.z = Math.sin(Date.now() * 0.015) * 0.15;
          groupRef.current.rotation.y = rotation.y + Math.sin(Date.now() * 0.01) * 0.2;
        } else if (animationState === 'teleport') {
          // Teleport animation - pulsing scale and opacity
          const scale = 1.0 + Math.sin(Date.now() * 0.01) * 0.1;
          groupRef.current.scale.set(scale, scale, scale);
        }
      }
      else if (type === 'skeleton') {
        // Skeleton animations
        if (animationState === 'idle') {
          // Subtle bone-rattling effect
          groupRef.current.position.y = Math.sin(Date.now() * 0.008) * 0.03;
          groupRef.current.rotation.y = rotation.y + Math.sin(Date.now() * 0.002) * 0.04;
        } else if (animationState === 'walk') {
          // More pronounced walking motion
          groupRef.current.position.y = Math.sin(Date.now() * 0.015) * 0.05;
          // Slight side-to-side sway while walking
          groupRef.current.rotation.z = Math.sin(Date.now() * 0.01) * 0.03;
        } else if (animationState === 'attack') {
          // Quick forward lunge for attack
          groupRef.current.position.z = Math.sin(Date.now() * 0.02) * 0.15;
          // Slight tilt during attack
          groupRef.current.rotation.x = Math.sin(Date.now() * 0.02) * 0.1;
        }
      }
    }
  });
  
  // Show health bar if creature has health less than max and is not at full health
  const showHealthBar = showHealth && health < maxHealth;
  
  // Health bar width calculation
  const healthPercent = Math.max(0, Math.min(1, health / maxHealth));
  
  // Use a placeholder mesh for all creatures (simpler for now)
  return (
    <mesh 
      ref={meshRef}
      position={[position.x, position.y + 1, position.z]} // Added +1 to Y to lift creatures up 
      rotation={[0, rotation.y, 0]}
      castShadow
      scale={1.5} // Make creatures bigger
    >
      {/* Health bar positioned above creature if needed */}
      {showHealthBar && (
        <group position={[0, 1.3, 0]}>
          {/* Health bar background */}
          <mesh position={[0, 0, 0]}>
            <boxGeometry args={[0.8, 0.1, 0.05]} />
            <meshStandardMaterial color="#333333" />
          </mesh>
          
          {/* Health bar fill - scales with health percentage */}
          <mesh position={[-(0.8 * (1 - healthPercent)) / 2, 0, 0.026]}>
            <boxGeometry args={[0.8 * healthPercent, 0.08, 0.05]} />
            <meshStandardMaterial 
              color={health > maxHealth * 0.6 ? '#4CAF50' : health > maxHealth * 0.3 ? '#FFC107' : '#F44336'} 
              emissive={health > maxHealth * 0.6 ? '#4CAF50' : health > maxHealth * 0.3 ? '#FFC107' : '#F44336'}
              emissiveIntensity={0.5}
            />
          </mesh>
        </group>
      )}
      
      {/* Loot bag indicator */}
      {hasLoot && (
        <mesh position={[0, 0.8, 0]} rotation={[0, 0, Math.PI / 4]}>
          <boxGeometry args={[0.3, 0.3, 0.3]} />
          <meshStandardMaterial color="#FFD700" emissive="#FFD700" emissiveIntensity={0.5} />
        </mesh>
      )}
      
      {type === 'cow' || type === 'pig' || type === 'sheep' ? (
        // Passive mobs - box with legs
        <group>
          {/* Main body */}
          <mesh castShadow position={[0, 0.5, 0]}>
            <boxGeometry args={[0.8, 0.6, 1.2]} />
            <meshStandardMaterial color={color} />
          </mesh>
          
          {/* Legs */}
          <mesh castShadow position={[0.3, 0, 0.4]}>
            <boxGeometry args={[0.2, 0.6, 0.2]} />
            <meshStandardMaterial color={color} />
          </mesh>
          <mesh castShadow position={[-0.3, 0, 0.4]}>
            <boxGeometry args={[0.2, 0.6, 0.2]} />
            <meshStandardMaterial color={color} />
          </mesh>
          <mesh castShadow position={[0.3, 0, -0.4]}>
            <boxGeometry args={[0.2, 0.6, 0.2]} />
            <meshStandardMaterial color={color} />
          </mesh>
          <mesh castShadow position={[-0.3, 0, -0.4]}>
            <boxGeometry args={[0.2, 0.6, 0.2]} />
            <meshStandardMaterial color={color} />
          </mesh>
          
          {/* Head */}
          <mesh castShadow position={[0, 0.8, -0.7]}>
            <boxGeometry args={[0.6, 0.4, 0.4]} />
            <meshStandardMaterial color={color} />
          </mesh>
          
          {/* Type indicator (label) */}
          <mesh position={[0, 1.2, 0]}>
            <sphereGeometry args={[0.2, 16, 16]} />
            <meshStandardMaterial color={color} emissive={color} emissiveIntensity={0.5} />
          </mesh>
        </group>
      ) : (
        // Hostile mobs - different shapes
        type === 'zombie' ? (
          // Zombie with 3D model if available
          <group>
            {modelLoaded && model ? (
              <Suspense fallback={
                // Fallback to simple model while loading
                <mesh castShadow>
                  <boxGeometry args={[0.6, 1.6, 0.5]} />
                  <meshStandardMaterial color={color} />
                </mesh>
              }>
                <group ref={groupRef}>
                  <primitive 
                    object={model.clone()} 
                    scale={[2.5, 2.5, 2.5]} 
                    position={[0, -1.5, 0]}
                    rotation={[0, Math.PI - rotation.y, 0]} 
                    castShadow 
                  />
                </group>
              </Suspense>
            ) : (
              // Fallback if model fails to load
              <>
                {/* Torso */}
                <mesh castShadow position={[0, 0.8, 0]}>
                  <boxGeometry args={[0.6, 1.2, 0.3]} />
                  <meshStandardMaterial color={color} />
                </mesh>
                
                {/* Hips */}
                <mesh castShadow position={[0, 0.3, 0]}>
                  <boxGeometry args={[0.3, 0.6, 0.3]} />
                  <meshStandardMaterial color={color} />
                </mesh>
                
                {/* Arms */}
                <mesh castShadow position={[0.4, 0.8, 0]}>
                  <boxGeometry args={[0.2, 0.8, 0.2]} />
                  <meshStandardMaterial color={color} />
                </mesh>
                <mesh castShadow position={[-0.4, 0.8, 0]}>
                  <boxGeometry args={[0.2, 0.8, 0.2]} />
                  <meshStandardMaterial color={color} />
                </mesh>
                
                {/* Legs */}
                <mesh castShadow position={[0.2, -0.5, 0]}>
                  <boxGeometry args={[0.2, 0.6, 0.2]} />
                  <meshStandardMaterial color={color} />
                </mesh>
                <mesh castShadow position={[-0.2, -0.5, 0]}>
                  <boxGeometry args={[0.2, 0.6, 0.2]} />
                  <meshStandardMaterial color={color} />
                </mesh>
                
                {/* Head */}
                <mesh castShadow position={[0, 1.5, 0]}>
                  <boxGeometry args={[0.5, 0.5, 0.5]} />
                  <meshStandardMaterial color={color} />
                </mesh>
              </>
            )}
            
            {/* Type indicator (bigger for hostiles) */}
            <mesh position={[0, 2.0, 0]}>
              <sphereGeometry args={[0.25, 16, 16]} />
              <meshStandardMaterial color="red" emissive="red" emissiveIntensity={1} />
            </mesh>
          </group>
        ) : type === 'skeleton' ? (
          // Skeleton with 3D model if available
          <group>
            {modelLoaded && model ? (
              <Suspense fallback={
                // Fallback to simple model while loading
                <mesh castShadow>
                  <boxGeometry args={[0.6, 1.6, 0.5]} />
                  <meshStandardMaterial color={color} />
                </mesh>
              }>
                <group ref={groupRef}>
                  <primitive 
                    object={model.clone()} 
                    scale={[2.5, 2.5, 2.5]} 
                    position={[0, -1.5, 0]}
                    rotation={[0, Math.PI - rotation.y, 0]} 
                    castShadow 
                  />
                </group>
                
                {/* Add some subtle bone rattling effect lights */}
                <pointLight
                  position={[0, 0.5, 0]}
                  distance={3}
                  intensity={0.8}
                  color="#FFFFFF"
                />
                
                {/* Add eerie glow to eye sockets */}
                <pointLight
                  position={[0, 1.3, 0.2]}
                  distance={1}
                  intensity={0.6}
                  color="#00FFFF"
                />
              </Suspense>
            ) : (
              // Fallback if model fails to load
              <>
                {/* Torso */}
                <mesh castShadow position={[0, 0.8, 0]}>
                  <boxGeometry args={[0.6, 1.2, 0.3]} />
                  <meshStandardMaterial color={color} />
                </mesh>
                
                {/* Hips */}
                <mesh castShadow position={[0, 0.3, 0]}>
                  <boxGeometry args={[0.3, 0.6, 0.3]} />
                  <meshStandardMaterial color={color} />
                </mesh>
                
                {/* Arms */}
                <mesh castShadow position={[0.4, 0.8, 0]}>
                  <boxGeometry args={[0.2, 0.8, 0.2]} />
                  <meshStandardMaterial color={color} />
                </mesh>
                <mesh castShadow position={[-0.4, 0.8, 0]}>
                  <boxGeometry args={[0.2, 0.8, 0.2]} />
                  <meshStandardMaterial color={color} />
                </mesh>
                
                {/* Legs */}
                <mesh castShadow position={[0.2, -0.5, 0]}>
                  <boxGeometry args={[0.2, 0.6, 0.2]} />
                  <meshStandardMaterial color={color} />
                </mesh>
                <mesh castShadow position={[-0.2, -0.5, 0]}>
                  <boxGeometry args={[0.2, 0.6, 0.2]} />
                  <meshStandardMaterial color={color} />
                </mesh>
                
                {/* Head */}
                <mesh castShadow position={[0, 1.5, 0]}>
                  <boxGeometry args={[0.5, 0.5, 0.5]} />
                  <meshStandardMaterial color={color} />
                </mesh>
              </>
            )}
            
            {/* Type indicator (bigger for hostiles) */}
            <mesh position={[0, 2.0, 0]}>
              <sphereGeometry args={[0.25, 16, 16]} />
              <meshStandardMaterial color="red" emissive="red" emissiveIntensity={1} />
            </mesh>
          </group>
        ) : type === 'wraith' ? (
          // Wraith with 3D model if available
          <group>
            {modelLoaded && model ? (
              <Suspense fallback={
                // Fallback to simple model while loading
                <mesh castShadow>
                  <boxGeometry args={[0.6, 1.6, 0.5]} />
                  <meshStandardMaterial color={color} opacity={0.8} transparent={true} />
                </mesh>
              }>
                <group ref={groupRef}>
                  <primitive 
                    object={model.clone()} 
                    scale={[2.5, 2.5, 2.5]} 
                    position={[0, -1.5, 0]}
                    rotation={[0, Math.PI - rotation.y, 0]} 
                    castShadow 
                  />
                </group>
                
                {/* Add ghostly glow effect */}
                <pointLight
                  position={[0, 0.5, 0]}
                  distance={4}
                  intensity={1.0}
                  color={color}
                />
              </Suspense>
            ) : (
              // Fallback if model fails to load - simple ghostly figure
              <group>
                {/* Ghostly body */}
                <mesh castShadow position={[0, 0.5, 0]}>
                  <boxGeometry args={[0.6, 1.2, 0.3]} />
                  <meshStandardMaterial 
                    color={color} 
                    opacity={0.6} 
                    transparent={true} 
                    emissive={color} 
                    emissiveIntensity={0.3} 
                  />
                </mesh>
                
                {/* Head */}
                <mesh castShadow position={[0, 1.4, 0]}>
                  <sphereGeometry args={[0.4, 16, 16]} />
                  <meshStandardMaterial 
                    color={color} 
                    opacity={0.7} 
                    transparent={true} 
                    emissive={color} 
                    emissiveIntensity={0.4} 
                  />
                </mesh>
                
                {/* Ghostly glow */}
                <pointLight
                  position={[0, 0.8, 0]}
                  distance={3}
                  intensity={0.8}
                  color={color}
                />
              </group>
            )}
            
            {/* Type indicator (bigger and specially colored for the wraith) */}
            <mesh position={[0, 2.2, 0]}>
              <sphereGeometry args={[0.3, 16, 16]} />
              <meshStandardMaterial 
                color="#FF00FF" 
                emissive="#FF00FF" 
                emissiveIntensity={1.5} 
                opacity={0.8} 
                transparent={true} 
              />
            </mesh>
          </group>
        ) : type === 'spider' ? (
          // Spider creature (using simpler geometry)
          <group>
            {/* Body */}
            <mesh castShadow position={[0, 0.3, 0]}>
              <sphereGeometry args={[0.4, 16, 16]} />
              <meshStandardMaterial color={color} />
            </mesh>
            
            {/* Head */}
            <mesh castShadow position={[0, 0.3, 0.4]}>
              <sphereGeometry args={[0.2, 16, 16]} />
              <meshStandardMaterial color={color} />
            </mesh>
            
            {/* Eyes */}
            <mesh castShadow position={[0.1, 0.4, 0.5]}>
              <sphereGeometry args={[0.05, 8, 8]} />
              <meshStandardMaterial color="red" emissive="red" emissiveIntensity={1} />
            </mesh>
            <mesh castShadow position={[-0.1, 0.4, 0.5]}>
              <sphereGeometry args={[0.05, 8, 8]} />
              <meshStandardMaterial color="red" emissive="red" emissiveIntensity={1} />
            </mesh>
            
            {/* Legs */}
            <mesh castShadow position={[0.3, 0.2, 0.2]} rotation={[0, 0.3, 0.5]}>
              <cylinderGeometry args={[0.05, 0.05, 0.8]} />
              <meshStandardMaterial color={color} />
            </mesh>
            <mesh castShadow position={[-0.3, 0.2, 0.2]} rotation={[0, -0.3, -0.5]}>
              <cylinderGeometry args={[0.05, 0.05, 0.8]} />
              <meshStandardMaterial color={color} />
            </mesh>
            <mesh castShadow position={[0.3, 0.2, -0.2]} rotation={[0, -0.3, 0.5]}>
              <cylinderGeometry args={[0.05, 0.05, 0.8]} />
              <meshStandardMaterial color={color} />
            </mesh>
            <mesh castShadow position={[-0.3, 0.2, -0.2]} rotation={[0, 0.3, -0.5]}>
              <cylinderGeometry args={[0.05, 0.05, 0.8]} />
              <meshStandardMaterial color={color} />
            </mesh>
            <mesh castShadow position={[0.3, 0.2, 0]} rotation={[0, 0, 0.5]}>
              <cylinderGeometry args={[0.05, 0.05, 0.8]} />
              <meshStandardMaterial color={color} />
            </mesh>
            <mesh castShadow position={[-0.3, 0.2, 0]} rotation={[0, 0, -0.5]}>
              <cylinderGeometry args={[0.05, 0.05, 0.8]} />
              <meshStandardMaterial color={color} />
            </mesh>
            <mesh castShadow position={[0, 0.2, -0.3]} rotation={[0.5, 0, 0]}>
              <cylinderGeometry args={[0.05, 0.05, 0.6]} />
              <meshStandardMaterial color={color} />
            </mesh>
            <mesh castShadow position={[0, 0.2, 0.3]} rotation={[-0.5, 0, 0]}>
              <cylinderGeometry args={[0.05, 0.05, 0.6]} />
              <meshStandardMaterial color={color} />
            </mesh>
            
            {/* Type indicator */}
            <mesh position={[0, 1.0, 0]}>
              <sphereGeometry args={[0.15, 16, 16]} />
              <meshStandardMaterial color="red" emissive="red" emissiveIntensity={0.8} />
            </mesh>
          </group>
        ) : type === 'bee' ? (
          // Bee creature (using simple shapes)
          <group>
            {/* Body */}
            <mesh castShadow position={[0, 0.3, 0]}>
              <capsuleGeometry args={[0.2, 0.4, 8, 16]} />
              <meshStandardMaterial color={color} />
            </mesh>
            
            {/* Stripes */}
            <mesh castShadow position={[0, 0.3, 0.05]}>
              <cylinderGeometry args={[0.21, 0.21, 0.1, 16]} />
              <meshStandardMaterial color="black" />
            </mesh>
            <mesh castShadow position={[0, 0.3, -0.05]}>
              <cylinderGeometry args={[0.21, 0.21, 0.1, 16]} />
              <meshStandardMaterial color="black" />
            </mesh>
            
            {/* Head */}
            <mesh castShadow position={[0, 0.3, 0.35]}>
              <sphereGeometry args={[0.15, 16, 16]} />
              <meshStandardMaterial color="black" />
            </mesh>
            
            {/* Wing1 - with animation in useFrame */}
            <mesh castShadow position={[0.2, 0.5, 0]} rotation={[0.3, 0, Math.PI / 6]}>
              <planeGeometry args={[0.3, 0.2]} />
              <meshStandardMaterial 
                color="white" 
                transparent={true} 
                opacity={0.6} 
                side={THREE.DoubleSide} 
              />
            </mesh>
            
            {/* Wing2 */}
            <mesh castShadow position={[-0.2, 0.5, 0]} rotation={[0.3, 0, -Math.PI / 6]}>
              <planeGeometry args={[0.3, 0.2]} />
              <meshStandardMaterial 
                color="white" 
                transparent={true} 
                opacity={0.6} 
                side={THREE.DoubleSide} 
              />
            </mesh>
            
            {/* Type indicator */}
            <mesh position={[0, 0.7, 0]}>
              <sphereGeometry args={[0.1, 16, 16]} />
              <meshStandardMaterial color={color} emissive={color} emissiveIntensity={0.5} />
            </mesh>
          </group>
        ) : (
          // Default creature for any other types
          <group>
            <mesh castShadow>
              <boxGeometry args={[0.8, 0.8, 0.8]} />
              <meshStandardMaterial color={color} />
            </mesh>
            
            {/* Type indicator */}
            <mesh position={[0, 0.8, 0]}>
              <sphereGeometry args={[0.2, 16, 16]} />
              <meshStandardMaterial color={color} emissive={color} emissiveIntensity={0.5} />
            </mesh>
          </group>
        )
      )}
    </mesh>
  );
}