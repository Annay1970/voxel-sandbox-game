import { useRef, useEffect, useState, Suspense, useMemo } from 'react';
import { useFrame } from '@react-three/fiber';
import { useGLTF } from '@react-three/drei';
import * as THREE from 'three';
import { GLTF } from 'three-stdlib';
import { useAudio } from '../../lib/stores/useAudio';
import { useVoxelGame } from '../../lib/stores/useVoxelGame';

// Preload all creature models for faster loading
useGLTF.preload('/models/zombie.glb');
useGLTF.preload('/models/skeleton.glb');
useGLTF.preload('/models/wraith.glb');
useGLTF.preload('/models/cow.glb');
useGLTF.preload('/models/sheep.glb');
useGLTF.preload('/models/pig.glb');
useGLTF.preload('/models/chicken.glb');
useGLTF.preload('/models/bee.glb');
useGLTF.preload('/models/unicorn.glb');
useGLTF.preload('/models/pegasus.glb');
useGLTF.preload('/models/friendlyHorse.glb');
useGLTF.preload('/models/mermaid.glb');

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
  
  // Load model based on creature type
  useEffect(() => {
    // Skip loading if we already tried or got an error
    if (modelLoaded || modelError) return;
    
    // Check for model availability based on creature type
    const modelMap: Record<string, string> = {
      'zombie': '/models/zombie.glb',
      'skeleton': '/models/skeleton.glb',
      'wraith': '/models/wraith.glb',
      'cow': '/models/cow.glb',
      'sheep': '/models/sheep.glb',
      'pig': '/models/pig.glb',
      'chicken': '/models/chicken.glb',
      'bee': '/models/bee.glb',
      'unicorn': '/models/unicorn.glb',
      'pegasus': '/models/pegasus.glb',
      'friendlyHorse': '/models/friendlyHorse.glb',
      'mermaid': '/models/mermaid.glb'
    };
    
    const modelPath = modelMap[type];
    
    if (modelPath) {
      try {
        // Load the model
        const gltf = useGLTF(modelPath) as GLTF & {
          scene: THREE.Group
        };
        
        // Store the model and update state
        setModel(gltf.scene);
        setModelLoaded(true);
        console.log(`Loaded model for ${type}`);
      } catch (err) {
        console.warn(`Failed to load ${type} model, using fallback`, err);
        setModelError(true);
      }
    } else {
      // Use fallback for creatures without 3D models
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
      case 'unicorn':
        setColor('#FFFFFF'); // White for the unicorn
        break;
      case 'pegasus':
        setColor('#E0F7FA'); // Light blue-white for the pegasus
        break;
      case 'friendlyHorse':
        setColor('#F48FB1'); // Pink for the friendly horse
        break;
      case 'mermaid':
        setColor('#4DD0E1'); // Turquoise blue for the mermaid
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
      else if (type === 'cow') {
        // Cow animations
        if (animationState === 'idle') {
          // Gentle bobbing for idle cow
          groupRef.current.position.y = Math.sin(Date.now() * 0.0008) * 0.02;
          // Occasional head movement
          if (Math.sin(Date.now() * 0.0003) > 0.9) {
            groupRef.current.rotation.y = rotation.y + Math.sin(Date.now() * 0.001) * 0.1;
          }
        } else if (animationState === 'walk') {
          // Walking animation with slight head bobbing
          groupRef.current.position.y = Math.sin(Date.now() * 0.008) * 0.03;
          groupRef.current.rotation.z = Math.sin(Date.now() * 0.008) * 0.01;
        }
      }
      else if (type === 'sheep') {
        // Sheep animations
        if (animationState === 'idle') {
          // Subtle wool jiggling
          groupRef.current.scale.x = 2.0 + Math.sin(Date.now() * 0.002) * 0.01;
          groupRef.current.scale.z = 2.0 + Math.sin(Date.now() * 0.002) * 0.01;
          // Occasional head movement
          if (Math.sin(Date.now() * 0.0004) > 0.9) {
            groupRef.current.rotation.y = rotation.y + Math.sin(Date.now() * 0.002) * 0.08;
          }
        } else if (animationState === 'walk') {
          // Walking animation
          groupRef.current.position.y = Math.sin(Date.now() * 0.01) * 0.02;
        }
      }
      else if (type === 'pig') {
        // Pig animations
        if (animationState === 'idle') {
          // Subtle oinking motion
          groupRef.current.scale.y = 2.0 + Math.sin(Date.now() * 0.003) * 0.02;
          // Occasional head movement
          if (Math.sin(Date.now() * 0.0005) > 0.9) {
            groupRef.current.rotation.y = rotation.y + Math.sin(Date.now() * 0.003) * 0.1;
          }
        } else if (animationState === 'walk') {
          // Waddling animation
          groupRef.current.position.y = Math.sin(Date.now() * 0.012) * 0.03;
          groupRef.current.rotation.z = Math.sin(Date.now() * 0.012) * 0.02;
        }
      }
      else if (type === 'chicken') {
        // Chicken animations
        if (animationState === 'idle') {
          // Pecking motion
          if (Math.sin(Date.now() * 0.002) > 0.95) {
            groupRef.current.rotation.x = Math.sin(Date.now() * 0.05) * 0.1;
          } else {
            groupRef.current.rotation.x = 0;
          }
          // Random head movements
          if (Math.sin(Date.now() * 0.0007) > 0.9) {
            groupRef.current.rotation.y = rotation.y + Math.sin(Date.now() * 0.002) * 0.15;
          }
        } else if (animationState === 'walk') {
          // Waddling walk animation
          groupRef.current.position.y = Math.sin(Date.now() * 0.03) * 0.03;
          groupRef.current.rotation.z = Math.sin(Date.now() * 0.03) * 0.03;
          // Head bob while walking
          groupRef.current.rotation.x = Math.sin(Date.now() * 0.03) * 0.04;
        }
      }
      else if (type === 'bee') {
        // Bee animations - flying movement patterns
        if (animationState === 'idle') {
          // Hovering animation with wing flutter effect
          groupRef.current.position.y = Math.sin(Date.now() * 0.01) * 0.1;
          // Slight side-to-side drift
          groupRef.current.position.x = position.x + Math.sin(Date.now() * 0.005) * 0.05;
          groupRef.current.position.z = position.z + Math.cos(Date.now() * 0.005) * 0.05;
          // Gentle rotation as it hovers
          groupRef.current.rotation.y = rotation.y + Math.sin(Date.now() * 0.002) * 0.2;
          // Subtle body tilt
          groupRef.current.rotation.x = Math.sin(Date.now() * 0.01) * 0.05;
        } else if (animationState === 'walk' || animationState === 'wandering') {
          // Flying animation - more directional
          groupRef.current.position.y = position.y + Math.sin(Date.now() * 0.015) * 0.15;
          // Faster wing flutter effect when moving
          const flutterSpeed = Math.sin(Date.now() * 0.1) * 0.02;
          groupRef.current.rotation.z = flutterSpeed;
          // Forward-backward tilt while flying
          groupRef.current.rotation.x = Math.sin(Date.now() * 0.02) * 0.1;
        } else if (animationState === 'attack') {
          // Aggressive darting attack motion
          groupRef.current.position.z = position.z + Math.sin(Date.now() * 0.04) * 0.2;
          // More aggressive rotation
          groupRef.current.rotation.y = rotation.y + Math.sin(Date.now() * 0.04) * 0.3;
          // Sharper vertical movement for attacking
          groupRef.current.position.y = position.y + Math.sin(Date.now() * 0.04) * 0.1;
        }
      }
      // Unicorn animations
      else if (type === 'unicorn') {
        if (animationState === 'idle') {
          // Gentle, majestic movement for idle unicorn
          groupRef.current.position.y = Math.sin(Date.now() * 0.0008) * 0.03;
          // Occasional head movement
          if (Math.sin(Date.now() * 0.0003) > 0.9) {
            groupRef.current.rotation.y = rotation.y + Math.sin(Date.now() * 0.001) * 0.1;
          }
          // Subtle horn glow effect - scale slightly
          if (groupRef.current.children[0]) {
            const hornScale = 1.0 + Math.sin(Date.now() * 0.002) * 0.02;
            // Apply subtle scale pulsing to horn area
            groupRef.current.scale.set(2.0, 2.0 * hornScale, 2.0);
          }
        } else if (animationState === 'walk') {
          // Graceful walking animation
          groupRef.current.position.y = Math.sin(Date.now() * 0.01) * 0.05;
          // Slight head bobbing while walking
          groupRef.current.rotation.x = Math.sin(Date.now() * 0.01) * 0.02;
        } else if (animationState === 'attack') {
          // Horn-based attack animation
          groupRef.current.position.z = Math.sin(Date.now() * 0.02) * 0.2;
          // Aggressive head movement during attack
          groupRef.current.rotation.x = Math.sin(Date.now() * 0.03) * 0.15;
        }
        
        // Add glowing horn effect
        const hornGlow = new THREE.PointLight('#FFD700', 0.8 + Math.sin(Date.now() * 0.003) * 0.2, 3);
        hornGlow.position.set(0, 1.5, -0.5); // Position at the horn
        if (!groupRef.current.children.find(child => child.type === 'PointLight')) {
          groupRef.current.add(hornGlow);
        }
      }
      // Pegasus animations
      else if (type === 'pegasus') {
        if (animationState === 'idle') {
          // Hovering effect for pegasus
          groupRef.current.position.y = Math.sin(Date.now() * 0.002) * 0.08;
          // Wing movement simulation
          groupRef.current.rotation.z = Math.sin(Date.now() * 0.004) * 0.03;
          // Occasional head movement
          if (Math.sin(Date.now() * 0.0004) > 0.9) {
            groupRef.current.rotation.y = rotation.y + Math.sin(Date.now() * 0.002) * 0.12;
          }
        } else if (animationState === 'walk') {
          // Flying animation for pegasus
          groupRef.current.position.y = Math.sin(Date.now() * 0.008) * 0.15;
          // Wing flapping - more pronounced when flying
          groupRef.current.rotation.z = Math.sin(Date.now() * 0.02) * 0.1;
          // Smooth forward movement
          groupRef.current.position.z = position.z + Math.sin(Date.now() * 0.01) * 0.05;
        } else if (animationState === 'attack') {
          // Dive attack animation
          groupRef.current.position.y = position.y + Math.sin(Date.now() * 0.03) * 0.2;
          groupRef.current.rotation.x = Math.sin(Date.now() * 0.03) * 0.2;
          groupRef.current.position.z = position.z + Math.sin(Date.now() * 0.04) * 0.25;
        }
        
        // Add subtle air effects around wings
        if (animationState === 'walk' && Math.random() > 0.95) {
          // Occasionally add wind particle effects for flying
          // This is simplified since we don't have a particle system yet
          const windEffect = new THREE.PointLight('#FFFFFF', 0.2, 1);
          windEffect.position.set(
            Math.random() * 0.5 - 0.25, 
            Math.random() * 0.2 + 0.8, 
            Math.random() * 0.5 - 0.25
          );
          groupRef.current.add(windEffect);
          // Remove after a short time
          setTimeout(() => {
            groupRef.current?.remove(windEffect);
          }, 200);
        }
      }
      // Friendly Horse animations
      else if (type === 'friendlyHorse') {
        if (animationState === 'idle') {
          // Happy, bouncy movement for the friendly horse
          groupRef.current.position.y = Math.sin(Date.now() * 0.003) * 0.05;
          // Occasional head movement - more animated and playful
          if (Math.sin(Date.now() * 0.0005) > 0.8) {
            groupRef.current.rotation.y = rotation.y + Math.sin(Date.now() * 0.004) * 0.15;
            groupRef.current.rotation.z = Math.sin(Date.now() * 0.01) * 0.03;
          }
        } else if (animationState === 'walk') {
          // Playful walking/hopping animation
          groupRef.current.position.y = Math.sin(Date.now() * 0.015) * 0.08;
          // Slight head bobbing while walking - more pronounced
          groupRef.current.rotation.x = Math.sin(Date.now() * 0.015) * 0.04;
          // Slight side-to-side movement
          groupRef.current.position.x = position.x + Math.sin(Date.now() * 0.01) * 0.03;
        } else if (animationState === 'attack') {
          // Friendly "attack" is more playful - like nuzzling
          groupRef.current.position.z = Math.sin(Date.now() * 0.03) * 0.1;
          groupRef.current.rotation.x = Math.sin(Date.now() * 0.02) * 0.1;
          // Slight happy bounce
          groupRef.current.position.y = position.y + 0.05 + Math.sin(Date.now() * 0.04) * 0.05;
        }
        
        // Add playful sparkle effects
        if (Math.random() > 0.97) {
          const sparkleEffect = new THREE.PointLight('#FF69B4', 0.5, 1);
          sparkleEffect.position.set(
            Math.random() * 0.8 - 0.4, 
            Math.random() * 0.8 + 0.5, 
            Math.random() * 0.8 - 0.4
          );
          groupRef.current.add(sparkleEffect);
          // Remove after a short time
          setTimeout(() => {
            groupRef.current?.remove(sparkleEffect);
          }, 300);
        }
      }
      // Mermaid animations
      else if (type === 'mermaid') {
        if (animationState === 'idle') {
          // Smooth swimming motion for idle mermaid
          groupRef.current.position.y = position.y + Math.sin(Date.now() * 0.002) * 0.06;
          // Gentle tail swaying
          groupRef.current.rotation.z = Math.sin(Date.now() * 0.002) * 0.05;
          // Occasional looking around
          if (Math.sin(Date.now() * 0.0004) > 0.9) {
            groupRef.current.rotation.y = rotation.y + Math.sin(Date.now() * 0.003) * 0.2;
          }
        } else if (animationState === 'swim') {
          // More active swimming animation
          groupRef.current.position.y = position.y + Math.sin(Date.now() * 0.01) * 0.1;
          // Strong tail swaying
          groupRef.current.rotation.z = Math.sin(Date.now() * 0.01) * 0.1;
          // Some side-to-side movement
          groupRef.current.position.x = position.x + Math.sin(Date.now() * 0.008) * 0.05;
        } else if (animationState === 'attack') {
          // Rock throwing attack animation
          // Prepare and throw motion
          groupRef.current.rotation.x = Math.sin(Date.now() * 0.03) * 0.15;
          
          // Arm motion simulation - move back then forward
          const throwPhase = (Date.now() % 2000) / 2000; // 0-1 cycle over 2 seconds
          
          if (throwPhase < 0.5) {
            // Wind up
            groupRef.current.position.z = position.z - throwPhase * 0.2;
          } else {
            // Throw forward
            groupRef.current.position.z = position.z - 0.1 + (throwPhase - 0.5) * 0.3;
            
            // Create and throw rock at the peak of the forward motion
            if (throwPhase > 0.8 && throwPhase < 0.85 && Math.random() > 0.7) {
              // Visual indication of rock throwing - briefly flash
              const rockEffect = new THREE.PointLight('#A9A9A9', 0.3, 2);
              rockEffect.position.set(0, 0.5, 1); // Position in front
              groupRef.current.add(rockEffect);
              
              // Remove rock effect after a short time
              setTimeout(() => {
                groupRef.current?.remove(rockEffect);
              }, 150);
            }
          }
        } else if (animationState === 'flee') {
          // Rapid swimming away animation
          groupRef.current.position.y = position.y + Math.sin(Date.now() * 0.03) * 0.15;
          // Frantic tail movement
          groupRef.current.rotation.z = Math.sin(Date.now() * 0.04) * 0.15;
          // Erratic movement
          groupRef.current.position.x = position.x + Math.sin(Date.now() * 0.02) * 0.08;
          groupRef.current.rotation.y = rotation.y + Math.sin(Date.now() * 0.015) * 0.1;
        }
        
        // Add subtle water ripple effects occasionally
        if (animationState === 'swim' || animationState === 'attack') {
          if (Math.random() > 0.95) {
            const rippleEffect = new THREE.PointLight('#4FC3F7', 0.3, 1.5);
            rippleEffect.position.set(
              Math.random() * 0.4 - 0.2, 
              -0.2, // Below the mermaid where the tail would be
              Math.random() * 0.4 - 0.2
            );
            groupRef.current.add(rippleEffect);
            
            // Fade out ripple effect
            setTimeout(() => {
              groupRef.current?.remove(rippleEffect);
            }, 250);
          }
        }
      }
    }
  });
  
  // Show health bar if creature has health less than max and is not at full health
  const showHealthBar = showHealth && health < maxHealth;
  
  // Health bar width calculation
  const healthPercent = Math.max(0, Math.min(1, health / maxHealth));
  
  // Get Blood Moon event state for wraith visuals
  const bloodMoonEvent = useVoxelGame(state => state.bloodMoonEvent);
  
  // Special effects for wraith during Blood Moon
  const wraithColor = useMemo(() => {
    if (type === 'wraith') {
      return bloodMoonEvent.active ? '#FF2222' : '#9C27B0';
    }
    return color;
  }, [type, color, bloodMoonEvent.active]);
  
  // Intensity of glow for wraith
  const wraithGlowIntensity = useMemo(() => {
    if (type === 'wraith') {
      return bloodMoonEvent.active ? 1.2 : 0.8;
    }
    return 0.5;
  }, [type, bloodMoonEvent.active]);
  
  // Use a placeholder mesh for all creatures (simpler for now)
  return (
    <mesh 
      ref={meshRef}
      position={[position.x, position.y + 0.5, position.z]} // Add offset to Y to place creatures on ground
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
      
      {type === 'cow' || type === 'pig' || type === 'sheep' || type === 'chicken' || type === 'bee' || 
       type === 'unicorn' || type === 'pegasus' || type === 'friendlyHorse' ? (
        // Passive mobs with 3D models if available
        <group>
          {modelLoaded && model ? (
            <Suspense fallback={
              // Fallback to simple model while loading
              <mesh castShadow>
                <boxGeometry args={[0.8, 0.6, 1.0]} />
                <meshStandardMaterial color={color} />
              </mesh>
            }>
              <group ref={groupRef}>
                <primitive 
                  object={model.clone()} 
                  scale={[2.0, 2.0, 2.0]} 
                  position={[0, -0.7, 0]}
                  rotation={[0, Math.PI - rotation.y, 0]} 
                  castShadow 
                />
              </group>
            </Suspense>
          ) : type === 'bee' ? (
            // Fallback if model fails to load with bee-specific rendering
              // Bee with rounded head and body
              <>
                {/* Main body - ellipsoid shape */}
                <mesh castShadow position={[0, 0.5, 0]}>
                  <sphereGeometry args={[0.6, 16, 16]} />
                  <meshStandardMaterial color={color} />
                </mesh>
                
                {/* Secondary body segment */}
                <mesh castShadow position={[0, 0.5, -0.3]}>
                  <sphereGeometry args={[0.5, 16, 16]} />
                  <meshStandardMaterial color={color} />
                </mesh>
                
                {/* Head - rounded */}
                <mesh castShadow position={[0, 0.5, 0.6]}>
                  <sphereGeometry args={[0.4, 16, 16]} />
                  <meshStandardMaterial color={color} />
                </mesh>
                
                {/* Bee features - eyes */}
                <mesh castShadow position={[0.15, 0.55, 0.85]}>
                  <sphereGeometry args={[0.05, 8, 8]} />
                  <meshStandardMaterial color="black" />
                </mesh>
                <mesh castShadow position={[-0.15, 0.55, 0.85]}>
                  <sphereGeometry args={[0.05, 8, 8]} />
                  <meshStandardMaterial color="black" />
                </mesh>
                
                {/* Wings */}
                <mesh castShadow position={[0.4, 0.8, 0]} rotation={[0.3, 0.2, 0.5]}>
                  <planeGeometry args={[0.6, 0.3]} />
                  <meshStandardMaterial color="#FFFFFF" transparent opacity={0.7} side={THREE.DoubleSide} />
                </mesh>
                <mesh castShadow position={[-0.4, 0.8, 0]} rotation={[0.3, -0.2, -0.5]}>
                  <planeGeometry args={[0.6, 0.3]} />
                  <meshStandardMaterial color="#FFFFFF" transparent opacity={0.7} side={THREE.DoubleSide} />
                </mesh>
                
                {/* Stripes */}
                <mesh castShadow position={[0, 0.5, -0.1]}>
                  <torusGeometry args={[0.62, 0.05, 16, 32, Math.PI]} />
                  <meshStandardMaterial color="#000000" />
                </mesh>
                <mesh castShadow position={[0, 0.5, 0.1]}>
                  <torusGeometry args={[0.62, 0.05, 16, 32, Math.PI]} />
                  <meshStandardMaterial color="#000000" />
                </mesh>
              </>
            ) : (
              // Standard animal model
              <>
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
                
                {/* Head - more rounded */}
                <mesh castShadow position={[0, 0.8, -0.7]}>
                  <sphereGeometry args={[0.3, 16, 16]} />
                  <meshStandardMaterial color={color} />
                </mesh>
                
                {/* Animal features - eyes */}
                <mesh castShadow position={[0.1, 0.9, -0.9]}>
                  <sphereGeometry args={[0.05, 8, 8]} />
                  <meshStandardMaterial color="black" />
                </mesh>
                <mesh castShadow position={[-0.1, 0.9, -0.9]}>
                  <sphereGeometry args={[0.05, 8, 8]} />
                  <meshStandardMaterial color="black" />
                </mesh>
              </>
            )}
          
          {/* Type indicator (label) */}
          <mesh position={[0, 1.2, 0]}>
            <sphereGeometry args={[0.2, 16, 16]} />
            <meshStandardMaterial color={color} emissive={color} emissiveIntensity={0.5} />
          </mesh>
        </group>
      ) : (
        // Hostile mobs - different shapes
        type === 'zombie' || type === 'mermaid' ? (
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
                    position={[0, -0.7, 0]}
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
                
                {/* Head - rounded for zombie */}
                <mesh castShadow position={[0, 1.5, 0]}>
                  <sphereGeometry args={[0.3, 16, 16]} />
                  <meshStandardMaterial color={color} />
                </mesh>
                
                {/* Zombie features - eyes and mouth */}
                <mesh castShadow position={[0.1, 1.55, 0.25]}>
                  <sphereGeometry args={[0.05, 8, 8]} />
                  <meshStandardMaterial color="red" emissive="red" emissiveIntensity={0.5} />
                </mesh>
                <mesh castShadow position={[-0.1, 1.55, 0.25]}>
                  <sphereGeometry args={[0.05, 8, 8]} />
                  <meshStandardMaterial color="red" emissive="red" emissiveIntensity={0.5} />
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
                    position={[0, -0.7, 0]}
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
                
                {/* Skeleton features - glowing eyes */}
                <mesh castShadow position={[0.1, 1.55, 0.25]}>
                  <sphereGeometry args={[0.05, 8, 8]} />
                  <meshStandardMaterial color="#00FFFF" emissive="#00FFFF" emissiveIntensity={0.8} />
                </mesh>
                <mesh castShadow position={[-0.1, 1.55, 0.25]}>
                  <sphereGeometry args={[0.05, 8, 8]} />
                  <meshStandardMaterial color="#00FFFF" emissive="#00FFFF" emissiveIntensity={0.8} />
                </mesh>
                <mesh castShadow position={[-0.2, -0.5, 0]}>
                  <boxGeometry args={[0.2, 0.6, 0.2]} />
                  <meshStandardMaterial color={color} />
                </mesh>
                
                {/* Head - rounded */}
                <mesh castShadow position={[0, 1.5, 0]}>
                  <sphereGeometry args={[0.3, 16, 16]} />
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
                    position={[0, -0.7, 0]}
                    rotation={[0, Math.PI - rotation.y, 0]} 
                    castShadow 
                  />
                </group>
                
                {/* Add ghostly glow effect */}
                <pointLight
                  position={[0, 0.5, 0]}
                  distance={bloodMoonEvent.active ? 6 : 4}
                  intensity={wraithGlowIntensity}
                  color={wraithColor}
                />
                
                {/* Additional blood moon effects for wraith */}
                {bloodMoonEvent.active && (
                  <>
                    <pointLight
                      position={[0, 1.0, 0]}
                      distance={3}
                      intensity={0.8}
                      color="#FF2222"
                    />
                    <mesh position={[0, 0, 0]}>
                      <sphereGeometry args={[1.8, 16, 16]} />
                      <meshStandardMaterial 
                        color="#FF0000" 
                        opacity={0.2} 
                        transparent={true}
                        emissive="#FF0000"
                        emissiveIntensity={0.3}
                      />
                    </mesh>
                  </>
                )}
              </Suspense>
            ) : (
              // Fallback if model fails to load - simple ghostly figure
              <group>
                {/* Ghostly body */}
                <mesh castShadow position={[0, 0.5, 0]}>
                  <boxGeometry args={[0.6, 1.2, 0.3]} />
                  <meshStandardMaterial 
                    color={wraithColor} 
                    opacity={bloodMoonEvent.active ? 0.7 : 0.6} 
                    transparent={true} 
                    emissive={wraithColor} 
                    emissiveIntensity={bloodMoonEvent.active ? 0.5 : 0.3} 
                  />
                </mesh>
                
                {/* Head */}
                <mesh castShadow position={[0, 1.4, 0]}>
                  <sphereGeometry args={[0.4, 16, 16]} />
                  <meshStandardMaterial 
                    color={wraithColor} 
                    opacity={bloodMoonEvent.active ? 0.8 : 0.7} 
                    transparent={true} 
                    emissive={wraithColor} 
                    emissiveIntensity={bloodMoonEvent.active ? 0.6 : 0.4} 
                  />
                </mesh>
                
                {/* Ghostly glow */}
                <pointLight
                  position={[0, 0.8, 0]}
                  distance={bloodMoonEvent.active ? 5 : 3}
                  intensity={wraithGlowIntensity}
                  color={wraithColor}
                />
                
                {/* Additional blood moon effects */}
                {bloodMoonEvent.active && (
                  <mesh position={[0, 0.8, 0]}>
                    <sphereGeometry args={[1.5, 16, 16]} />
                    <meshStandardMaterial 
                      color="#FF0000" 
                      opacity={0.15} 
                      transparent={true}
                      emissive="#FF0000"
                      emissiveIntensity={0.2}
                    />
                  </mesh>
                )}
              </group>
            )}
            
            {/* Type indicator (bigger and specially colored for the wraith) */}
            <mesh position={[0, 2.2, 0]}>
              <sphereGeometry args={[bloodMoonEvent.active ? 0.4 : 0.3, 16, 16]} />
              <meshStandardMaterial 
                color={bloodMoonEvent.active ? "#FF2222" : "#FF00FF"} 
                emissive={bloodMoonEvent.active ? "#FF2222" : "#FF00FF"} 
                emissiveIntensity={bloodMoonEvent.active ? 2.0 : 1.5} 
                opacity={0.8} 
                transparent={true} 
              />
            </mesh>
            
            {/* Additional Blood Moon indicator for wraith */}
            {bloodMoonEvent.active && (
              <mesh position={[0, 2.7, 0]}>
                <sphereGeometry args={[0.2, 16, 16]} />
                <meshStandardMaterial 
                  color="#FFFF00" 
                  emissive="#FFFF00" 
                  emissiveIntensity={1.8} 
                  opacity={0.9} 
                  transparent={true} 
                />
              </mesh>
            )}
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