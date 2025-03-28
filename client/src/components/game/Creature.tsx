import { useRef, useState, useEffect } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';
import { CreatureType } from '../../lib/creatures';

interface CreatureProps {
  type: CreatureType;
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
  animationSpeed = 0.5,
  animationProgress = 0,
  targetPosition = null,
  flockId = undefined,
  leader = false
}: CreatureProps) {
  const meshRef = useRef<THREE.Group>(null);
  const [bobOffset, setBobOffset] = useState(0);
  const [animProgress, setAnimProgress] = useState(animationProgress);
  const [isMoving, setIsMoving] = useState(false);
  const [prevPosition, setPrevPosition] = useState({ ...position });
  
  // Track whether this creature is actively animating
  const [animating, setAnimating] = useState(animationState !== 'idle');
  
  // Define color palette for the creature based on mood
  const getMoodColor = (baseColor: string, mood: string): string => {
    switch (mood) {
      case 'aggressive':
        return blendColors(baseColor, '#FF0000', 0.3); // Red tint
      case 'alert':
        return blendColors(baseColor, '#FFA500', 0.2); // Orange tint
      case 'afraid':
        return blendColors(baseColor, '#DDDDDD', 0.3); // Pale tint
      case 'playful':
        return blendColors(baseColor, '#FFFF00', 0.1); // Yellow tint
      default:
        return baseColor;
    }
  };
  
  // Helper function to blend colors
  const blendColors = (color1: string, color2: string, ratio: number): string => {
    const c1 = new THREE.Color(color1);
    const c2 = new THREE.Color(color2);
    const blended = new THREE.Color();
    
    blended.r = c1.r * (1 - ratio) + c2.r * ratio;
    blended.g = c1.g * (1 - ratio) + c2.g * ratio;
    blended.b = c1.b * (1 - ratio) + c2.b * ratio;
    
    return '#' + blended.getHexString();
  };
  
  // Effect to detect movement
  useEffect(() => {
    const dx = position.x - prevPosition.x;
    const dz = position.z - prevPosition.z;
    const isNowMoving = Math.sqrt(dx * dx + dz * dz) > 0.01;
    
    if (isNowMoving !== isMoving) {
      setIsMoving(isNowMoving);
    }
    
    setPrevPosition({ ...position });
  }, [position, prevPosition, isMoving]);
  
  // Update creature position, rotation, and animation
  useFrame((_, delta) => {
    if (!meshRef.current) return;
    
    // Update position and rotation
    meshRef.current.position.set(position.x, position.y, position.z);
    meshRef.current.rotation.y = rotation.y;
    
    // Bobbing animation for flying creatures
    if (type === 'bee') {
      const newBobOffset = Math.sin(Date.now() * 0.01) * 0.1;
      setBobOffset(newBobOffset);
      meshRef.current.position.y += newBobOffset;
    }
    
    // Update animation progress
    if (animating || isMoving) {
      let newProgress = animProgress + delta * animationSpeed;
      if (newProgress > 1) newProgress = 0;
      setAnimProgress(newProgress);
    }
    
    // Visual indicator for leader status
    const leaderCrown = meshRef.current.children.find(child => child.name === 'leader-crown');
    if (leader && !leaderCrown) {
      // Add a small crown for leaders
      const crown = new THREE.Mesh(
        new THREE.ConeGeometry(0.2, 0.3, 4),
        new THREE.MeshStandardMaterial({ color: '#FFD700' })
      );
      crown.name = 'leader-crown';
      crown.position.set(0, 1.0, 0);
      meshRef.current.add(crown);
    } else if (!leader && leaderCrown) {
      // Remove crown if no longer a leader
      meshRef.current.remove(leaderCrown);
    }
  });
  
  // Determine creature dimensions and color based on type
  let width = 0.8;
  let height = 0.8;
  let length = 0.8;
  let color = '#FFFFFF';
  let headColor = '#FFFFFF';
  
  switch (type) {
    case 'cow':
      width = 0.9;
      height = 1.3;
      length = 1.4;
      color = '#8B4513';
      headColor = '#8B4513';
      break;
    case 'pig':
      width = 0.9;
      height = 0.9;
      length = 1.2;
      color = '#FFC0CB';
      headColor = '#FFC0CB';
      break;
    case 'sheep':
      width = 0.9;
      height = 1.2;
      length = 1.3;
      color = '#F5F5DC';
      headColor = '#A89F91';
      break;
    case 'chicken':
      width = 0.6;
      height = 0.7;
      length = 0.6;
      color = '#F5F5DC';
      headColor = '#FF6347';
      break;
    case 'zombie':
      width = 0.6;
      height = 1.8;
      length = 0.6;
      color = '#00A36C';
      headColor = '#2F4F4F';
      break;
    case 'skeleton':
      width = 0.6;
      height = 1.8;
      length = 0.6;
      color = '#E0E0E0';
      headColor = '#E0E0E0';
      break;
    case 'spider':
      width = 1.2;
      height = 0.5;
      length = 1.2;
      color = '#383838';
      headColor = '#383838';
      break;
    case 'bee':
      width = 0.4;
      height = 0.4;
      length = 0.6;
      color = '#FFD700';
      headColor = '#000000';
      break;
  }
  
  // Apply mood-based coloring
  const moodAdjustedColor = getMoodColor(color, mood);
  const moodAdjustedHeadColor = getMoodColor(headColor, mood);
  
  // Create animation effects based on state and animation state
  const getAnimatedPosition = (basePos: [number, number, number]): [number, number, number] => {
    if (!animating && !isMoving) return basePos;
    
    let [x, y, z] = basePos;
    
    // Apply different animations based on state and type
    if (animationState === 'walk' || isMoving) {
      // Walking animation: subtle bobbing and limb movement
      y += Math.sin(animProgress * Math.PI * 2) * 0.05;
    } else if (animationState === 'eat' || state === 'grazing') {
      // Eating animation: head moves up and down
      if (basePos[1] > height) { // Only animate the head
        y += Math.sin(animProgress * Math.PI * 4) * 0.1;
        z += Math.sin(animProgress * Math.PI * 2) * 0.05;
      }
    } else if (animationState === 'attack') {
      // Attack animation: lunging forward
      if (type === 'zombie' || type === 'skeleton' || type === 'spider') {
        z += Math.sin(animProgress * Math.PI) * 0.2;
      }
    } else if (animationState === 'sleep') {
      // Sleep animation: slight rotation
      y -= 0.1; // Lower position slightly when sleeping
    }
    
    return [x, y, z];
  };
  
  // Create simplified creature model (body + head)
  return (
    <group ref={meshRef} position={[position.x, position.y, position.z]} rotation={[0, rotation.y, 0]}>
      {/* Status indicator (for debugging) */}
      <mesh position={[0, height + 1, 0]}>
        <sphereGeometry args={[0.1, 8, 8]} />
        <meshBasicMaterial color={
          state === 'idle' ? '#AAAAAA' :
          state === 'wandering' ? '#00FF00' :
          state === 'hunting' ? '#FF0000' :
          state === 'grazing' ? '#00AAFF' :
          state === 'fleeing' ? '#FF00FF' :
          state === 'sleeping' ? '#0000FF' :
          '#FFFFFF'
        } />
      </mesh>
      
      {/* Body with animation */}
      <mesh 
        castShadow 
        position={getAnimatedPosition([0, height / 2, 0])}
        scale={
          animationState === 'sleep' ? 
            [1, 0.8, 1] : // Flattened when sleeping
            [1, 1, 1]
        }
      >
        <boxGeometry args={[width, height, length]} />
        <meshStandardMaterial color={moodAdjustedColor} />
      </mesh>
      
      {/* Head with animation */}
      <mesh 
        castShadow 
        position={getAnimatedPosition([0, height + 0.15, length / 2 - 0.05])}
        rotation={[
          animationState === 'eat' || state === 'grazing' ? 
            Math.sin(animProgress * Math.PI * 2) * 0.3 : // Head bobbing when eating
            animationState === 'sleep' ? 
              0.5 : // Head tilted down when sleeping
              0,
          0, 
          0
        ]}
      >
        <boxGeometry args={[width * 0.8, height * 0.5, length * 0.5]} />
        <meshStandardMaterial color={moodAdjustedHeadColor} />
      </mesh>
      
      {/* Add limbs for larger creatures with animation */}
      {(type === 'cow' || type === 'pig' || type === 'sheep' || 
        type === 'zombie' || type === 'skeleton') && (
        <>
          {/* Front legs with walking animation */}
          <mesh 
            castShadow 
            position={[
              width / 3, 
              height * 0.25 + (isMoving ? Math.sin(animProgress * Math.PI * 2 + Math.PI) * 0.1 : 0), 
              length / 2 - 0.15
            ]}
          >
            <boxGeometry args={[width * 0.2, height * 0.5, width * 0.2]} />
            <meshStandardMaterial color={moodAdjustedColor} />
          </mesh>
          <mesh 
            castShadow 
            position={[
              -width / 3, 
              height * 0.25 + (isMoving ? Math.sin(animProgress * Math.PI * 2) * 0.1 : 0), 
              length / 2 - 0.15
            ]}
          >
            <boxGeometry args={[width * 0.2, height * 0.5, width * 0.2]} />
            <meshStandardMaterial color={moodAdjustedColor} />
          </mesh>
          
          {/* Back legs with walking animation */}
          <mesh 
            castShadow 
            position={[
              width / 3, 
              height * 0.25 + (isMoving ? Math.sin(animProgress * Math.PI * 2) * 0.1 : 0), 
              -length / 2 + 0.15
            ]}
          >
            <boxGeometry args={[width * 0.2, height * 0.5, width * 0.2]} />
            <meshStandardMaterial color={moodAdjustedColor} />
          </mesh>
          <mesh 
            castShadow 
            position={[
              -width / 3, 
              height * 0.25 + (isMoving ? Math.sin(animProgress * Math.PI * 2 + Math.PI) * 0.1 : 0), 
              -length / 2 + 0.15
            ]}
          >
            <boxGeometry args={[width * 0.2, height * 0.5, width * 0.2]} />
            <meshStandardMaterial color={moodAdjustedColor} />
          </mesh>
        </>
      )}
      
      {/* Add special features for specific creatures */}
      {type === 'spider' && (
        <>
          {/* Spider legs with animation */}
          {Array.from({ length: 4 }).map((_, i) => {
            const legAngle = isMoving ? Math.sin(animProgress * Math.PI * 4 + i * 0.5) * 0.2 : 0;
            
            return (
              <group key={`leg-right-${i}`}>
                <mesh 
                  castShadow 
                  position={[width / 2 + 0.2, height / 2, (i - 1.5) * 0.3]}
                  rotation={[legAngle, 0, 0]}
                >
                  <boxGeometry args={[0.6, 0.1, 0.1]} />
                  <meshStandardMaterial color={moodAdjustedColor} />
                </mesh>
                <mesh 
                  castShadow 
                  position={[-width / 2 - 0.2, height / 2, (i - 1.5) * 0.3]}
                  rotation={[legAngle, 0, 0]}
                >
                  <boxGeometry args={[0.6, 0.1, 0.1]} />
                  <meshStandardMaterial color={moodAdjustedColor} />
                </mesh>
              </group>
            );
          })}
        </>
      )}
      
      {type === 'chicken' && (
        <>
          {/* Chicken beak */}
          <mesh castShadow position={[0, height + 0.15, length / 2 + 0.2]}>
            <boxGeometry args={[width * 0.2, height * 0.1, length * 0.1]} />
            <meshStandardMaterial color="#FF8C00" />
          </mesh>
        </>
      )}
      
      {type === 'bee' && (
        <>
          {/* Bee wings */}
          <mesh castShadow position={[0, height / 2 + 0.2, 0]}>
            <boxGeometry args={[width * 1.5, 0.05, length * 0.5]} />
            <meshStandardMaterial color="#FFFFFF" transparent opacity={0.7} />
          </mesh>
          
          {/* Bee stripes */}
          <mesh castShadow position={[0, height / 2, -length * 0.1]}>
            <boxGeometry args={[width, height, length * 0.2]} />
            <meshStandardMaterial color="#000000" />
          </mesh>
        </>
      )}
    </group>
  );
}
