import { useRef, useEffect, useState } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';

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
  const [color, setColor] = useState<string>('#ffffff');
  
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
      default:
        setColor('#FF5722');
    }
  }, [type]);
  
  // Add simple animation
  useFrame(() => {
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
        type === 'zombie' || type === 'skeleton' ? (
          // Humanoid hostiles
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