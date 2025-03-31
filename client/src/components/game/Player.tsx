import { useRef, useEffect, useState } from 'react';
import { useFrame, useThree } from '@react-three/fiber';
import { PointerLockControls, useKeyboardControls } from '@react-three/drei';
import * as THREE from 'three';
import { BlockType, getBlockMovementEffect, isBlockDamaging } from '../../lib/blocks';
import { useVoxelGame } from '../../lib/stores/useVoxelGame';
import { useSkills } from '../../lib/stores/useSkills';
import { useAudio } from '../../lib/stores/useAudio';

// Controls mapping
enum Controls {
  forward = 'forward',
  back = 'back',
  left = 'left',
  right = 'right',
  jump = 'jump',
  sprint = 'sprint',
  attack = 'attack',
  place = 'place'
}

export default function Player() {
  // References
  const playerRef = useRef<THREE.Group>(null);
  const controlsRef = useRef<any>(null);
  const cameraRef = useRef<THREE.PerspectiveCamera | null>(null);
  const raycasterRef = useRef<THREE.Raycaster>(new THREE.Raycaster());
  
  // Store player position in state to reduce re-renders
  // Start player closer to the ground and slightly to the side for better view of the platform
  const [position, setPosition] = useState<[number, number, number]>([2, 16, 2]);
  
  // Get game state from the store
  const blocks = useVoxelGame(state => state.blocks);
  const placeBlock = useVoxelGame(state => state.placeBlock);
  const removeBlock = useVoxelGame(state => state.removeBlock);
  const setSelectedBlock = useVoxelGame(state => state.setSelectedBlock);
  
  // Get character stats from skills
  const characterSpeed = useSkills(state => state.characterSpeed);
  const addXp = useSkills(state => state.addXp);
  
  // Get audio functions from audio store
  const playFootsteps = useAudio(state => state.playFootsteps);
  const stopFootsteps = useAudio(state => state.stopFootsteps);
  const playBlockBreakSound = useAudio(state => state.playBlockBreakSound);
  const playBlockPlaceSound = useAudio(state => state.playBlockPlaceSound);
  
  // Camera mode state from the game store
  const cameraMode = useVoxelGame(state => state.player.cameraMode);
  
  // Get the three.js camera
  const { camera } = useThree();
  
  // Store camera reference
  useEffect(() => {
    cameraRef.current = camera as THREE.PerspectiveCamera;
  }, [camera]);
  
  // Set up keyboard controls
  const forward = useKeyboardControls<Controls>(state => state.forward);
  const back = useKeyboardControls<Controls>(state => state.back);
  const left = useKeyboardControls<Controls>(state => state.left);
  const right = useKeyboardControls<Controls>(state => state.right);
  const jump = useKeyboardControls<Controls>(state => state.jump);
  const sprint = useKeyboardControls<Controls>(state => state.sprint);
  
  // Movement parameters
  const speed = 0.15 * characterSpeed; // Base movement speed
  const sprintMultiplier = 1.5; // Speed multiplier when sprinting
  const jumpForce = 0.2; // Initial upward velocity when jumping
  const gravity = 0.01; // Downward acceleration
  
  // Physics state
  const [velocity, setVelocity] = useState<THREE.Vector3>(new THREE.Vector3(0, 0, 0));
  const [grounded, setGrounded] = useState<boolean>(false);
  
  // Interaction cooldowns
  const [attackCooldown, setAttackCooldown] = useState<boolean>(false);
  const [placeCooldown, setPlaceCooldown] = useState<boolean>(false);
  
  // Animation flags
  const [swingingTool, setSwingingTool] = useState(false);
  const [attackAnimProgress, setAttackAnimProgress] = useState(0);
  
  // Player dimensions
  const playerHeight = 1.6; // Player is 1.6 blocks tall
  const eyeHeight = playerHeight * 0.9; // Eyes are slightly below the top of the head
  const playerWidth = 0.6; // Player is 0.6 blocks wide
  const playerDepth = 0.6; // Player is 0.6 blocks deep
  
  // Get block at position
  const getBlockAt = (x: number, y: number, z: number): BlockType => {
    const blockKey = `${Math.floor(x)},${Math.floor(y)},${Math.floor(z)}`;
    return blocks[blockKey] || 'air';
  };
  
  // Check collision with blocks
  const checkCollision = (position: THREE.Vector3): boolean => {
    // Check all blocks that could collide with the player
    const playerMinX = position.x - playerWidth / 2;
    const playerMaxX = position.x + playerWidth / 2;
    const playerMinY = position.y;
    const playerMaxY = position.y + playerHeight;
    const playerMinZ = position.z - playerDepth / 2;
    const playerMaxZ = position.z + playerDepth / 2;
    
    // Check all potentially colliding blocks
    for (let x = Math.floor(playerMinX); x <= Math.floor(playerMaxX); x++) {
      for (let y = Math.floor(playerMinY); y <= Math.floor(playerMaxY); y++) {
        for (let z = Math.floor(playerMinZ); z <= Math.floor(playerMaxZ); z++) {
          const blockType = getBlockAt(x, y, z);
          
          // Skip non-solid blocks
          if (blockType === 'air' || blockType === 'water') {
            continue;
          }
          
          // Simplified AABB collision check
          const blockMinX = x;
          const blockMaxX = x + 1;
          const blockMinY = y;
          const blockMaxY = y + 1;
          const blockMinZ = z;
          const blockMaxZ = z + 1;
          
          if (
            playerMaxX > blockMinX && playerMinX < blockMaxX &&
            playerMaxY > blockMinY && playerMinY < blockMaxY &&
            playerMaxZ > blockMinZ && playerMinZ < blockMaxZ
          ) {
            return true; // Collision detected
          }
        }
      }
    }
    
    return false; // No collision
  };
  
  // Handle attack (break blocks)
  const handleAttack = () => {
    if (attackCooldown) return;
    
    // Set cooldown
    setAttackCooldown(true);
    setTimeout(() => setAttackCooldown(false), 250);
    
    // Show attack animation
    setSwingingTool(true);
    setTimeout(() => setSwingingTool(false), 200);
    
    // Get the currently selected block
    const selectedBlock = useVoxelGame.getState().selectedBlock;
    if (!selectedBlock) return;
    
    const [x, y, z] = selectedBlock;
    
    // Try to remove the block
    const blockKey = `${x},${y},${z}`;
    const blockType = blocks[blockKey];
    
    if (blockType && blockType !== 'air') {
      // Remove the block
      removeBlock(x, y, z);
      
      // Play sound
      playBlockBreakSound(blockType);
      
      // Grant mining XP
      if (blockType === 'stone' || blockType === 'coal') {
        addXp('mining', 5);
      } else if (blockType === 'dirt' || blockType === 'grass' || blockType === 'sand') {
        addXp('farming', 2);
      } else if (blockType === 'wood' || blockType === 'log' || blockType === 'leaves') {
        addXp('woodcutting', 5);
      }
    }
  };
  
  // Process interactions with the world
  useEffect(() => {
    const handleMouseDown = (e: MouseEvent) => {
      if (!controlsRef.current?.isLocked) return;
      
      // Left click to break blocks
      if (e.button === 0) {
        handleAttack();
      }
    };
    
    // Add event listeners
    document.addEventListener('mousedown', handleMouseDown);
    
    // Cleanup
    return () => {
      document.removeEventListener('mousedown', handleMouseDown);
    };
  }, [attackCooldown, blocks, removeBlock, addXp, playBlockBreakSound]);
  
  // Physics and movement update
  useFrame(() => {
    if (!playerRef.current) return;
    
    // Get current position
    const [px, py, pz] = position;
    const currentPosition = new THREE.Vector3(px, py, pz);
    
    // Calculate new velocity based on input
    let xVel = 0;
    let zVel = 0;
    
    // Apply movement based on camera direction
    if (forward || back || left || right) {
      // Get camera direction
      const cameraDirection = new THREE.Vector3();
      cameraRef.current?.getWorldDirection(cameraDirection);
      
      // Flatten to XZ plane
      cameraDirection.y = 0;
      cameraDirection.normalize();
      
      // Calculate move direction
      if (forward) {
        xVel += cameraDirection.x;
        zVel += cameraDirection.z;
      }
      if (back) {
        xVel -= cameraDirection.x;
        zVel -= cameraDirection.z;
      }
      
      // Calculate right vector (perpendicular to camera direction)
      const rightVector = new THREE.Vector3(
        cameraDirection.z,
        0,
        -cameraDirection.x
      );
      
      if (right) {
        xVel += rightVector.x;
        zVel += rightVector.z;
      }
      if (left) {
        xVel -= rightVector.x;
        zVel -= rightVector.z;
      }
      
      // Normalize movement vector if moving diagonally
      const length = Math.sqrt(xVel * xVel + zVel * zVel);
      if (length > 0) {
        xVel /= length;
        zVel /= length;
      }
    }
    
    // Apply speed to movement
    let moveSpeed = sprint ? speed * sprintMultiplier : speed;
    
    xVel *= moveSpeed;
    zVel *= moveSpeed;
    
    // Update velocity
    let newVel = new THREE.Vector3(
      xVel,
      velocity.y,
      zVel
    );
    
    // Apply gravity if not grounded
    if (!grounded) {
      newVel.y -= gravity;
    } else if (jump) {
      // Jump if grounded and jump key pressed
      newVel.y = jumpForce;
      setGrounded(false);
    } else {
      // Make sure y velocity is 0 when grounded
      newVel.y = 0;
    }
    
    // Calculate new position
    const newPosition = currentPosition.clone().add(newVel);
    
    // Check for collisions in each axis separately for better movement
    // X-axis movement
    const xCollision = checkCollision(
      new THREE.Vector3(newPosition.x, currentPosition.y, currentPosition.z)
    );
    if (xCollision) {
      newPosition.x = currentPosition.x;
      newVel.x = 0;
    }
    
    // Z-axis movement
    const zCollision = checkCollision(
      new THREE.Vector3(newPosition.x, currentPosition.y, newPosition.z)
    );
    if (zCollision) {
      newPosition.z = currentPosition.z;
      newVel.z = 0;
    }
    
    // Y-axis movement
    const yCollision = checkCollision(
      new THREE.Vector3(newPosition.x, newPosition.y, newPosition.z)
    );
    if (yCollision) {
      if (newVel.y < 0) {
        // Colliding while moving down means we hit the ground
        setGrounded(true);
        
        // Move to surface of the block
        newPosition.y = Math.ceil(currentPosition.y);
      } else {
        // Colliding while moving up means we hit the ceiling
        newPosition.y = currentPosition.y;
      }
      newVel.y = 0;
    } else if (newVel.y <= 0) {
      // Check if still grounded by checking for a block below
      const groundCheck = new THREE.Vector3(
        newPosition.x,
        newPosition.y - 0.05, // Check just below feet
        newPosition.z
      );
      const stillGrounded = checkCollision(groundCheck);
      setGrounded(stillGrounded);
    }
    
    // Update position and velocity
    setPosition([newPosition.x, newPosition.y, newPosition.z]);
    setVelocity(newVel);
    
    // Play footstep sounds if moving and grounded
    const isMoving = Math.abs(newVel.x) > 0.01 || Math.abs(newVel.z) > 0.01;
    const isRunning = sprint && isMoving;
    if (isMoving && grounded) {
      playFootsteps(isMoving, isRunning, grounded, 'grass');
    } else {
      stopFootsteps();
    }
    
    // Update player mesh position
    playerRef.current.position.set(
      newPosition.x,
      newPosition.y,
      newPosition.z
    );
    
    // Update camera position
    if (cameraRef.current) {
      // Position camera at player's eye level
      cameraRef.current.position.set(
        newPosition.x,
        newPosition.y + eyeHeight,
        newPosition.z
      );
    }
  });
  
  // Return the player components
  return (
    <>
      {/* Camera controls */}
      <PointerLockControls ref={controlsRef} />
      
      {/* Player model */}
      <group ref={playerRef} position={[position[0], position[1], position[2]]}>
        {cameraMode === 'third' ? (
          // Third-person model
          <group>
            {/* Player head */}
            <mesh position={[0, playerHeight - 0.25, 0]}>
              <boxGeometry args={[0.5, 0.5, 0.5]} />
              <meshStandardMaterial color="#FFD3B4" />
            </mesh>
            
            {/* Player body */}
            <mesh position={[0, playerHeight - 0.8, 0]}>
              <boxGeometry args={[0.5, 0.6, 0.3]} />
              <meshStandardMaterial color="#2196F3" />
            </mesh>
            
            {/* Player arms */}
            <mesh position={[0.4, playerHeight - 0.8, 0]}>
              <boxGeometry args={[0.2, 0.6, 0.2]} />
              <meshStandardMaterial color="#2196F3" />
            </mesh>
            <mesh position={[-0.4, playerHeight - 0.8, 0]}>
              <boxGeometry args={[0.2, 0.6, 0.2]} />
              <meshStandardMaterial color="#2196F3" />
            </mesh>
            
            {/* Player legs */}
            <mesh position={[0.15, playerHeight - 1.45, 0]}>
              <boxGeometry args={[0.2, 0.6, 0.2]} />
              <meshStandardMaterial color="#0D47A1" />
            </mesh>
            <mesh position={[-0.15, playerHeight - 1.45, 0]}>
              <boxGeometry args={[0.2, 0.6, 0.2]} />
              <meshStandardMaterial color="#0D47A1" />
            </mesh>
          </group>
        ) : (
          // First-person view - just show the arm
          <group position={[0.4, -0.5, -0.4]} rotation={[0, 0, 0]}>
            <mesh position={[0, 0, 0]}>
              <boxGeometry args={[0.2, 0.6, 0.2]} />
              <meshStandardMaterial color="#FFD3B4" />
            </mesh>
          </group>
        )}
        
        {/* Player light */}
        <pointLight 
          position={[0, eyeHeight, 0]} 
          intensity={0.5} 
          distance={10} 
          color="#FFD700"
        />
      </group>
    </>
  );
}