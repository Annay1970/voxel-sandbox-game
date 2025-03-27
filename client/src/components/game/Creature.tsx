import { useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';
import { CreatureType } from '../../lib/creatures';

interface CreatureProps {
  type: CreatureType;
  position: { x: number, y: number, z: number };
  rotation: { y: number };
}

export default function Creature({ type, position, rotation }: CreatureProps) {
  const meshRef = useRef<THREE.Group>(null);
  
  // Update creature position and rotation
  useFrame(() => {
    if (!meshRef.current) return;
    
    meshRef.current.position.set(position.x, position.y, position.z);
    meshRef.current.rotation.y = rotation.y;
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
  
  // Create simplified creature model (body + head)
  return (
    <group ref={meshRef} position={[position.x, position.y, position.z]} rotation={[0, rotation.y, 0]}>
      {/* Body */}
      <mesh castShadow position={[0, height / 2, 0]}>
        <boxGeometry args={[width, height, length]} />
        <meshStandardMaterial color={color} />
      </mesh>
      
      {/* Head */}
      <mesh castShadow position={[0, height + 0.15, length / 2 - 0.05]}>
        <boxGeometry args={[width * 0.8, height * 0.5, length * 0.5]} />
        <meshStandardMaterial color={headColor} />
      </mesh>
      
      {/* Add limbs for larger creatures */}
      {(type === 'cow' || type === 'pig' || type === 'sheep' || 
        type === 'zombie' || type === 'skeleton') && (
        <>
          {/* Front legs */}
          <mesh castShadow position={[width / 3, height * 0.25, length / 2 - 0.15]}>
            <boxGeometry args={[width * 0.2, height * 0.5, width * 0.2]} />
            <meshStandardMaterial color={color} />
          </mesh>
          <mesh castShadow position={[-width / 3, height * 0.25, length / 2 - 0.15]}>
            <boxGeometry args={[width * 0.2, height * 0.5, width * 0.2]} />
            <meshStandardMaterial color={color} />
          </mesh>
          
          {/* Back legs */}
          <mesh castShadow position={[width / 3, height * 0.25, -length / 2 + 0.15]}>
            <boxGeometry args={[width * 0.2, height * 0.5, width * 0.2]} />
            <meshStandardMaterial color={color} />
          </mesh>
          <mesh castShadow position={[-width / 3, height * 0.25, -length / 2 + 0.15]}>
            <boxGeometry args={[width * 0.2, height * 0.5, width * 0.2]} />
            <meshStandardMaterial color={color} />
          </mesh>
        </>
      )}
      
      {/* Add special features for specific creatures */}
      {type === 'spider' && (
        <>
          {/* Spider legs */}
          {Array.from({ length: 4 }).map((_, i) => (
            <group key={`leg-right-${i}`}>
              <mesh castShadow position={[width / 2 + 0.2, height / 2, (i - 1.5) * 0.3]}>
                <boxGeometry args={[0.6, 0.1, 0.1]} />
                <meshStandardMaterial color={color} />
              </mesh>
              <mesh castShadow position={[-width / 2 - 0.2, height / 2, (i - 1.5) * 0.3]}>
                <boxGeometry args={[0.6, 0.1, 0.1]} />
                <meshStandardMaterial color={color} />
              </mesh>
            </group>
          ))}
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
