import React, { useRef, useMemo } from 'react';
import { useFrame } from '@react-three/fiber';
import { useTexture } from '@react-three/drei';
import * as THREE from 'three';
import { BlockType, isBlockTransparent } from '../../lib/blocks';
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
  'glowstone': '#ffeb3b'
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
  
  // Emissive color based on block type and blood moon status
  const emissiveColor = useMemo(() => {
    if (type === 'glowstone') {
      return bloodMoonEvent.active ? new THREE.Color('#ff2200') : new THREE.Color('#ffeb3b');
    } else if (type === 'lava') {
      return new THREE.Color(bloodMoonEvent.active ? '#ff0000' : '#ff2000');
    } else if (type === 'torch') {
      return new THREE.Color(bloodMoonEvent.active ? '#ff3300' : '#ff9900');
    } else if (type === 'redstone') {
      return new THREE.Color('#ff0000');
    } else if (type === 'diamond') {
      return new THREE.Color('#00bcd4');
    } else if (type === 'emerald') {
      return new THREE.Color('#4caf50');
    } else {
      return new THREE.Color('#ffffff');
    }
  }, [type, bloodMoonEvent.active]);
  
  // Enhanced emission during blood moon
  const emissiveIntensity = useMemo(() => {
    if (!bloodMoonEvent.active) {
      return type === 'lava' ? 0.5 : type === 'glowstone' ? 0.4 : 0.3;
    } else {
      // Increase emission during blood moon
      return type === 'lava' ? 0.7 : 
             type === 'glowstone' ? 0.6 : 
             type === 'torch' ? 0.5 : 0.3;
    }
  }, [type, bloodMoonEvent.active]);
  
  // Highlight the block when selected
  useFrame(() => {
    if (!meshRef.current || !(meshRef.current.material instanceof THREE.MeshStandardMaterial)) return;
    
    const material = meshRef.current.material;
    
    if (selected) {
      const time = Date.now() * 0.001;
      const hue = (Math.sin(time) * 0.1) + 0.5;
      material.emissive = new THREE.Color(hue, hue, hue);
    } else if (type === 'glowstone' || type === 'lava' || type === 'torch' || 
               type === 'redstone' || type === 'diamond' || type === 'emerald') {
      // For emissive blocks, add pulsing effect at night or during blood moon
      const isNight = timeOfDay < 0.25 || timeOfDay > 0.75;
      
      if ((isNight || bloodMoonEvent.active) && (type === 'glowstone' || type === 'torch' || type === 'lava')) {
        const time = Date.now() * 0.001;
        const pulseIntensity = bloodMoonEvent.active ? 0.3 : 0.1;
        const pulse = Math.sin(time * (bloodMoonEvent.active ? 4 : 2)) * pulseIntensity;
        
        material.emissive = emissiveColor;
        material.emissiveIntensity = emissiveIntensity + pulse;
      } else {
        material.emissive = emissiveColor;
        material.emissiveIntensity = emissiveIntensity;
      }
    } else {
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
  const isEmissive = type === 'lava' || type === 'torch' || type === 'redstone' || 
                  type === 'glowstone' || type === 'diamond' || type === 'emerald';
  
  // Add pulsating glow for glowstone during blood moon
  const renderGlowEffect = type === 'glowstone' && bloodMoonEvent.active;
  
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
      
      {/* Special glow effect for glowstone during blood moon */}
      {renderGlowEffect && (
        <pointLight 
          color="#ff0000"
          intensity={0.8}
          distance={5}
          decay={2}
        />
      )}
      
      {/* Special glow for lava during blood moon */}
      {type === 'lava' && bloodMoonEvent.active && (
        <pointLight 
          color="#ff3000"
          intensity={0.6}
          distance={3}
          decay={2}
        />
      )}
    </mesh>
  );
}