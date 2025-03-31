import React, { useRef, useMemo } from 'react';
import { useFrame } from '@react-three/fiber';
import { useTexture } from '@react-three/drei';
import * as THREE from 'three';
import { BlockType, isBlockTransparent, isBlockLightEmitter } from '../../lib/blocks';
import { useVoxelGame } from '../../lib/stores/useVoxelGame';

interface BlockProps {
  position: [number, number, number];
  type: BlockType;
  neighbors?: {
    front?: BlockType;
    back?: BlockType;
    left?: BlockType;
    right?: BlockType;
    top?: BlockType;
    bottom?: BlockType;
  };
  onClick?: (e: THREE.Intersection) => void;
  onRightClick?: (e: THREE.Intersection) => void;
  selected?: boolean;
}

// Block colors
const blockColors: Record<BlockType, string> = {
  'air': 'transparent',
  'grass': '#5db85d',
  'dirt': '#8B4513',
  'stone': '#818181',
  'sand': '#f2d398',
  'wood': '#966F33',
  'leaves': '#228B22',
  'water': '#1e90ff',
  'log': '#6d4c41',
  'stick': '#a1887f',
  'craftingTable': '#6d4c41',
  'woodenPickaxe': '#a1887f',
  'stonePickaxe': '#757575',
  'woodenAxe': '#a1887f',
  'woodenShovel': '#a1887f',
  'coal': '#2d2d2d',
  'torch': '#ffd54f',
  'ice': '#add8e6',
  'lava': '#ff4500',
  'snow': '#f5f5f5',
  'cactus': '#2e7d32',
  'glass': '#e0f7fa',
  // New block types
  'clay': '#b3b3b3',
  'obsidian': '#1a1a2e',
  'flower': '#e91e63',
  'tallGrass': '#66bb6a',
  'mushroom': '#8d6e63',
  'gravel': '#9e9e9e',
  'roseflower': '#f44336',
  'blueflower': '#2196f3',
  'pumpkin': '#ff9800',
  'melon': '#cddc39',
  'ironOre': '#b0bec5',
  'goldOre': '#ffd54f',
  'redstone': '#b71c1c',
  'diamond': '#00bcd4',
  'emerald': '#4caf50',
  'glowstone': '#ffeb3b',
  // Volcanic biome blocks
  'magmaStone': '#993300',
  'volcanicAsh': '#4d4d4d',
  'hotObsidian': '#1a0066'
};

// Function to get color with transparency
const getBlockColor = (type: BlockType): THREE.Color | null => {
  if (type === 'air') return null;
  return new THREE.Color(blockColors[type] || '#ffffff');
};

// Function to determine opacity
const getBlockOpacity = (type: BlockType): number => {
  if (type === 'air') return 0;
  if (type === 'glass' || type === 'water' || type === 'ice') return 0.7;
  if (type === 'flower' || type === 'tallGrass' || type === 'roseflower' || type === 'blueflower' || type === 'mushroom') return 1.0;
  return 1;
};

// Map block types to texture files
const getBlockTexture = (type: BlockType): string | null => {
  switch (type) {
    case 'grass': return '/textures/grass.png';
    case 'dirt': return null; // Keep dirt as a solid color for now
    case 'stone': return '/textures/asphalt.png'; // Using asphalt texture for stone
    case 'sand': return '/textures/sand.jpg';
    case 'wood': return '/textures/wood.jpg';
    case 'log': return '/textures/wood.jpg';
    default: return null;
  }
};

export default function Block({ 
  position, 
  type,
  neighbors,
  onClick,
  onRightClick,
  selected = false
}: BlockProps) {
  // Reference to the mesh
  const meshRef = useRef<THREE.Mesh>(null);
  
  // Get blood moon event state
  const bloodMoonEvent = useVoxelGame(state => state.bloodMoonEvent);
  const timeOfDay = useVoxelGame(state => state.timeOfDay);
  
  // Get texture path for this block type
  const texturePath = getBlockTexture(type);
  
  // Load texture if available
  const texture = useMemo(() => {
    if (!texturePath) return null;
    
    try {
      return useTexture(texturePath);
    } catch (error) {
      console.error(`Error loading texture: ${texturePath}`, error);
      return null;
    }
  }, [texturePath]);
  
  // Use enhanced light emitter properties
  const lightProperties = useMemo(() => {
    // Ensure bloodMoonEvent is defined before accessing its properties
    const isBloodMoonActive = bloodMoonEvent?.active || false;
    
    // Get light properties from our enhanced function
    const lightEmitter = isBlockLightEmitter(type);
    
    // Default values
    let color = new THREE.Color('#ffffff');
    let intensity = 0;
    
    if (typeof lightEmitter === 'object') {
      // Use the enhanced light properties with RGB values
      const { intensity: baseIntensity, color: baseColor } = lightEmitter;
      
      // Convert RGB array to THREE.Color
      color = new THREE.Color(baseColor[0], baseColor[1], baseColor[2]);
      
      // Apply blood moon effect
      if (isBloodMoonActive) {
        // Shift color toward red for blood moon
        color.r = Math.min(1.0, color.r * 1.3);
        color.g = Math.max(0.0, color.g * 0.7);
        color.b = Math.max(0.0, color.b * 0.5);
        
        // Increase intensity during blood moon
        intensity = baseIntensity * 1.4;
      } else {
        intensity = baseIntensity;
      }
    } else if (lightEmitter) {
      // For blocks with simple boolean light emission
      if (type === 'torch') {
        color = new THREE.Color(isBloodMoonActive ? '#ff3300' : '#ff9900');
        intensity = isBloodMoonActive ? 0.5 : 0.3;
      } else if (type === 'redstone') {
        color = new THREE.Color('#ff0000');
        intensity = 0.3;
      } else if (type === 'diamond') {
        color = new THREE.Color('#00bcd4');
        intensity = 0.3;
      } else if (type === 'emerald') {
        color = new THREE.Color('#4caf50');
        intensity = 0.3;
      } else if (type === 'volcanicAsh') {
        color = new THREE.Color('#661400');
        intensity = isBloodMoonActive ? 0.15 : 0.05; // Faint glow
      } else {
        intensity = isBloodMoonActive ? 0.4 : 0.2;
      }
    }
    
    return { emissiveColor: color, emissiveIntensity: intensity };
  }, [type, bloodMoonEvent?.active]);
  
  // Extract the emissive properties for easier access
  const emissiveColor = lightProperties.emissiveColor;
  const emissiveIntensity = lightProperties.emissiveIntensity;
  
  // Determine if block emits light
  const lightEmitter = isBlockLightEmitter(type);
  
  // Highlight the block when selected or apply lighting effects
  useFrame(() => {
    if (!meshRef.current || !(meshRef.current.material instanceof THREE.MeshStandardMaterial)) return;
    
    const material = meshRef.current.material;
    
    if (selected) {
      // Selection highlight effect overrides any other emissive properties
      const time = Date.now() * 0.001;
      const hue = (Math.sin(time) * 0.1) + 0.5;
      material.emissive = new THREE.Color(hue, hue, hue);
      material.emissiveIntensity = 0.6;
    } else if (lightEmitter) {
      // For emissive blocks, add pulsing effect at night or during blood moon
      const isNight = timeOfDay < 0.25 || timeOfDay > 0.75;
      const isBloodMoonActive = bloodMoonEvent?.active || false;
      
      // Base emissive properties
      material.emissive = emissiveColor;
      
      // Add pulsing/flickering effect to certain blocks
      if ((isNight || isBloodMoonActive) && 
          (type === 'glowstone' || type === 'torch' || type === 'lava' || 
           type === 'magmaStone' || type === 'hotObsidian' || type === 'volcanicAsh')) {
        
        const time = Date.now() * 0.001;
        
        // Enhanced pulsing parameters based on block type
        let pulseIntensity, pulseFrequency;
        
        // Special pulsing for volcanic blocks
        if (type === 'magmaStone' || type === 'hotObsidian') {
          // Lava-like slow pulsing for volcanic blocks
          pulseIntensity = isBloodMoonActive ? 0.4 : 0.2;
          pulseFrequency = 0.8; // Slower frequency for magma blocks
          
          // Add a secondary, faster flicker for magmaStone during blood moon
          if (type === 'magmaStone' && isBloodMoonActive) {
            const flicker = Math.sin(time * 8) * 0.1;
            pulseIntensity += flicker;
          }
        } else if (type === 'lava') {
          // Lava has a more dramatic, unpredictable pulsing
          pulseIntensity = isBloodMoonActive ? 0.35 : 0.25;
          // Use more complex wave pattern for lava
          const primaryWave = Math.sin(time * 1.2) * 0.6;
          const secondaryWave = Math.sin(time * 2.7) * 0.4;
          const pulse = (primaryWave + secondaryWave) * pulseIntensity;
          material.emissiveIntensity = emissiveIntensity + pulse;
          return; // Skip the standard pulsing calculation
        } else if (type === 'volcanicAsh') {
          // Subtle, barely visible pulsing for volcanic ash
          pulseIntensity = isBloodMoonActive ? 0.1 : 0.05;
          pulseFrequency = 0.5; // Very slow pulse
        } else {
          // Standard pulsing for other light-emitting blocks
          pulseIntensity = isBloodMoonActive ? 0.3 : 0.1;
          pulseFrequency = isBloodMoonActive ? 4 : 2;
        }
        
        const pulse = Math.sin(time * pulseFrequency) * pulseIntensity;
        material.emissiveIntensity = emissiveIntensity + pulse;
      } else {
        // Standard static emissive intensity for normal conditions
        material.emissiveIntensity = emissiveIntensity;
      }
    } else {
      // Non-emissive blocks
      material.emissive = new THREE.Color(0, 0, 0);
      material.emissiveIntensity = 0;
    }
  });
  
  // Skip rendering air blocks
  if (type === 'air') return null;
  
  // Get color for this block type
  const color = getBlockColor(type);
  if (!color) return null;
  
  // Get opacity
  const opacity = getBlockOpacity(type);
  const transparent = opacity < 1 || isBlockTransparent(type);
  
  // Special cases for different block types
  const renderWater = type === 'water';
  const renderFire = type === 'lava';
  const isEmissive = !!lightEmitter; // Use our enhanced light emitter function
  
  // Blood moon status for visual effects
  const isBloodMoonActive = bloodMoonEvent?.active || false;
  
  return (
    <mesh 
      ref={meshRef}
      position={position}
      castShadow
      receiveShadow
      onClick={onClick}
      onContextMenu={onRightClick}
    >
      <boxGeometry args={[1, 1, 1]} />
      <meshStandardMaterial 
        color={color} 
        transparent={transparent}
        opacity={opacity}
        // Apply texture if available
        map={texture || undefined}
        // Special material properties for different block types
        emissive={isEmissive ? emissiveColor : undefined}
        emissiveIntensity={isEmissive ? emissiveIntensity : 0}
        metalness={(type === 'stone' || type === 'stonePickaxe' || 
                   type === 'ironOre' || type === 'goldOre') ? 0.3 : 0}
        roughness={type === 'ice' || type === 'glass' ? 0.1 : 
                  type === 'diamond' || type === 'emerald' ? 0.2 : 0.8}
        wireframe={false}
      />
      
      {/* Additional elements for special block types */}
      {renderWater && (
        <mesh position={[0, -0.4, 0]} scale={[0.99, 0.2, 0.99]}>
          <boxGeometry />
          <meshStandardMaterial
            color="#1e90ff"
            transparent={true}
            opacity={0.7}
          />
        </mesh>
      )}
      
      {/* Enhanced light effects based on block type */}
      {lightEmitter && typeof lightEmitter === 'object' && (
        <pointLight 
          color={new THREE.Color(
            lightEmitter.color[0], 
            lightEmitter.color[1], 
            lightEmitter.color[2]
          ).getHex()}
          intensity={isBloodMoonActive ? 
            lightEmitter.intensity * 1.5 : 
            lightEmitter.intensity}
          distance={
            // Different light ranges for different blocks
            type === 'lava' ? 3.5 :
            type === 'glowstone' ? 5 :
            type === 'magmaStone' ? 2.5 :
            type === 'hotObsidian' ? 2 :
            type === 'volcanicAsh' ? 1 : 3
          }
          decay={2}
        />
      )}
      
      {/* Special additional flicker effect for volcanic blocks during blood moon */}
      {isBloodMoonActive && (type === 'magmaStone' || type === 'hotObsidian') && (
        <pointLight 
          color={type === 'magmaStone' ? "#ff2200" : "#990000"}
          intensity={0.2}
          distance={1}
          decay={2}
        >
          {/* Animate the point light for a flickering effect */}
          <mesh>
            <sphereGeometry args={[0.1, 8, 8]} />
            <meshBasicMaterial 
              color={type === 'magmaStone' ? "#ff2200" : "#990000"} 
              transparent={true} 
              opacity={0.0} // Invisible mesh, just for animation
            />
          </mesh>
        </pointLight>
      )}
      
      {/* Pool effect for lava */}
      {type === 'lava' && (
        <mesh position={[0, -0.3, 0]} scale={[0.95, 0.4, 0.95]}>
          <boxGeometry />
          <meshStandardMaterial
            color={isBloodMoonActive ? "#ff0000" : "#ff4500"}
            emissive={isBloodMoonActive ? "#ff0000" : "#ff4500"}
            emissiveIntensity={isBloodMoonActive ? 0.7 : 0.5}
            transparent={true}
            opacity={0.8}
          />
        </mesh>
      )}
    </mesh>
  );
}