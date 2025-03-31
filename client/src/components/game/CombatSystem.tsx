import React, { useRef, useState, useEffect } from 'react';
import { useFrame } from '@react-three/fiber';
import { useKeyboardControls, Html } from '@react-three/drei';
import * as THREE from 'three';
import { Controls } from '../../App';
import { CreatureType, getCreatureProperties } from '../../lib/creatures';
import { useVoxelGame } from '../../lib/stores/useVoxelGame';

// Attack types with durations and cooldowns
export enum AttackType {
  Quick = 'quick',
  Heavy = 'heavy',
  Special = 'special'
}

interface AttackProperties {
  damage: number;
  range: number;
  cooldown: number; // in milliseconds
  energyCost: number;
  knockback: number;
  duration: number; // in milliseconds
  hitDelay: number; // in milliseconds, delay before the attack actually hits
}

// Attack properties for different attack types
const ATTACK_PROPERTIES: Record<AttackType, AttackProperties> = {
  [AttackType.Quick]: {
    damage: 1,
    range: 3,
    cooldown: 500,
    energyCost: 5,
    knockback: 1,
    duration: 300,
    hitDelay: 150
  },
  [AttackType.Heavy]: {
    damage: 3,
    range: 3.5,
    cooldown: 1200,
    energyCost: 15,
    knockback: 3,
    duration: 800,
    hitDelay: 400
  },
  [AttackType.Special]: {
    damage: 5,
    range: 4,
    cooldown: 3000,
    energyCost: 25,
    knockback: 5,
    duration: 1000,
    hitDelay: 500
  }
};

// Weapon types with their properties
export enum WeaponType {
  Fist = 'fist',
  Sword = 'sword',
  Axe = 'axe',
  Pickaxe = 'pickaxe'
}

interface WeaponProperties {
  baseDamage: number;
  attackSpeed: number; // multiplier for cooldown (lower is faster)
  range: number; // additional range
  energyEfficiency: number; // multiplier for energy cost (lower is better)
  specialAbility?: string; // description of special ability
}

// Weapon properties
const WEAPON_PROPERTIES: Record<WeaponType, WeaponProperties> = {
  [WeaponType.Fist]: {
    baseDamage: 1,
    attackSpeed: 1.0,
    range: 0,
    energyEfficiency: 1.0
  },
  [WeaponType.Sword]: {
    baseDamage: 2,
    attackSpeed: 0.8,
    range: 0.5,
    energyEfficiency: 0.9,
    specialAbility: 'Sweep Attack: Can hit multiple enemies'
  },
  [WeaponType.Axe]: {
    baseDamage: 3,
    attackSpeed: 1.2,
    range: 0,
    energyEfficiency: 1.1,
    specialAbility: 'Critical Hit: 15% chance for double damage'
  },
  [WeaponType.Pickaxe]: {
    baseDamage: 1,
    attackSpeed: 1.3,
    range: 0,
    energyEfficiency: 1.2,
    specialAbility: 'Mining Expert: Extra damage to stone creatures'
  }
};

// Combo system
interface ComboMove {
  name: string;
  sequence: AttackType[];
  damage: number;
  range: number;
  energyCost: number;
  cooldown: number;
  effect?: string;
}

// Available combos
const AVAILABLE_COMBOS: ComboMove[] = [
  {
    name: 'Double Strike',
    sequence: [AttackType.Quick, AttackType.Quick],
    damage: 3,
    range: 3,
    energyCost: 8,
    cooldown: 1000,
    effect: 'Hits twice in rapid succession'
  },
  {
    name: 'Crushing Blow',
    sequence: [AttackType.Quick, AttackType.Heavy],
    damage: 5,
    range: 3.5,
    energyCost: 18,
    cooldown: 1500,
    effect: 'Stuns target for 2 seconds'
  },
  {
    name: 'Whirlwind',
    sequence: [AttackType.Heavy, AttackType.Heavy],
    damage: 6,
    range: 4,
    energyCost: 25,
    cooldown: 2000,
    effect: '360-degree attack hitting all nearby enemies'
  },
  {
    name: 'Finishing Move',
    sequence: [AttackType.Quick, AttackType.Quick, AttackType.Heavy],
    damage: 8,
    range: 3.5,
    energyCost: 30,
    cooldown: 3000,
    effect: 'Extra damage to low-health enemies'
  }
];

// Interface for combat feedback
export interface CombatFeedback {
  type: 'damage' | 'heal' | 'critical' | 'miss' | 'block' | 'combo';
  value: number;
  position: THREE.Vector3;
  timestamp: number;
}

interface CombatSystemProps {
  playerPosition: THREE.Vector3;
  playerRotation: THREE.Euler;
  onHitCreature?: (
    creatureId: string,
    damage: number,
    attackType: AttackType
  ) => void;
  onComboExecuted?: (combo: ComboMove) => void;
}

const CombatSystem: React.FC<CombatSystemProps> = ({
  playerPosition,
  playerRotation,
  onHitCreature,
  onComboExecuted
}) => {
  // References and state
  const attackRef = useRef<AttackType | null>(null);
  const lastAttackTime = useRef<number>(0);
  const attackCooldown = useRef<boolean>(false);
  const combo = useRef<AttackType[]>([]);
  const comboTimeout = useRef<NodeJS.Timeout | null>(null);
  const hitDetectionTimeout = useRef<NodeJS.Timeout | null>(null);
  
  // Access game state
  const updatePlayerStamina = useVoxelGame(state => state.updatePlayerStamina);

  // Track current equipped weapon
  const [currentWeapon, setCurrentWeapon] = useState<WeaponType>(WeaponType.Fist);
  
  // Track combat feedback
  const [feedbacks, setFeedbacks] = useState<CombatFeedback[]>([]);
  
  // Get keyboard controls
  const attackPressed = useKeyboardControls<Controls>(state => state.attack);
  
  // Handle attack input
  useEffect(() => {
    if (attackPressed && !attackCooldown.current) {
      // Determine attack type based on additional conditions (like holding shift for heavy attack)
      const attackType = AttackType.Quick; // Default to quick attack
      
      performAttack(attackType);
    }
  }, [attackPressed]);

  // Clean up timeouts on unmount
  useEffect(() => {
    return () => {
      if (comboTimeout.current) clearTimeout(comboTimeout.current);
      if (hitDetectionTimeout.current) clearTimeout(hitDetectionTimeout.current);
    };
  }, []);

  // Perform attack with given type
  const performAttack = (attackType: AttackType) => {
    if (attackCooldown.current) return;

    // Get attack properties with weapon modifications
    const attack = ATTACK_PROPERTIES[attackType];
    const weapon = WEAPON_PROPERTIES[currentWeapon];
    
    // Apply weapon modifiers
    const finalDamage = attack.damage * weapon.baseDamage;
    const finalRange = attack.range + weapon.range;
    const finalCooldown = attack.cooldown * weapon.attackSpeed;
    const finalEnergyCost = attack.energyCost * weapon.energyEfficiency;

    // Set attack state
    attackRef.current = attackType;
    lastAttackTime.current = Date.now();
    attackCooldown.current = true;
    
    // Use stamina/energy
    updatePlayerStamina(-finalEnergyCost);
    
    // Update combo sequence
    updateCombo(attackType);

    // Schedule hit detection after the hit delay
    hitDetectionTimeout.current = setTimeout(() => {
      detectHits(finalDamage, finalRange, attackType);
    }, attack.hitDelay);

    // Reset attack state after duration
    setTimeout(() => {
      attackRef.current = null;
    }, attack.duration);

    // Reset cooldown after cooldown period
    setTimeout(() => {
      attackCooldown.current = false;
    }, finalCooldown);
  };

  // Update combo sequence with new attack
  const updateCombo = (attackType: AttackType) => {
    // Add new attack to combo
    const newCombo = [...combo.current, attackType];
    combo.current = newCombo;
    
    // Clear previous timeout
    if (comboTimeout.current) {
      clearTimeout(comboTimeout.current);
    }
    
    // Check if the combo matches any known combos
    checkForCombo(newCombo);
    
    // Clear combo after timeout (2 seconds)
    comboTimeout.current = setTimeout(() => {
      combo.current = [];
    }, 2000);
  };

  // Check if current combo sequence matches any available combos
  const checkForCombo = (sequence: AttackType[]) => {
    // Find matching combo
    const matchedCombo = AVAILABLE_COMBOS.find(combo => 
      combo.sequence.length === sequence.length && 
      combo.sequence.every((type, index) => type === sequence[index])
    );
    
    if (matchedCombo) {
      // Execute combo
      console.log(`Executed combo: ${matchedCombo.name}`);
      
      // Add combo feedback
      addFeedback({
        type: 'combo',
        value: matchedCombo.damage,
        position: new THREE.Vector3(
          playerPosition.x,
          playerPosition.y + 2,
          playerPosition.z
        ),
        timestamp: Date.now()
      });
      
      // Call callback if provided
      if (onComboExecuted) {
        onComboExecuted(matchedCombo);
      }
      
      // Reset combo sequence
      combo.current = [];
    }
  };

  // Detect hits on creatures
  const detectHits = (damage: number, range: number, attackType: AttackType) => {
    // In a real implementation, this would check for creatures in range
    // and apply damage to them
    console.log(`Detecting hits with damage ${damage} and range ${range}`);
    
    // For demonstration, we'll just log the attack
    console.log(`Performed ${attackType} attack with ${currentWeapon}`);
    
    // Add a damage feedback
    addFeedback({
      type: Math.random() > 0.8 ? 'critical' : 'damage',
      value: damage,
      position: new THREE.Vector3(
        playerPosition.x + Math.random() * 2 - 1,
        playerPosition.y + 1.5 + Math.random(),
        playerPosition.z + Math.random() * 2 - 1
      ),
      timestamp: Date.now()
    });
  };

  // Add combat feedback
  const addFeedback = (feedback: CombatFeedback) => {
    setFeedbacks(prev => [...prev, feedback]);
    
    // Remove feedback after 2 seconds
    setTimeout(() => {
      setFeedbacks(prev => prev.filter(f => f !== feedback));
    }, 2000);
  };

  // Clean up old feedbacks
  useEffect(() => {
    const cleanupInterval = setInterval(() => {
      const now = Date.now();
      setFeedbacks(prev => 
        prev.filter(feedback => now - feedback.timestamp < 2000)
      );
    }, 1000);
    
    return () => clearInterval(cleanupInterval);
  }, []);

  return (
    <>
      {/* Debug visualization for current attack (would be replaced with actual animations) */}
      {attackRef.current && (
        <mesh 
          position={[
            playerPosition.x + Math.sin(playerRotation.y) * 1.5,
            playerPosition.y + 1,
            playerPosition.z + Math.cos(playerRotation.y) * 1.5
          ]}
        >
          <sphereGeometry args={[
            attackRef.current === AttackType.Quick ? 0.5 : 
            attackRef.current === AttackType.Heavy ? 0.8 : 1.2
          ]} />
          <meshStandardMaterial 
            color={
              attackRef.current === AttackType.Quick ? '#6699ff' : 
              attackRef.current === AttackType.Heavy ? '#ff9900' : '#ff3300'
            } 
            opacity={0.7}
            transparent
          />
        </mesh>
      )}
      
      {/* Combat feedback visualization */}
      {feedbacks.map((feedback, index) => (
        <group 
          key={`${feedback.timestamp}-${index}`}
          position={[feedback.position.x, feedback.position.y, feedback.position.z]}
        >
          {/* Text feedback */}
          <Html position={[0, 0, 0]} zIndexRange={[100, 0]}>
            <div style={{
              color: feedback.type === 'damage' ? '#ff6666' : 
                     feedback.type === 'critical' ? '#ff0000' : 
                     feedback.type === 'heal' ? '#66ff66' : 
                     feedback.type === 'combo' ? '#ffcc00' : '#ffffff',
              fontSize: feedback.type === 'critical' || feedback.type === 'combo' ? '24px' : '18px',
              fontWeight: 'bold',
              textShadow: '0 0 3px black',
              whiteSpace: 'nowrap',
              opacity: Math.max(0, 1 - (Date.now() - feedback.timestamp) / 2000),
              transform: `translateY(${-(Date.now() - feedback.timestamp) / 200}px)`
            }}>
              {feedback.type === 'damage' && `-${feedback.value}`}
              {feedback.type === 'critical' && `-${feedback.value} CRITICAL!`}
              {feedback.type === 'heal' && `+${feedback.value}`}
              {feedback.type === 'miss' && `MISS`}
              {feedback.type === 'block' && `BLOCKED`}
              {feedback.type === 'combo' && `COMBO! ${feedback.value}`}
            </div>
          </Html>
        </group>
      ))}
    </>
  );
};

export default CombatSystem;