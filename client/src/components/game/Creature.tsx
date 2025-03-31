import { useRef, useEffect, useState, Suspense } from 'react';
import { useFrame } from '@react-three/fiber';
import { useGLTF } from '@react-three/drei';
import * as THREE from 'three';
import { GLTF } from 'three-stdlib';
import { useAudio } from '../../lib/stores/useAudio';

// Preload available models
useGLTF.preload('/models/zombie.glb');

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
  leader = false
}: CreatureProps) {
  const meshRef = useRef<THREE.Mesh>(null);
  const groupRef = useRef<THREE.Group>(null);
  const [color, setColor] = useState<string>('#ffffff');
  const [modelLoaded, setModelLoaded] = useState(false);
  const [modelError, setModelError] = useState(false);
  
  // Try to load 3D model for zombie
  let zombieModel: THREE.Group | null = null;
  if (type === 'zombie') {
    try {
      const { scene } = useGLTF('/models/zombie.glb') as GLTF & {
        scene: THREE.Group;
      };
      zombieModel = scene;
      
      if (!modelLoaded) {
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
    if (groupRef.current && zombieModel) {
      // More complex animations for the 3D model
      if (animationState === 'idle') {
        // Subtle swaying for 3D model
        groupRef.current.rotation.y = rotation.y + Math.sin(Date.now() * 0.001) * 0.05;
      } else if (animationState === 'walk') {
        // Walking animation - bob up and down slightly
        groupRef.current.position.y = Math.sin(Date.now() * 0.01) * 0.05;
      } else if (animationState === 'attack') {
        // Attack animation - lunge forward slightly
        groupRef.current.position.z = Math.sin(Date.now() * 0.01) * 0.1;
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
          // Skeleton (still using fallback)
          <group>
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
          // Wraith - special Blood Moon mob with particle effects
          <group scale={[1.2, 1.2, 1.2]}>
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
            
            {/* Additional wispy elements - more volume */}
            <mesh castShadow position={[0, 0.6, 0]} rotation={[0, Math.PI / 4, 0]}>
              <coneGeometry args={[0.8, 1.8, 12]} />
              <meshStandardMaterial 
                color={color} 
                transparent={true} 
                opacity={0.3}
                emissive={color}
                emissiveIntensity={0.3}
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
            
            {/* Larger, more threatening glowing eyes */}
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