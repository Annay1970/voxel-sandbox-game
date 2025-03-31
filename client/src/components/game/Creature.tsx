import { useRef, useEffect, useState, Suspense } from 'react';
import { useFrame } from '@react-three/fiber';
import { useGLTF } from '@react-three/drei';
import * as THREE from 'three';
import { GLTF } from 'three-stdlib';
import { useAudio } from '../../lib/stores/useAudio';

// Preload available models
useGLTF.preload('/models/zombie.glb');
useGLTF.preload('/models/wraith.glb');
useGLTF.preload('/models/skeleton.glb');

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
  
  // Try to load 3D models for creatures
  let zombieModel: THREE.Group | null = null;
  let wraithModel: THREE.Group | null = null;
  let skeletonModel: THREE.Group | null = null;
  const [zombieModelLoaded, setZombieModelLoaded] = useState(false);
  const [wraithModelLoaded, setWraithModelLoaded] = useState(false);
  const [skeletonModelLoaded, setSkeletonModelLoaded] = useState(false);
  
  // Load zombie model
  if (type === 'zombie') {
    try {
      const { scene } = useGLTF('/models/zombie.glb') as GLTF & {
        scene: THREE.Group;
      };
      zombieModel = scene;
      
      if (!zombieModelLoaded) {
        setZombieModelLoaded(true);
        setModelLoaded(true);
        console.log("Zombie model loaded successfully");
      }
    } catch (error) {
      if (!modelError) {
        console.warn("Failed to load zombie model, using fallback:", error);
        setModelError(true);
      }
    }
  }
  
  // Load wraith model
  if (type === 'wraith') {
    try {
      const { scene } = useGLTF('/models/wraith.glb') as GLTF & {
        scene: THREE.Group;
      };
      wraithModel = scene;
      
      if (!wraithModelLoaded) {
        setWraithModelLoaded(true);
        setModelLoaded(true);
        console.log("Wraith model loaded successfully");
      }
    } catch (error) {
      if (!modelError) {
        console.warn("Failed to load wraith model, using fallback:", error);
        setModelError(true);
      }
    }
  }
  
  // Load skeleton model
  if (type === 'skeleton') {
    try {
      const { scene } = useGLTF('/models/skeleton.glb') as GLTF & {
        scene: THREE.Group;
      };
      skeletonModel = scene;
      
      if (!skeletonModelLoaded) {
        setSkeletonModelLoaded(true);
        setModelLoaded(true);
        console.log("Skeleton model loaded successfully");
      }
    } catch (error) {
      if (!modelError) {
        console.warn("Failed to load skeleton model, using fallback:", error);
        setModelError(true);
      }
    }
  }
  
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
    if (groupRef.current) {
      // Different animations for different creature models
      if (type === 'zombie' && zombieModel) {
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
      else if (type === 'wraith' && wraithModel) {
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
      else if (type === 'skeleton' && skeletonModel) {
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
  
  // Use a placeholder mesh for all creatures (simpler for now)
  return (
    <mesh 
      ref={meshRef}
      position={[position.x, position.y + 1, position.z]} // Added +1 to Y to lift creatures up 
      rotation={[0, rotation.y, 0]}
      castShadow
      scale={1.5} // Make creatures bigger
    >
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
            {modelLoaded && zombieModel ? (
              <Suspense fallback={
                // Fallback to simple model while loading
                <mesh castShadow>
                  <boxGeometry args={[0.6, 1.6, 0.5]} />
                  <meshStandardMaterial color={color} />
                </mesh>
              }>
                <group ref={groupRef}>
                  <primitive 
                    object={zombieModel.clone()} 
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
            {modelLoaded && skeletonModel ? (
              <Suspense fallback={
                // Fallback to simple model while loading
                <mesh castShadow>
                  <boxGeometry args={[0.6, 1.6, 0.5]} />
                  <meshStandardMaterial color={color} />
                </mesh>
              }>
                <group ref={groupRef}>
                  <primitive 
                    object={skeletonModel.clone()} 
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
        ) : type === 'spider' ? (
          // Spider
          <group>
            {/* Body */}
            <mesh castShadow position={[0, 0.3, 0]}>
              <sphereGeometry args={[0.4, 16, 16]} />
              <meshStandardMaterial color={color} />
            </mesh>
            
            {/* Head */}
            <mesh castShadow position={[0, 0.6, 0.3]}>
              <sphereGeometry args={[0.3, 16, 16]} />
              <meshStandardMaterial color={color} />
            </mesh>
            
            {/* Spider legs */}
            {[0, 1, 2, 3].map((i) => (
              <group key={`right-leg-${i}`}>
                <mesh castShadow position={[0.5, 0.3, 0.3 - i * 0.2]}>
                  <boxGeometry args={[0.5, 0.1, 0.1]} />
                  <meshStandardMaterial color={color} />
                </mesh>
                <mesh castShadow position={[0.9, 0.1, 0.3 - i * 0.2]}>
                  <boxGeometry args={[0.3, 0.1, 0.1]} />
                  <meshStandardMaterial color={color} />
                </mesh>
              </group>
            ))}
            {[0, 1, 2, 3].map((i) => (
              <group key={`left-leg-${i}`}>
                <mesh castShadow position={[-0.5, 0.3, 0.3 - i * 0.2]}>
                  <boxGeometry args={[0.5, 0.1, 0.1]} />
                  <meshStandardMaterial color={color} />
                </mesh>
                <mesh castShadow position={[-0.9, 0.1, 0.3 - i * 0.2]}>
                  <boxGeometry args={[0.3, 0.1, 0.1]} />
                  <meshStandardMaterial color={color} />
                </mesh>
              </group>
            ))}
            
            {/* Type indicator */}
            <mesh position={[0, 0.8, 0]}>
              <sphereGeometry args={[0.2, 16, 16]} />
              <meshStandardMaterial color="purple" emissive="purple" emissiveIntensity={1} />
            </mesh>
          </group>
        ) : type === 'wraith' ? (
          // Wraith - special Blood Moon mob
          <group scale={[1.2, 1.2, 1.2]}>
            {modelLoaded && wraithModel ? (
              <Suspense fallback={
                // Fallback to simple model while loading
                <mesh castShadow>
                  <boxGeometry args={[0.6, 1.6, 0.5]} />
                  <meshStandardMaterial 
                    color={color} 
                    transparent={true} 
                    opacity={0.7} 
                    emissive={color}
                    emissiveIntensity={1.0} 
                  />
                </mesh>
              }>
                <group ref={groupRef}>
                  <primitive 
                    object={wraithModel.clone()} 
                    scale={[2.5, 2.5, 2.5]} 
                    position={[0, -1.5, 0]}
                    rotation={[0, Math.PI - rotation.y, 0]} 
                    castShadow 
                  />
                </group>
                
                {/* Add additional particle effects and glow to the 3D model */}
                <pointLight
                  position={[0, 0.5, 0]}
                  distance={5}
                  intensity={2.0}
                  color="#9C27B0"
                />
                
                <pointLight
                  position={[0, 1.3, 0.2]}
                  distance={3}
                  intensity={1.2}
                  color="#FF0000"
                />
                
                {/* Blood Moon indicator with animated glow */}
                <mesh position={[0, 2.0, 0]}>
                  <sphereGeometry args={[0.3, 16, 16]} />
                  <meshStandardMaterial 
                    color="#FF0000" 
                    emissive="#FF0000" 
                    emissiveIntensity={2 + Math.sin(animationProgress * Math.PI * 2)}
                  />
                </mesh>
              </Suspense>
            ) : (
              // Fallback if model fails to load - simpler ghostly wraith
              <group>
                {/* Main ghostly floating body */}
                <mesh castShadow position={[0, 0.9, 0]}>
                  <boxGeometry args={[0.6, 1.5, 0.3]} />
                  <meshStandardMaterial 
                    color={color} 
                    transparent={true} 
                    opacity={0.7} 
                    emissive={color}
                    emissiveIntensity={1.0}
                  />
                </mesh>
                
                {/* Wispy cloak elements */}
                <mesh castShadow position={[0, 0.7, 0.1]}>
                  <coneGeometry args={[0.8, 2.0, 12]} />
                  <meshStandardMaterial 
                    color={color} 
                    transparent={true} 
                    opacity={0.4}
                    emissive={color}
                    emissiveIntensity={0.5}
                    side={THREE.DoubleSide}
                  />
                </mesh>
                
                {/* Ghostly arms */}
                <group position={[0, 0.7, 0]}>
                  {/* Right arm */}
                  <mesh castShadow position={[0.6, 0.2, 0]}>
                    <boxGeometry args={[0.2, 0.8, 0.2]} />
                    <meshStandardMaterial 
                      color={color} 
                      transparent={true} 
                      opacity={0.6}
                      emissive={color}
                      emissiveIntensity={0.3}
                    />
                  </mesh>
                  
                  {/* Left arm */}
                  <mesh castShadow position={[-0.6, 0.2, 0]}>
                    <boxGeometry args={[0.2, 0.8, 0.2]} />
                    <meshStandardMaterial 
                      color={color} 
                      transparent={true} 
                      opacity={0.6}
                      emissive={color}
                      emissiveIntensity={0.3}
                    />
                  </mesh>
                </group>
                
                {/* Glowing eyes */}
                <mesh position={[0.15, 1.4, 0.2]}>
                  <sphereGeometry args={[0.1, 16, 16]} />
                  <meshStandardMaterial color="#FF0000" emissive="#FF0000" emissiveIntensity={3} />
                </mesh>
                <mesh position={[-0.15, 1.4, 0.2]}>
                  <sphereGeometry args={[0.1, 16, 16]} />
                  <meshStandardMaterial color="#FF0000" emissive="#FF0000" emissiveIntensity={3} />
                </mesh>
                
                {/* Ethereal particle effect lights */}
                <pointLight
                  position={[0, 0.5, 0]}
                  distance={4}
                  intensity={1.8}
                  color="#9C27B0"
                />
                
                <pointLight
                  position={[0, 1.3, 0.2]}
                  distance={2}
                  intensity={1.0}
                  color="#FF0000"
                />
                
                {/* Blood Moon indicator with animated glow */}
                <mesh position={[0, 2.0, 0]}>
                  <sphereGeometry args={[0.3, 16, 16]} />
                  <meshStandardMaterial 
                    color="#FF0000" 
                    emissive="#FF0000" 
                    emissiveIntensity={2 + Math.sin(animationProgress * Math.PI * 2)}
                  />
                </mesh>
              </group>
            )}
          </group>
        ) : (
          // Default or bee
          <group>
            <mesh castShadow position={[0, 0, 0]}>
              <boxGeometry args={[0.4, 0.4, 0.6]} />
              <meshStandardMaterial color={color} />
            </mesh>
            {type === 'bee' && (
              <>
                <mesh castShadow position={[0, 0, -0.4]}>
                  <boxGeometry args={[0.2, 0.2, 0.2]} />
                  <meshStandardMaterial color="#000000" />
                </mesh>
                {/* Wings */}
                <mesh castShadow position={[0.2, 0.2, 0]}>
                  <planeGeometry args={[0.4, 0.2]} />
                  <meshStandardMaterial color="#ffffff" transparent opacity={0.8} side={THREE.DoubleSide} />
                </mesh>
                <mesh castShadow position={[-0.2, 0.2, 0]}>
                  <planeGeometry args={[0.4, 0.2]} />
                  <meshStandardMaterial color="#ffffff" transparent opacity={0.8} side={THREE.DoubleSide} />
                </mesh>
                
                {/* Type indicator */}
                <mesh position={[0, 0.6, 0]}>
                  <sphereGeometry args={[0.15, 16, 16]} />
                  <meshStandardMaterial color="yellow" emissive="yellow" emissiveIntensity={1} />
                </mesh>
              </>
            )}
          </group>
        )
      )}
      
      {/* Indicator for creature state/mood */}
      {mood === 'aggressive' && (
        <mesh position={[0, 1.2, 0]}>
          <sphereGeometry args={[0.1, 8, 8]} />
          <meshStandardMaterial color="#FF0000" emissive="#FF0000" emissiveIntensity={2} />
        </mesh>
      )}
      {mood === 'afraid' && (
        <mesh position={[0, 1.2, 0]}>
          <sphereGeometry args={[0.1, 8, 8]} />
          <meshStandardMaterial color="#FFFF00" emissive="#FFFF00" emissiveIntensity={2} />
        </mesh>
      )}
      {mood === 'playful' && (
        <mesh position={[0, 1.2, 0]}>
          <sphereGeometry args={[0.1, 8, 8]} />
          <meshStandardMaterial color="#00FF00" emissive="#00FF00" emissiveIntensity={2} />
        </mesh>
      )}
      {mood === 'frenzied' && (
        // Special Blood Moon mood indicator - more intense
        <>
          <mesh position={[0, 1.2, 0]}>
            <sphereGeometry args={[0.15, 12, 12]} />
            <meshStandardMaterial color="#FF0000" emissive="#FF0000" emissiveIntensity={4} />
          </mesh>
          <pointLight position={[0, 1.2, 0]} intensity={0.8} distance={3} color="#FF0000" />
        </>
      )}
      
      {/* Leader indicator */}
      {leader && (
        <mesh position={[0, 1.5, 0]}>
          <sphereGeometry args={[0.15, 8, 8]} />
          <meshStandardMaterial color="#FFD700" emissive="#FFD700" emissiveIntensity={2} />
        </mesh>
      )}
      
      {/* Health bar - only show if health is less than maxHealth or showHealth is explicitly true */}
      {showHealth && (health < maxHealth || showHealth) && (
        <group position={[0, 2.5, 0]}>
          {/* Health bar background */}
          <mesh position={[0, 0, 0]} scale={[1.2, 0.15, 0.05]}>
            <boxGeometry />
            <meshStandardMaterial color="#333333" />
          </mesh>
          
          {/* Health bar fill - scales based on health percentage */}
          {health > 0 && (
            <mesh 
              position={[-0.6 + (health / maxHealth * 0.6), 0, 0.05]} 
              scale={[1.2 * (health / maxHealth), 0.1, 0.05]}
            >
              <boxGeometry />
              <meshStandardMaterial 
                color={
                  health > maxHealth * 0.7 ? "#00FF00" : 
                  health > maxHealth * 0.3 ? "#FFFF00" : 
                  "#FF0000"
                } 
                emissive={
                  health > maxHealth * 0.7 ? "#00FF00" : 
                  health > maxHealth * 0.3 ? "#FFFF00" : 
                  "#FF0000"
                }
                emissiveIntensity={0.5}
              />
            </mesh>
          )}
        </group>
      )}
      
      {/* Loot bag - displayed when creature is killed */}
      {hasLoot && (
        <group position={[0, 0.1, 0]}>
          {/* Loot bag body */}
          <mesh position={[0, 0.3, 0]} rotation={[0, Math.PI / 4, 0]}>
            <boxGeometry args={[0.5, 0.5, 0.5]} />
            <meshStandardMaterial color="#8B4513" />
          </mesh>
          
          {/* Loot bag tie/top */}
          <mesh position={[0, 0.6, 0]}>
            <cylinderGeometry args={[0.1, 0.2, 0.2, 8]} />
            <meshStandardMaterial color="#FFD700" emissive="#FFD700" emissiveIntensity={0.5} />
          </mesh>
          
          {/* Loot sparkling effect */}
          <pointLight
            position={[0, 0.5, 0]}
            intensity={0.7}
            distance={2}
            color="#FFD700"
          />
        </group>
      )}
      
      {/* Add a spotlight to make creatures more visible */}
      <pointLight 
        position={[0, 2, 0]}
        intensity={0.5}
        distance={5}
        color="#ffffff"
      />
    </mesh>
  );
}