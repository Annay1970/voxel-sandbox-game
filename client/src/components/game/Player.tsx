import { useRef, useEffect, useState } from 'react';
import { useFrame, useThree } from '@react-three/fiber';
import { PointerLockControls, useKeyboardControls } from '@react-three/drei';
import * as THREE from 'three';
import { BlockType } from '../../lib/blocks';
import { useVoxelGame } from '../../lib/stores/useVoxelGame';
import { useSkills } from '../../lib/stores/useSkills';

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
  const [position, setPosition] = useState<[number, number, number]>([0, 50, 0]);
  
  // Get game state from the store
  const blocks = useVoxelGame(state => state.blocks);
  const placeBlock = useVoxelGame(state => state.placeBlock);
  const removeBlock = useVoxelGame(state => state.removeBlock);
  const setSelectedBlock = useVoxelGame(state => state.setSelectedBlock);
  const inventory = useVoxelGame(state => state.inventory);
  const selectedInventorySlot = useVoxelGame(state => state.selectedInventorySlot);
  
  // Get character stats from skills
  const characterSpeed = useSkills(state => state.characterSpeed);
  const addXp = useSkills(state => state.addXp);
  
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
  const attack = useKeyboardControls<Controls>(state => state.attack);
  const place = useKeyboardControls<Controls>(state => state.place);
  
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
  
  // Get player eye height
  const playerHeight = 1.6; // Player is 1.6 blocks tall
  const eyeHeight = playerHeight * 0.9; // Eyes are slightly below the top of the head
  
  // Animation flags
  const [swingingTool, setSwingingTool] = useState(false);
  
  // Player dimensions for collision detection
  const playerWidth = 0.6; // Player is 0.6 blocks wide (3 pixels in Minecraft)
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
          // Each block is a 1x1x1 cube, so we just need to check if the player's AABB intersects
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
  
  // Process interactions with the world (attacking, placing blocks)
  useEffect(() => {
    const handleMouseDown = (e: MouseEvent) => {
      if (!controlsRef.current?.isLocked) return;
      
      // Left click to break blocks
      if (e.button === 0) {
        handleAttack();
      }
      // Right click to place blocks
      else if (e.button === 2) {
        handlePlace();
      }
    };
    
    // Set up controls for looking around
    const handleMouseMove = (e: MouseEvent) => {
      if (!controlsRef.current?.isLocked) return;
      
      // Raycast to update selected block
      updateRaycast();
    };
    
    // Raycast in the direction the player is looking
    const updateRaycast = () => {
      if (!cameraRef.current) return;
      
      const raycaster = raycasterRef.current;
      const camera = cameraRef.current;
      
      // Origin is camera position
      raycaster.set(
        camera.position, 
        new THREE.Vector3(0, 0, -1).applyQuaternion(camera.quaternion).normalize()
      );
      
      // Maximum interaction distance (5 blocks)
      raycaster.far = 5;
      
      // Check for intersections with blocks
      const [px, py, pz] = position;
      const rayOrigin = new THREE.Vector3(px, py + eyeHeight, pz);
      
      // Calculate all block positions within reach
      const nearbyBlocks: THREE.Object3D[] = [];
      for (let x = Math.floor(px - 5); x <= Math.floor(px + 5); x++) {
        for (let y = Math.floor(py - 5); y <= Math.floor(py + 5); y++) {
          for (let z = Math.floor(pz - 5); z <= Math.floor(pz + 5); z++) {
            const blockKey = `${x},${y},${z}`;
            const blockType = blocks[blockKey];
            
            // Skip air blocks for performance
            if (!blockType || blockType === 'air') {
              continue;
            }
            
            // Create a temporary object to represent this block
            const blockObj = new THREE.Mesh(
              new THREE.BoxGeometry(1, 1, 1),
              new THREE.MeshBasicMaterial()
            );
            blockObj.position.set(x + 0.5, y + 0.5, z + 0.5);
            blockObj.userData = { x, y, z, type: blockType };
            nearbyBlocks.push(blockObj);
          }
        }
      }
      
      // Find the closest intersection
      const direction = new THREE.Vector3(0, 0, -1)
        .applyQuaternion(camera.quaternion)
        .normalize();
      
      raycaster.set(rayOrigin, direction);
      const intersects = raycaster.intersectObjects(nearbyBlocks);
      
      // Clean up temporary objects
      nearbyBlocks.length = 0;
      
      if (intersects.length > 0) {
        const closest = intersects[0];
        const blockData = closest.object.userData;
        
        // Update the selected block
        setSelectedBlock([blockData.x, blockData.y, blockData.z]);
      } else {
        // No block selected
        setSelectedBlock(null);
      }
    };
    
    // Handle block breaking action
    const handleAttack = () => {
      if (attackCooldown) return;
      
      // Set cooldown
      setAttackCooldown(true);
      setTimeout(() => setAttackCooldown(false), 250); // 250ms cooldown
      
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
        
        // Grant mining XP
        if (blockType === 'stone' || blockType === 'coal') {
          addXp('mining', 5);
        } else if (blockType === 'dirt' || blockType === 'grass' || blockType === 'sand') {
          addXp('farming', 2);
        } else if (blockType === 'wood' || blockType === 'log' || blockType === 'leaves') {
          addXp('woodcutting', 5);
        }
        
        console.log(`Removed ${blockType} block at ${x},${y},${z}`);
      }
    };
    
    // Handle block placement action
    const handlePlace = () => {
      if (placeCooldown) return;
      
      // Set cooldown
      setPlaceCooldown(true);
      setTimeout(() => setPlaceCooldown(false), 250); // 250ms cooldown
      
      // Show placement animation
      setSwingingTool(true);
      setTimeout(() => setSwingingTool(false), 200);
      
      // Get the currently selected block
      const selectedBlock = useVoxelGame.getState().selectedBlock;
      if (!selectedBlock) return;
      
      const [x, y, z] = selectedBlock;
      
      // Get the block to place from inventory
      const inventorySlot = useVoxelGame.getState().selectedInventorySlot;
      const inventoryItem = useVoxelGame.getState().inventory[inventorySlot];
      
      if (!inventoryItem || inventoryItem.count <= 0) {
        console.log("No block selected in inventory");
        return;
      }
      
      // Find placement position
      const blockType = getBlockAt(x, y, z);
      if (blockType === 'air') return; // Can't place against air
      
      // Get placement face based on intersection normal
      // For simplicity, always place on the "top" face for now
      const placeX = x;
      const placeY = y + 1;
      const placeZ = z;
      
      // Check if the place position is already occupied
      if (getBlockAt(placeX, placeY, placeZ) !== 'air') {
        console.log("Cannot place block - position occupied");
        return;
      }
      
      // Place the block
      placeBlock(placeX, placeY, placeZ, inventoryItem.type as BlockType);
      
      // Grant building XP
      addXp('building', 2);
      
      console.log(`Placed ${inventoryItem.type} block at ${placeX},${placeY},${placeZ}`);
    };
    
    // Add event listeners
    document.addEventListener('mousedown', handleMouseDown);
    document.addEventListener('mousemove', handleMouseMove);
    
    // Cleanup
    return () => {
      document.removeEventListener('mousedown', handleMouseDown);
      document.removeEventListener('mousemove', handleMouseMove);
    };
  }, [position, attackCooldown, placeCooldown, blocks, removeBlock, placeBlock, setSelectedBlock, addXp]);
  
  // Set up keyboard events for inventory selection
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Number keys 1-9 select inventory slots
      if (e.key >= '1' && e.key <= '9') {
        const slot = parseInt(e.key) - 1;
        useVoxelGame.getState().setSelectedInventorySlot(slot);
      }
      
      // F key for attacking (in addition to left click)
      if (e.key === 'f' || e.key === 'F') {
        if (!attackCooldown) {
          // This simulates a left mouse click
          const event = new MouseEvent('mousedown', { button: 0 });
          document.dispatchEvent(event);
        }
      }
    };
    
    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [attackCooldown]);
  
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
    const moveSpeed = sprint ? speed * sprintMultiplier : speed;
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
    
    // Update camera and player position
    if (cameraRef.current) {
      // Position camera at player's eye level
      cameraRef.current.position.set(
        newPosition.x,
        newPosition.y + eyeHeight,
        newPosition.z
      );
    }
    
    // Update player mesh position
    playerRef.current.position.set(
      newPosition.x,
      newPosition.y,
      newPosition.z
    );
  });
  
  return (
    <>
      {/* First-person controls */}
      <PointerLockControls ref={controlsRef} />
      
      {/* Player model - invisible in first person */}
      <group ref={playerRef} position={[position[0], position[1], position[2]]}>
        {/* Player body - only visible to others or in third-person */}
        <mesh visible={false}>
          <boxGeometry args={[playerWidth, playerHeight, playerDepth]} />
          <meshStandardMaterial color="#2196F3" />
        </mesh>
      </group>
    </>
  );
}