import React, { useRef, useState, useEffect } from 'react';
import { useFrame } from '@react-three/fiber';
import { Html } from '@react-three/drei';
import * as THREE from 'three';
import { BlockType, getBlockHardness, getRequiredTool, getBlockDrops } from '../../lib/blocks';
import { useVoxelGame } from '../../lib/stores/useVoxelGame';

// Mining stages for block breaking animation
export enum MiningStage {
  NotStarted = 0,
  Stage1 = 1,  // 20% 
  Stage2 = 2,  // 40%
  Stage3 = 3,  // 60%
  Stage4 = 4,  // 80%
  Complete = 5 // 100%
}

// Mining effects
export enum MiningEffect {
  Normal = 'normal',
  Efficient = 'efficient',
  Fortune = 'fortune',
  SilkTouch = 'silkTouch',
  Explosive = 'explosive'
}

interface MiningEffectProperties {
  name: string;
  speedMultiplier: number;
  dropMultiplier: number;
  radius: number;
  particleColor: string;
  sound: string;
  description: string;
}

// Mining effect properties
const MINING_EFFECT_PROPERTIES: Record<MiningEffect, MiningEffectProperties> = {
  [MiningEffect.Normal]: {
    name: 'Normal',
    speedMultiplier: 1.0,
    dropMultiplier: 1.0,
    radius: 0,
    particleColor: '#FFFFFF',
    sound: 'normal_mining',
    description: 'Standard mining speed and drops'
  },
  [MiningEffect.Efficient]: {
    name: 'Efficiency',
    speedMultiplier: 1.5,
    dropMultiplier: 1.0,
    radius: 0,
    particleColor: '#00FFFF',
    sound: 'efficient_mining',
    description: 'Faster mining speed'
  },
  [MiningEffect.Fortune]: {
    name: 'Fortune',
    speedMultiplier: 0.9,
    dropMultiplier: 2.0,
    radius: 0,
    particleColor: '#FFFF00',
    sound: 'fortune_mining',
    description: 'Increased resource drops'
  },
  [MiningEffect.SilkTouch]: {
    name: 'Silk Touch',
    speedMultiplier: 0.8,
    dropMultiplier: 1.0,
    radius: 0,
    particleColor: '#FF00FF',
    sound: 'silk_touch_mining',
    description: 'Mine blocks without breaking them'
  },
  [MiningEffect.Explosive]: {
    name: 'Explosive',
    speedMultiplier: 2.0,
    dropMultiplier: 0.8,
    radius: 2,
    particleColor: '#FF0000',
    sound: 'explosive_mining',
    description: 'Mine multiple blocks at once with reduced drops'
  }
};

// Mining skill levels
export enum MiningSkillLevel {
  Novice = 0,
  Apprentice = 1,
  Adept = 2,
  Expert = 3,
  Master = 4
}

// Mining progress particle
interface MiningParticle {
  position: THREE.Vector3;
  velocity: THREE.Vector3;
  size: number;
  color: string;
  life: number;
  maxLife: number;
}

interface EnhancedMiningProps {
  targetBlock?: {
    position: [number, number, number];
    type: BlockType;
  } | null;
  toolType?: 'hand' | 'pickaxe' | 'axe' | 'shovel';
  toolLevel?: number;
  miningEffect?: MiningEffect;
  skillLevel?: MiningSkillLevel;
  onBlockMined?: (position: [number, number, number], drops: { type: BlockType, count: number }[]) => void;
  onProgress?: (position: [number, number, number], progress: number) => void;
}

const EnhancedMining: React.FC<EnhancedMiningProps> = ({
  targetBlock = null,
  toolType = 'hand',
  toolLevel = 0,
  miningEffect = MiningEffect.Normal,
  skillLevel = MiningSkillLevel.Novice,
  onBlockMined,
  onProgress
}) => {
  // Mining state
  const [miningProgress, setMiningProgress] = useState<Record<string, number>>({});
  const [miningStage, setMiningStage] = useState<Record<string, MiningStage>>({});
  const [activeMiningBlock, setActiveMiningBlock] = useState<string | null>(null);
  
  // Mining particles
  const [particles, setParticles] = useState<MiningParticle[]>([]);
  
  // Mining effects
  const [activeEffects, setActiveEffects] = useState<Record<string, MiningEffect>>({});
  
  // Get world blocks from the game store
  const { blocks, removeBlock, addPlayerHotbarItem } = useVoxelGame(state => ({
    blocks: state.blocks,
    removeBlock: state.removeBlock,
    addPlayerHotbarItem: state.addPlayerHotbarItem
  }));
  
  // References for timing
  const lastMiningTime = useRef<number>(0);
  const isMining = useRef<boolean>(false);
  
  // Target block key
  const targetBlockKey = targetBlock ? `${targetBlock.position[0]},${targetBlock.position[1]},${targetBlock.position[2]}` : null;
  
  // Reset mining progress when the target block changes
  useEffect(() => {
    if (targetBlockKey && targetBlockKey !== activeMiningBlock) {
      setActiveMiningBlock(targetBlockKey);
      if (!miningProgress[targetBlockKey]) {
        setMiningProgress(prev => ({ ...prev, [targetBlockKey]: 0 }));
        setMiningStage(prev => ({ ...prev, [targetBlockKey]: MiningStage.NotStarted }));
        setActiveEffects(prev => ({ ...prev, [targetBlockKey]: miningEffect }));
      }
    } else if (!targetBlockKey) {
      setActiveMiningBlock(null);
    }
  }, [targetBlockKey, activeMiningBlock, miningProgress, miningEffect]);
  
  // Update mining progress on each frame
  useFrame((state, delta) => {
    // Don't do anything if there's no target block
    if (!targetBlock || !targetBlockKey) {
      isMining.current = false;
      return;
    }
    
    // Check if the block exists in the world
    if (!blocks[targetBlockKey]) {
      isMining.current = false;
      return;
    }
    
    // Set mining flag
    isMining.current = true;
    
    // Get block properties
    const blockType = targetBlock.type;
    const blockHardness = getBlockHardness(blockType);
    const requiredTool = getRequiredTool(blockType);
    
    // Check if we have the correct tool
    const hasCorrectTool = !requiredTool.tool || requiredTool.tool === toolType;
    const hasMinLevel = toolLevel >= requiredTool.level;
    
    // Calculate mining speed based on tool, effect, and skill level
    const effectProps = MINING_EFFECT_PROPERTIES[activeEffects[targetBlockKey] || MiningEffect.Normal];
    
    // Calculate base mining speed
    let miningSpeed = 1.0;
    
    // Correct tool bonus
    if (hasCorrectTool) miningSpeed *= 2.0;
    
    // Tool level bonus
    miningSpeed *= 1.0 + (toolLevel * 0.2);
    
    // Skill level bonus
    miningSpeed *= 1.0 + (skillLevel * 0.15);
    
    // Mining effect multiplier
    miningSpeed *= effectProps.speedMultiplier;
    
    // Hardness divisor (harder blocks mine slower)
    miningSpeed /= blockHardness;
    
    // Wrong tool penalty
    if (!hasCorrectTool || !hasMinLevel) {
      miningSpeed *= 0.2;
    }
    
    // Calculate progress increment
    const progressIncrement = miningSpeed * delta;
    
    // Update mining progress
    setMiningProgress(prev => {
      const newProgress = Math.min(1, (prev[targetBlockKey] || 0) + progressIncrement);
      
      // Call progress callback
      if (onProgress) {
        onProgress(targetBlock.position, newProgress);
      }
      
      // Return updated progress
      return { ...prev, [targetBlockKey]: newProgress };
    });
    
    // Update mining stage based on progress
    updateMiningStage(targetBlockKey);
    
    // Spawn particles periodically
    const now = performance.now();
    if (now - lastMiningTime.current > 100) { // Spawn particles every 100ms
      spawnMiningParticles(
        new THREE.Vector3(
          targetBlock.position[0] + 0.5,
          targetBlock.position[1] + 0.5,
          targetBlock.position[2] + 0.5
        ),
        effectProps.particleColor
      );
      lastMiningTime.current = now;
    }
    
    // Check if mining is complete
    if (miningProgress[targetBlockKey] >= 1.0) {
      completeMining(targetBlockKey, targetBlock.position, targetBlock.type, effectProps);
    }
    
    // Update particles
    updateParticles(delta);
  });
  
  // Update mining stage based on progress
  const updateMiningStage = (blockKey: string) => {
    const progress = miningProgress[blockKey] || 0;
    let newStage: MiningStage;
    
    if (progress >= 1.0) newStage = MiningStage.Complete;
    else if (progress >= 0.8) newStage = MiningStage.Stage4;
    else if (progress >= 0.6) newStage = MiningStage.Stage3;
    else if (progress >= 0.4) newStage = MiningStage.Stage2;
    else if (progress >= 0.2) newStage = MiningStage.Stage1;
    else newStage = MiningStage.NotStarted;
    
    if (newStage !== miningStage[blockKey]) {
      setMiningStage(prev => ({ ...prev, [blockKey]: newStage }));
      console.log(`Mining stage updated to ${newStage} for block at ${blockKey}`);
    }
  };
  
  // Complete mining a block
  const completeMining = (
    blockKey: string,
    position: [number, number, number],
    blockType: BlockType,
    effectProps: MiningEffectProperties
  ) => {
    console.log(`Mining complete for block at ${blockKey}`);
    
    // Reset progress
    setMiningProgress(prev => ({ ...prev, [blockKey]: 0 }));
    setMiningStage(prev => ({ ...prev, [blockKey]: MiningStage.NotStarted }));
    
    // Get block drops
    let drops = getBlockDrops(blockType);
    
    // Apply skill and effect modifiers to drops
    if (effectProps.dropMultiplier > 1.0) {
      drops = drops.map(drop => ({
        ...drop,
        count: Math.ceil(drop.count * effectProps.dropMultiplier)
      }));
    }
    
    // Apply skill level bonus to drops
    const skillBonus = 1.0 + (skillLevel * 0.1);
    drops = drops.map(drop => ({
      ...drop,
      count: Math.ceil(drop.count * skillBonus)
    }));
    
    // Handle special case for silk touch
    if (activeEffects[blockKey] === MiningEffect.SilkTouch) {
      // Replace drops with the original block
      drops = [{ type: blockType, count: 1 }];
    }
    
    // Large particle effect for block breaking
    spawnBreakParticles(
      new THREE.Vector3(
        position[0] + 0.5,
        position[1] + 0.5,
        position[2] + 0.5
      ),
      10,
      effectProps.particleColor
    );
    
    // Handle area mining for explosive effect
    if (activeEffects[blockKey] === MiningEffect.Explosive && effectProps.radius > 0) {
      // Get blocks in area
      const radius = effectProps.radius;
      for (let x = -radius; x <= radius; x++) {
        for (let y = -radius; y <= radius; y++) {
          for (let z = -radius; z <= radius; z++) {
            if (x === 0 && y === 0 && z === 0) continue; // Skip center block (already processed)
            
            const nearbyPos: [number, number, number] = [
              position[0] + x,
              position[1] + y,
              position[2] + z
            ];
            
            const nearbyKey = `${nearbyPos[0]},${nearbyPos[1]},${nearbyPos[2]}`;
            const nearbyType = blocks[nearbyKey];
            
            if (nearbyType) {
              // Get block hardness to determine if it can be mined with explosive effect
              const nearbyHardness = getBlockHardness(nearbyType);
              
              // Only mine blocks with similar or lower hardness
              if (nearbyHardness <= blockHardness * 1.5) {
                // Remove block from world
                removeBlock(nearbyPos);
                
                // Get reduced drops for area mining
                const areaDrops = getBlockDrops(nearbyType).map(drop => ({
                  ...drop,
                  count: Math.max(1, Math.floor(drop.count * 0.6)) // Reduce drops for area mining
                }));
                
                // Add to total drops
                drops = [...drops, ...areaDrops];
                
                // Spawn particles
                spawnBreakParticles(
                  new THREE.Vector3(
                    nearbyPos[0] + 0.5,
                    nearbyPos[1] + 0.5,
                    nearbyPos[2] + 0.5
                  ),
                  5,
                  effectProps.particleColor
                );
              }
            }
          }
        }
      }
    }
    
    // Remove the block from world
    removeBlock(position);
    
    // Add drops to player inventory
    drops.forEach(drop => {
      addPlayerHotbarItem(drop.type, drop.count);
    });
    
    // Call the onBlockMined callback
    if (onBlockMined) {
      onBlockMined(position, drops);
    }
  };
  
  // Spawn mining particles
  const spawnMiningParticles = (position: THREE.Vector3, color: string, count = 2) => {
    const newParticles: MiningParticle[] = [];
    
    for (let i = 0; i < count; i++) {
      newParticles.push({
        position: position.clone().add(
          new THREE.Vector3(
            (Math.random() - 0.5) * 0.5,
            (Math.random() - 0.5) * 0.5,
            (Math.random() - 0.5) * 0.5
          )
        ),
        velocity: new THREE.Vector3(
          (Math.random() - 0.5) * 2,
          Math.random() * 3,
          (Math.random() - 0.5) * 2
        ),
        size: Math.random() * 0.1 + 0.05,
        color,
        life: 1.0,
        maxLife: 1.0
      });
    }
    
    setParticles(prev => [...prev, ...newParticles]);
  };
  
  // Spawn break particles when a block is broken
  const spawnBreakParticles = (position: THREE.Vector3, count = 10, color: string) => {
    const newParticles: MiningParticle[] = [];
    
    for (let i = 0; i < count; i++) {
      newParticles.push({
        position: position.clone(),
        velocity: new THREE.Vector3(
          (Math.random() - 0.5) * 5,
          Math.random() * 8,
          (Math.random() - 0.5) * 5
        ),
        size: Math.random() * 0.2 + 0.1,
        color,
        life: 2.0,
        maxLife: 2.0
      });
    }
    
    setParticles(prev => [...prev, ...newParticles]);
  };
  
  // Update particles
  const updateParticles = (delta: number) => {
    setParticles(prev => 
      prev
        .map(particle => ({
          ...particle,
          position: particle.position.add(
            particle.velocity.clone().multiplyScalar(delta)
          ),
          velocity: particle.velocity.add(
            new THREE.Vector3(0, -9.8, 0).multiplyScalar(delta)
          ),
          life: particle.life - delta
        }))
        .filter(particle => particle.life > 0)
    );
  };
  
  return (
    <>
      {/* Mining effects for active blocks */}
      {Object.entries(miningStage).map(([key, stage]) => {
        if (stage === MiningStage.NotStarted || !blocks[key]) return null;
        
        const [x, y, z] = key.split(',').map(Number);
        const progress = miningProgress[key] || 0;
        
        return (
          <group key={key} position={[x + 0.5, y + 0.5, z + 0.5]}>
            {/* Mining progress visualization as cracks on the block */}
            <mesh scale={[1.01, 1.01, 1.01]}>
              <boxGeometry />
              <meshBasicMaterial 
                color={MINING_EFFECT_PROPERTIES[activeEffects[key] || MiningEffect.Normal].particleColor}
                transparent
                opacity={0.2 + (progress * 0.3)}
                wireframe
              />
            </mesh>
            
            {/* Mining progress indicator */}
            <Html position={[0, 1.2, 0]} center>
              <div 
                style={{ 
                  width: '40px', 
                  height: '4px',
                  background: '#333',
                  borderRadius: '2px',
                  overflow: 'hidden'
                }}
              >
                <div 
                  style={{
                    width: `${progress * 100}%`,
                    height: '100%',
                    background: MINING_EFFECT_PROPERTIES[activeEffects[key] || MiningEffect.Normal].particleColor,
                    transition: 'width 0.1s ease-out'
                  }}
                />
              </div>
            </Html>
          </group>
        );
      })}
      
      {/* Mining particles */}
      {particles.map((particle, index) => (
        <mesh 
          key={`particle-${index}`}
          position={[particle.position.x, particle.position.y, particle.position.z]}
          scale={[particle.size, particle.size, particle.size]}
        >
          <sphereGeometry args={[1, 8, 8]} />
          <meshBasicMaterial 
            color={particle.color}
            transparent
            opacity={particle.life / particle.maxLife}
          />
        </mesh>
      ))}
    </>
  );
};

export default EnhancedMining;