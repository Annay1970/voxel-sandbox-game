import { useRef, useEffect } from "react";
import { useFrame } from "@react-three/fiber";
import { useKeyboardControls } from "@react-three/drei";
import * as THREE from "three";
import { Group } from "three";
import { useVoxelGame, Controls, Creature } from "../../lib/stores/useVoxelGame";
import { useSkills } from "../../lib/stores/useSkills";
import { useAudio } from "../../lib/stores/useAudio";
import { isBlockSolid } from "../../lib/blocks";

const GRAVITY = 0.08;
const JUMP_FORCE = 0.4;
const PLAYER_HEIGHT = 1.8;
const PLAYER_SPEED = 0.15;
const SPRINT_MULTIPLIER = 1.6;
const PLAYER_WIDTH = 0.6;

export default function Player() {
  const position = useVoxelGame(state => state.playerPosition);
  const setPosition = useVoxelGame(state => state.setPlayerPosition);
  const velocity = useVoxelGame(state => state.playerVelocity);
  const setVelocity = useVoxelGame(state => state.setPlayerVelocity);
  const isOnGround = useVoxelGame(state => state.playerIsOnGround);
  const setIsOnGround = useVoxelGame(state => state.setPlayerIsOnGround);
  const blocks = useVoxelGame(state => state.blocks);
  const selectedBlock = useVoxelGame(state => state.selectedBlock);
  const placeBlock = useVoxelGame(state => state.placeBlock);
  const removeBlock = useVoxelGame(state => state.removeBlock);
  const creatures = useVoxelGame(state => state.creatures);
  const attackCreature = useVoxelGame(state => state.attackCreature);
  
  // Audio effects for combat
  const playHitSound = useAudio(state => state.playHit);
  
  const meshRef = useRef<THREE.Group>(null);
  const cameraRef = useRef(new THREE.Vector3());
  
  // Get control states without causing re-renders
  const [, getControls] = useKeyboardControls<Controls>();

  // Add minimal debugging only when needed
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Only log debug info when F3 is pressed
      if (e.key === 'F3') {
        const controls = getControls();
        console.log('Control state:', JSON.stringify(controls));
        console.log('Player position:', JSON.stringify(position));
        console.log('Player velocity:', JSON.stringify(velocity));
        console.log('Is on ground:', isOnGround);
        console.log('Selected block:', selectedBlock);
      }
    };
    
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [getControls, position, velocity, isOnGround, selectedBlock]);

  // Ray for block interaction
  const ray = useRef(new THREE.Raycaster(new THREE.Vector3(), new THREE.Vector3(), 0, 5));
  
  // Player movement and physics
  // Mouse movement tracking
  const deltaX = useRef(0);
  const deltaY = useRef(0);
  const cameraXRotation = useRef(0); // Vertical rotation (pitch)
  const cameraYRotation = useRef(0); // Horizontal rotation (yaw)
    
  // Mouse event handler
  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      // Only update if pointer is locked
      if (document.pointerLockElement) {
        deltaX.current += e.movementX;
        deltaY.current += e.movementY;
      }
    };
    
    // Request pointer lock on canvas click
    const handleCanvasClick = () => {
      const canvas = document.querySelector('canvas');
      if (canvas) {
        canvas.requestPointerLock();
      }
    };
    
    window.addEventListener('mousemove', handleMouseMove);
    document.addEventListener('click', handleCanvasClick);
    
    return () => {
      window.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('click', handleCanvasClick);
    };
  }, []);
    
  useFrame(({ camera }) => {
    if (!meshRef.current) return;
    
    const controls = getControls();
    
    // Update camera rotation based on mouse movement (Minecraft-style)
    if (document.pointerLockElement) {
      // Update horizontal and vertical rotation with Minecraft-like sensitivity
      cameraYRotation.current += deltaX.current * 0.003; // Horizontal (yaw)
      cameraXRotation.current -= deltaY.current * 0.003; // Vertical (pitch)
      
      // Limit vertical look angle to Minecraft-like range
      cameraXRotation.current = Math.max(-Math.PI / 2.2, Math.min(Math.PI / 2.2, cameraXRotation.current));
      
      // Reset deltas
      deltaX.current = 0;
      deltaY.current = 0;
    }
    
    // Calculate movement direction
    let moveX = 0;
    let moveZ = 0;
    
    if (controls.forward) moveZ -= 1;
    if (controls.backward) moveZ += 1;
    if (controls.left) moveX -= 1;
    if (controls.right) moveX += 1;
    
    // Normalize diagonal movement (Minecraft doesn't actually normalize, but it's smoother)
    if (moveX !== 0 && moveZ !== 0) {
      moveX *= 0.7071; // 1/sqrt(2)
      moveZ *= 0.7071;
    }
    
    // Get character speed from skills system
    const characterSpeed = useSkills(state => state.characterSpeed);
    
    // Apply sprint multiplier and character skill speed
    const speedMultiplier = (controls.sprint ? SPRINT_MULTIPLIER : 1) * characterSpeed;
    
    // Calculate movement in camera direction
    const direction = new THREE.Vector3(moveX, 0, moveZ)
      .normalize()
      .multiplyScalar(PLAYER_SPEED * speedMultiplier);
    
    // Use our tracked camera rotation instead of extracting from matrix
    const yRotation = cameraYRotation.current;
    
    // Apply camera rotation to movement
    const rotatedDirection = new THREE.Vector3(
      direction.x * Math.cos(yRotation) + direction.z * Math.sin(yRotation),
      0,
      direction.z * Math.cos(yRotation) - direction.x * Math.sin(yRotation)
    );
    
    // Apply movement to velocity
    const newVelocity = {...velocity};
    newVelocity.x = rotatedDirection.x;
    newVelocity.z = rotatedDirection.z;
    
    // Apply gravity
    if (!isOnGround) {
      newVelocity.y -= GRAVITY;
    }
    
    // Apply jumping
    if (controls.jump && isOnGround) {
      newVelocity.y = JUMP_FORCE;
      setIsOnGround(false);
      console.log("Player jumped");
    }
    
    // Update velocity
    setVelocity(newVelocity);
    
    // Check for collisions and update position
    const newPosition = {
      x: position.x + newVelocity.x,
      y: position.y + newVelocity.y,
      z: position.z + newVelocity.z
    };
    
    // Simple collision detection with blocks
    const playerBox = {
      minX: newPosition.x - PLAYER_WIDTH / 2,
      maxX: newPosition.x + PLAYER_WIDTH / 2,
      minY: newPosition.y,
      maxY: newPosition.y + PLAYER_HEIGHT,
      minZ: newPosition.z - PLAYER_WIDTH / 2,
      maxZ: newPosition.z + PLAYER_WIDTH / 2
    };
    
    // Check for collisions with blocks
    let collisionX = false;
    let collisionY = false;
    let collisionZ = false;
    
    // Get blocks in player vicinity
    const checkRadius = 2;
    const blockKeys = Object.keys(blocks);
    
    for (const key of blockKeys) {
      const [bx, by, bz] = key.split(',').map(Number);
      
      // Skip blocks that are too far
      if (
        Math.abs(bx - position.x) > checkRadius ||
        Math.abs(by - position.y) > checkRadius ||
        Math.abs(bz - position.z) > checkRadius
      ) {
        continue;
      }
      
      // Skip non-solid blocks
      if (!isBlockSolid(blocks[key])) {
        continue;
      }
      
      // Block bounds
      const blockBox = {
        minX: bx - 0.5,
        maxX: bx + 0.5,
        minY: by - 0.5,
        maxY: by + 0.5,
        minZ: bz - 0.5,
        maxZ: bz + 0.5
      };
      
      // Check X collision
      if (
        playerBox.maxY > blockBox.minY &&
        playerBox.minY < blockBox.maxY &&
        playerBox.maxZ > blockBox.minZ &&
        playerBox.minZ < blockBox.maxZ &&
        playerBox.maxX > blockBox.minX &&
        playerBox.minX < blockBox.maxX
      ) {
        const fromRight = Math.abs(playerBox.maxX - blockBox.minX);
        const fromLeft = Math.abs(playerBox.minX - blockBox.maxX);
        
        if (fromRight < fromLeft) {
          newPosition.x = blockBox.minX - PLAYER_WIDTH / 2;
        } else {
          newPosition.x = blockBox.maxX + PLAYER_WIDTH / 2;
        }
        
        collisionX = true;
        newVelocity.x = 0;
      }
      
      // Check Z collision
      if (
        playerBox.maxY > blockBox.minY &&
        playerBox.minY < blockBox.maxY &&
        playerBox.maxX > blockBox.minX &&
        playerBox.minX < blockBox.maxX &&
        playerBox.maxZ > blockBox.minZ &&
        playerBox.minZ < blockBox.maxZ
      ) {
        const fromFront = Math.abs(playerBox.maxZ - blockBox.minZ);
        const fromBack = Math.abs(playerBox.minZ - blockBox.maxZ);
        
        if (fromFront < fromBack) {
          newPosition.z = blockBox.minZ - PLAYER_WIDTH / 2;
        } else {
          newPosition.z = blockBox.maxZ + PLAYER_WIDTH / 2;
        }
        
        collisionZ = true;
        newVelocity.z = 0;
      }
      
      // Check Y collision (ground/ceiling)
      if (
        playerBox.maxX > blockBox.minX &&
        playerBox.minX < blockBox.maxX &&
        playerBox.maxZ > blockBox.minZ &&
        playerBox.minZ < blockBox.maxZ &&
        playerBox.maxY > blockBox.minY &&
        playerBox.minY < blockBox.maxY
      ) {
        // Coming from above (ground)
        if (newVelocity.y < 0 && position.y > by) {
          newPosition.y = blockBox.maxY;
          newVelocity.y = 0;
          setIsOnGround(true);
        } 
        // Coming from below (ceiling)
        else if (newVelocity.y > 0) {
          newPosition.y = blockBox.minY - PLAYER_HEIGHT;
          newVelocity.y = 0;
        }
        
        collisionY = true;
      }
    }
    
    // Check if player is still on ground
    if (!collisionY && isOnGround) {
      // Cast a short ray downward to check if there's still ground
      ray.current.set(
        new THREE.Vector3(position.x, position.y - 0.1, position.z),
        new THREE.Vector3(0, -1, 0)
      );
      
      let stillOnGround = false;
      for (const key of blockKeys) {
        const [bx, by, bz] = key.split(',').map(Number);
        
        // Skip blocks that are too far or non-solid
        if (
          Math.abs(bx - position.x) > 1 ||
          Math.abs(by - position.y) > 1 ||
          Math.abs(bz - position.z) > 1 ||
          !isBlockSolid(blocks[key])
        ) {
          continue;
        }
        
        // Simple ground check
        if (
          position.x > bx - 0.5 - PLAYER_WIDTH / 2 &&
          position.x < bx + 0.5 + PLAYER_WIDTH / 2 &&
          position.z > bz - 0.5 - PLAYER_WIDTH / 2 &&
          position.z < bz + 0.5 + PLAYER_WIDTH / 2 &&
          position.y - 0.1 < by + 0.5 &&
          position.y > by
        ) {
          stillOnGround = true;
          break;
        }
      }
      
      if (!stillOnGround) {
        setIsOnGround(false);
      }
    }
    
    // Update velocity with collision results
    setVelocity(newVelocity);
    
    // Update position
    setPosition(newPosition);
    
    // Update mesh position
    meshRef.current.position.set(newPosition.x, newPosition.y, newPosition.z);
    
    // Set true first-person position (Minecraft-style)
    cameraRef.current.set(
      newPosition.x,
      newPosition.y + PLAYER_HEIGHT - 0.2, // Eye level (slightly below player height)
      newPosition.z
    );

    // Set camera to exactly match player's head position (first-person view)
    camera.position.copy(cameraRef.current);
    
    // Apply rotations (pitch and yaw) to camera directly
    camera.rotation.order = 'YXZ'; // This order matches Minecraft's camera rotation
    camera.rotation.y = -cameraYRotation.current; // Yaw (horizontal)
    camera.rotation.x = cameraXRotation.current; // Pitch (vertical)
    
    // Block interaction (mine/place)
    if (controls.mine || controls.place) {
      // Set ray origin to player camera position
      // Get ray direction from camera direction
      const direction = new THREE.Vector3(0, 0, -1);  // Forward vector
      direction.applyQuaternion(camera.quaternion);   // Apply camera rotation
      
      ray.current.set(
        cameraRef.current,
        direction
      );
      
      // Iterate through nearby blocks to check for ray intersection
      let closestBlockDist = Infinity;
      let closestBlockPos = null;
      let closestBlockNormal = null;
      
      for (const key of blockKeys) {
        const [bx, by, bz] = key.split(',').map(Number);
        
        // Skip blocks that are too far
        if (
          Math.abs(bx - position.x) > 5 ||
          Math.abs(by - position.y) > 5 ||
          Math.abs(bz - position.z) > 5 ||
          !isBlockSolid(blocks[key])
        ) {
          continue;
        }
        
        // Create a box for the block
        const blockBox = new THREE.Box3(
          new THREE.Vector3(bx - 0.5, by - 0.5, bz - 0.5),
          new THREE.Vector3(bx + 0.5, by + 0.5, bz + 0.5)
        );
        
        // Check for intersection
        const intersection = ray.current.ray.intersectBox(blockBox, new THREE.Vector3());
        
        if (intersection) {
          const distance = intersection.distanceTo(ray.current.ray.origin);
          
          if (distance < closestBlockDist) {
            closestBlockDist = distance;
            closestBlockPos = { x: bx, y: by, z: bz };
            
            // Calculate normal based on intersection point
            const normal = { x: 0, y: 0, z: 0 };
            const eps = 0.001;
            
            if (Math.abs(intersection.x - (bx - 0.5)) < eps) normal.x = -1;
            else if (Math.abs(intersection.x - (bx + 0.5)) < eps) normal.x = 1;
            else if (Math.abs(intersection.y - (by - 0.5)) < eps) normal.y = -1;
            else if (Math.abs(intersection.y - (by + 0.5)) < eps) normal.y = 1;
            else if (Math.abs(intersection.z - (bz - 0.5)) < eps) normal.z = -1;
            else if (Math.abs(intersection.z - (bz + 0.5)) < eps) normal.z = 1;
            
            closestBlockNormal = normal;
          }
        }
      }
      
      // Get skill actions for updating skills
      const addXp = useSkills(state => state.addXp);
      
      // Handle block interaction
      if (closestBlockPos) {
        if (controls.mine) {
          // Determine block type for appropriate skill gain
          const blockType = blocks[`${closestBlockPos.x},${closestBlockPos.y},${closestBlockPos.z}`];
          
          // Remove the block
          removeBlock(closestBlockPos.x, closestBlockPos.y, closestBlockPos.z);
          console.log(`Removed block at ${closestBlockPos.x},${closestBlockPos.y},${closestBlockPos.z}`);
          
          // Award XP based on block type
          if (blockType === 'stone' || blockType === 'coal') {
            // Mining skill for stone-type blocks
            addXp('mining', 10);
            console.log('Gained mining XP!');
          } else if (blockType === 'wood' || blockType === 'log' || blockType === 'leaves') {
            // Woodcutting skill for wood-type blocks
            addXp('woodcutting', 10);
            console.log('Gained woodcutting XP!');
          } else if (blockType === 'grass' || blockType === 'dirt') {
            // Farming skill for earth-type blocks
            addXp('farming', 5);
            console.log('Gained farming XP!');
          }
        } else if (controls.place && closestBlockNormal) {
          // Place a block adjacent to the hit face
          const newBlockPos = {
            x: closestBlockPos.x + closestBlockNormal.x,
            y: closestBlockPos.y + closestBlockNormal.y,
            z: closestBlockPos.z + closestBlockNormal.z
          };
          
          // Don't place a block if the player is inside it
          const blockPlayerCollision = (
            newBlockPos.x > playerBox.minX && newBlockPos.x < playerBox.maxX &&
            newBlockPos.y > playerBox.minY && newBlockPos.y < playerBox.maxY &&
            newBlockPos.z > playerBox.minZ && newBlockPos.z < playerBox.maxZ
          );
          
          if (!blockPlayerCollision) {
            placeBlock(newBlockPos.x, newBlockPos.y, newBlockPos.z, selectedBlock);
            console.log(`Placed block at ${newBlockPos.x},${newBlockPos.y},${newBlockPos.z}`);
            
            // Award building XP for placing blocks
            addXp('building', 5);
            console.log('Gained building XP!');
          }
        }
      }
    }
    
    // Combat functionality
    if (controls.attack) {
      // Set ray origin to player camera position for attacking
      // Get ray direction from camera direction
      const direction = new THREE.Vector3(0, 0, -1);  // Forward vector
      direction.applyQuaternion(camera.quaternion);   // Apply camera rotation
      
      ray.current.set(
        cameraRef.current,
        direction
      );
      
      // Detect creatures in attack range
      const creatureIds = Object.keys(creatures);
      let closestCreatureDist = Infinity;
      let closestCreatureId = null;
      
      for (const creatureId of creatureIds) {
        const creature = creatures[creatureId];
        
        // Skip creatures that are too far (basic distance check)
        const distanceToCreature = Math.sqrt(
          Math.pow(position.x - creature.position.x, 2) +
          Math.pow(position.y - creature.position.y, 2) +
          Math.pow(position.z - creature.position.z, 2)
        );
        
        if (distanceToCreature > 5) continue; // Skip if too far
        
        // Create a simple bounding box for the creature
        const creatureBox = new THREE.Box3(
          new THREE.Vector3(
            creature.position.x - 0.5,
            creature.position.y - 0.5,
            creature.position.z - 0.5
          ),
          new THREE.Vector3(
            creature.position.x + 0.5,
            creature.position.y + 1.0, // Taller than wide
            creature.position.z + 0.5
          )
        );
        
        // Check for ray intersection with creature
        const intersection = ray.current.ray.intersectBox(creatureBox, new THREE.Vector3());
        
        if (intersection) {
          const distance = intersection.distanceTo(ray.current.ray.origin);
          
          if (distance < closestCreatureDist) {
            closestCreatureDist = distance;
            closestCreatureId = creatureId;
          }
        }
      }
      
      // Attack the closest creature if one was found
      if (closestCreatureId) {
        console.log(`Attacking creature ${closestCreatureId}`);
        
        // Attack creature and get success result
        const attackSuccess = attackCreature(closestCreatureId);
        
        if (attackSuccess) {
          // Play hit sound on successful attack
          playHitSound();
          
          // Grant combat XP when successfully attacking
          const addXp = useSkills(state => state.addXp);
          addXp('combat', 15);
          console.log('Gained combat XP!');
        }
      }
    }
  });
  
  // Get character growth values from skill system
  const characterSize = useSkills(state => state.characterSize);
  const characterSpeed = useSkills(state => state.characterSpeed);

  // Apply character growth modifications
  const sizeScale = characterSize; // Grows with skill level
  
  // Visual indicator effects for player skills
  const miningLevel = useSkills(state => state.skills.mining.level);
  const combatLevel = useSkills(state => state.skills.combat.level);
  const woodcuttingLevel = useSkills(state => state.skills.woodcutting.level);
  
  // Custom colors based on skill levels (representing equipment/strength)
  const bodyColor = combatLevel > 5 ? '#4444FF' : combatLevel > 2 ? '#3370d4' : '#666699';
  const armColor = miningLevel > 5 ? '#FF2222' : miningLevel > 2 ? '#3370d4' : '#666699';
  const legColor = woodcuttingLevel > 5 ? '#22FF22' : woodcuttingLevel > 2 ? '#0e4690' : '#666699';
  
  // Visual effects based on skill levels
  const hasHeadgear = combatLevel >= 10;
  const hasArmGuards = miningLevel >= 10;
  const hasLegGuards = woodcuttingLevel >= 10;
  
  // Aura particles for higher level players
  const hasAura = miningLevel + combatLevel + woodcuttingLevel >= 15;
  
  return (
    <group ref={meshRef} position={[position.x, position.y, position.z]} scale={[sizeScale, sizeScale, sizeScale]}>
      {/* Player body - scales with level */}
      <mesh position={[0, PLAYER_HEIGHT / 2, 0]}>
        <boxGeometry args={[PLAYER_WIDTH, PLAYER_HEIGHT * 0.6, PLAYER_WIDTH]} />
        <meshStandardMaterial color={bodyColor} />
      </mesh>
      
      {/* Player head with optional headgear based on combat level */}
      <group position={[0, PLAYER_HEIGHT * 0.8, 0]}>
        <mesh>
          <boxGeometry args={[PLAYER_WIDTH * 0.8, PLAYER_HEIGHT * 0.25, PLAYER_WIDTH * 0.8]} />
          <meshStandardMaterial color="#ffb385" />
        </mesh>
        
        {/* Helmet for high combat level */}
        {hasHeadgear && (
          <mesh position={[0, 0.05, 0]}>
            <boxGeometry args={[PLAYER_WIDTH * 0.9, PLAYER_HEIGHT * 0.08, PLAYER_WIDTH * 0.9]} />
            <meshStandardMaterial color="#CCCCFF" metalness={0.8} roughness={0.2} />
          </mesh>
        )}
      </group>
      
      {/* Player arms with mining skill indicators */}
      <group position={[PLAYER_WIDTH * 0.7, PLAYER_HEIGHT * 0.5, 0]}>
        <mesh>
          <boxGeometry args={[PLAYER_WIDTH * 0.3, PLAYER_HEIGHT * 0.5, PLAYER_WIDTH * 0.3]} />
          <meshStandardMaterial color={armColor} />
        </mesh>
        
        {/* Arm guards for high mining level */}
        {hasArmGuards && (
          <mesh position={[0, -0.1, 0]}>
            <boxGeometry args={[PLAYER_WIDTH * 0.4, PLAYER_HEIGHT * 0.2, PLAYER_WIDTH * 0.4]} />
            <meshStandardMaterial color="#CC4444" metalness={0.6} roughness={0.3} />
          </mesh>
        )}
      </group>
      
      <group position={[-PLAYER_WIDTH * 0.7, PLAYER_HEIGHT * 0.5, 0]}>
        <mesh>
          <boxGeometry args={[PLAYER_WIDTH * 0.3, PLAYER_HEIGHT * 0.5, PLAYER_WIDTH * 0.3]} />
          <meshStandardMaterial color={armColor} />
        </mesh>
        
        {/* Arm guards for high mining level */}
        {hasArmGuards && (
          <mesh position={[0, -0.1, 0]}>
            <boxGeometry args={[PLAYER_WIDTH * 0.4, PLAYER_HEIGHT * 0.2, PLAYER_WIDTH * 0.4]} />
            <meshStandardMaterial color="#CC4444" metalness={0.6} roughness={0.3} />
          </mesh>
        )}
      </group>
      
      {/* Player legs with woodcutting skill indicators */}
      <group position={[PLAYER_WIDTH * 0.3, PLAYER_HEIGHT * 0.15, 0]}>
        <mesh>
          <boxGeometry args={[PLAYER_WIDTH * 0.3, PLAYER_HEIGHT * 0.3, PLAYER_WIDTH * 0.3]} />
          <meshStandardMaterial color={legColor} />
        </mesh>
        
        {/* Leg guards for high woodcutting level */}
        {hasLegGuards && (
          <mesh position={[0, -0.1, 0]}>
            <boxGeometry args={[PLAYER_WIDTH * 0.35, PLAYER_HEIGHT * 0.15, PLAYER_WIDTH * 0.35]} />
            <meshStandardMaterial color="#44CC44" metalness={0.4} roughness={0.4} />
          </mesh>
        )}
      </group>
      
      <group position={[-PLAYER_WIDTH * 0.3, PLAYER_HEIGHT * 0.15, 0]}>
        <mesh>
          <boxGeometry args={[PLAYER_WIDTH * 0.3, PLAYER_HEIGHT * 0.3, PLAYER_WIDTH * 0.3]} />
          <meshStandardMaterial color={legColor} />
        </mesh>
        
        {/* Leg guards for high woodcutting level */}
        {hasLegGuards && (
          <mesh position={[0, -0.1, 0]}>
            <boxGeometry args={[PLAYER_WIDTH * 0.35, PLAYER_HEIGHT * 0.15, PLAYER_WIDTH * 0.35]} />
            <meshStandardMaterial color="#44CC44" metalness={0.4} roughness={0.4} />
          </mesh>
        )}
      </group>
      
      {/* Special aura for high level players */}
      {hasAura && (
        <mesh position={[0, PLAYER_HEIGHT / 2, 0]}>
          <sphereGeometry args={[PLAYER_WIDTH * 1.2, 16, 16]} />
          <meshStandardMaterial 
            color="#ffdd99" 
            transparent={true} 
            opacity={0.3} 
            emissive="#ffaa00"
            emissiveIntensity={0.5}
          />
        </mesh>
      )}
      
      {/* Ground marker glow under player based on highest skill */}
      <mesh position={[0, -0.4, 0]} rotation={[-Math.PI / 2, 0, 0]}>
        <planeGeometry args={[PLAYER_WIDTH * 2, PLAYER_WIDTH * 2]} />
        <meshBasicMaterial 
          color={miningLevel > combatLevel ? 
            (miningLevel > woodcuttingLevel ? "#ff6666" : "#66ff66") : 
            (combatLevel > woodcuttingLevel ? "#6666ff" : "#66ff66")
          }
          transparent={true}
          opacity={0.3}
        />
      </mesh>
      
      {/* Player collision box (invisible) */}
      <mesh position={[0, PLAYER_HEIGHT / 2, 0]} visible={false}>
        <boxGeometry args={[PLAYER_WIDTH, PLAYER_HEIGHT, PLAYER_WIDTH]} />
        <meshStandardMaterial color="#00AAFF" transparent opacity={0} />
      </mesh>
    </group>
  );
}
