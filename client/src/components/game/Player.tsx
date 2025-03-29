import { useRef, useEffect, useState, Suspense } from 'react';
import { useFrame, useThree } from '@react-three/fiber';
import { 
  PointerLockControls, 
  useKeyboardControls, 
  OrbitControls,
  useGLTF
} from '@react-three/drei';
import * as THREE from 'three';
import { GLTF } from 'three-stdlib';
import { BlockType } from '../../lib/blocks';
import { useVoxelGame } from '../../lib/stores/useVoxelGame';
import { useSkills } from '../../lib/stores/useSkills';
import { useAudio } from '../../lib/stores/useAudio';

// Preload the player models
useGLTF.preload('/models/player.glb');
useGLTF.preload('/models/steve.glb');

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
  // Get weather system to apply effects to player movement and visuals
  const weatherSystem = useVoxelGame(state => state.weatherSystem);
  
  // Get character stats from skills
  const characterSpeed = useSkills(state => state.characterSpeed);
  const addXp = useSkills(state => state.addXp);
  
  // Get audio functions from audio store
  const playFootsteps = useAudio(state => state.playFootsteps);
  const stopFootsteps = useAudio(state => state.stopFootsteps);
  const playWaterSounds = useAudio(state => state.playWaterSounds);
  const playBlockBreakSound = useAudio(state => state.playBlockBreakSound);
  const playBlockPlaceSound = useAudio(state => state.playBlockPlaceSound);
  
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
  
  // Weather effect flags
  const [isExposedToWeather, setIsExposedToWeather] = useState(false);
  
  // Weather particle references for animation
  const rainParticlesRef = useRef<THREE.Group>(null);
  const snowParticlesRef = useRef<THREE.Group>(null);
  const stormParticlesRef = useRef<THREE.Group>(null);
  
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
        
        // Play appropriate sound effect for block breaking
        playBlockBreakSound(blockType);
        
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
      
      // Play the placement sound
      playBlockPlaceSound(inventoryItem.type);
      
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
  }, [position, attackCooldown, placeCooldown, blocks, removeBlock, placeBlock, setSelectedBlock, addXp, playBlockBreakSound, playBlockPlaceSound]);
  
  // Camera mode state from the game store
  const cameraMode = useVoxelGame(state => state.player.cameraMode);
  const toggleCameraMode = useVoxelGame(state => state.toggleCameraMode);
  
  // Third person camera orbit control ref
  const orbitControlsRef = useRef<any>(null);
  
  // Load the player 3D model with error handling
  const [modelLoaded, setModelLoaded] = useState(false);
  const [modelError, setModelError] = useState(false);
  
  // Try to load the models, but handle errors gracefully
  let playerModel: THREE.Group | null = null;
  let steveModel: THREE.Group | null = null;

  // Load the primary player model
  try {
    // Using useGLTF within a try/catch won't work properly due to React hooks rules,
    // so we'll use a state to track loading status
    const { scene: playerScene } = useGLTF('/models/steve.glb') as GLTF & {
      scene: THREE.Group;
    };
    steveModel = playerScene;
    
    // If Steve model loaded successfully, use that
    if (!modelLoaded && steveModel) {
      setModelLoaded(true);
      playerModel = steveModel;
      console.log("Steve model loaded successfully");
    }
  } catch (error) {
    console.warn("Failed to load Steve model, trying fallback:", error);
    
    // Try to load the fallback model
    try {
      const { scene: fallbackScene } = useGLTF('/models/player.glb') as GLTF & {
        scene: THREE.Group;
      };
      playerModel = fallbackScene;
      
      // If we got here, loading the fallback was successful
      if (!modelLoaded) {
        setModelLoaded(true);
        console.log("Fallback player model loaded successfully");
      }
    } catch (fallbackError) {
      if (!modelError) {
        console.warn("Failed to load all player models, using basic shape:", fallbackError);
        setModelError(true);
      }
    }
  }
  
  // Set up keyboard events for inventory selection and camera mode
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
      
      // V key to toggle camera mode
      if (e.key === 'v' || e.key === 'V') {
        toggleCameraMode();
        console.log(`Camera mode switched to ${useVoxelGame.getState().player.cameraMode}`);
        
        // Play sound
        useAudio.getState().playUISound('click');
      }
    };
    
    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [attackCooldown, toggleCameraMode]);
  
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
    
    // Apply speed to movement, affected by weather conditions
    let moveSpeed = sprint ? speed * sprintMultiplier : speed;
    
    // Apply weather movement modifiers
    if (weatherSystem) {
      // Slow down in bad weather (rain, snow, etc.)
      moveSpeed *= weatherSystem.effects.movementModifier;
      
      // Debug weather effects on movement
      if (weatherSystem.effects.movementModifier < 0.9) {
        console.log(`Weather slowing movement: ${weatherSystem.currentWeather} (modifier: ${weatherSystem.effects.movementModifier.toFixed(2)})`);
      }
    }
    
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
    
    // Determine terrain type for sound effects
    let terrainType: 'grass' | 'sand' | 'stone' | 'wood' | 'water' = 'grass';
    const blockBelowKey = `${Math.floor(newPosition.x)},${Math.floor(newPosition.y - 0.1)},${Math.floor(newPosition.z)}`;
    const blockBelow = blocks[blockBelowKey];
    
    if (blockBelow) {
      // Determine terrain type from block below the player
      switch (blockBelow) {
        case 'sand': terrainType = 'sand'; break;
        case 'stone': terrainType = 'stone'; break;
        case 'wood': terrainType = 'wood'; break;
        case 'water': terrainType = 'water'; break;
        default: terrainType = 'grass'; break;
      }
    }
    
    // Play appropriate sounds based on movement and terrain
    const isMoving = Math.abs(newVel.x) > 0.01 || Math.abs(newVel.z) > 0.01;
    const isRunning = sprint && isMoving;
    const isWalking = isMoving && !isRunning;
    
    if (isMoving && grounded) {
      playFootsteps(isWalking, isRunning, grounded, terrainType);
    } else {
      stopFootsteps();
    }
    
    // Check if in water
    const blockAtFeetKey = `${Math.floor(newPosition.x)},${Math.floor(newPosition.y)},${Math.floor(newPosition.z)}`;
    const blockAtFeet = blocks[blockAtFeetKey];
    const blockAtHeadKey = `${Math.floor(newPosition.x)},${Math.floor(newPosition.y + 1)},${Math.floor(newPosition.z)}`;
    const blockAtHead = blocks[blockAtHeadKey];
    
    const isSwimming = blockAtFeet === 'water';
    const isUnderwater = blockAtFeet === 'water' && blockAtHead === 'water';
    
    // Play water sounds if in water
    playWaterSounds(isSwimming, isUnderwater);
    
    // Apply weather effects to player (like getting wet in rain)
    if (weatherSystem && (weatherSystem.currentWeather === 'rain' || weatherSystem.currentWeather === 'thunderstorm' || weatherSystem.currentWeather === 'snow')) {
      // Check if player is exposed to weather (not under a block)
      let isCurrentlyExposed = true;
      
      // Check blocks above player for shelter
      for (let y = Math.floor(newPosition.y + 2); y <= Math.floor(newPosition.y + 20); y++) {
        const blockAboveKey = `${Math.floor(newPosition.x)},${y},${Math.floor(newPosition.z)}`;
        const blockAbove = blocks[blockAboveKey];
        
        if (blockAbove && blockAbove !== 'air' && blockAbove !== 'leaves') {
          // Player is sheltered
          isCurrentlyExposed = false;
          break;
        }
      }
      
      // Update state only if it changed to avoid unnecessary re-renders
      if (isCurrentlyExposed !== isExposedToWeather) {
        setIsExposedToWeather(isCurrentlyExposed);
        
        if (isCurrentlyExposed) {
          console.log(`Player exposed to ${weatherSystem.currentWeather} weather`);
        } else {
          console.log(`Player found shelter from the ${weatherSystem.currentWeather}`);
        }
      }
    } else if (isExposedToWeather) {
      // Weather cleared up, reset exposure flag
      setIsExposedToWeather(false);
    }
    
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
  
  // Update game store with player position and rotation
  useEffect(() => {
    // Send position updates to the global store
    useVoxelGame.getState().updatePlayerPosition(position);
    
    // Calculate rotation from camera
    if (cameraRef.current) {
      const cameraDirection = new THREE.Vector3();
      cameraRef.current.getWorldDirection(cameraDirection);
      
      // Calculate Euler angles from direction vector
      const euler = new THREE.Euler().setFromQuaternion(
        new THREE.Quaternion().setFromUnitVectors(
          new THREE.Vector3(0, 0, -1), // Default camera looks down negative z-axis
          cameraDirection
        )
      );
      
      // Update rotation in store
      useVoxelGame.getState().updatePlayerRotation([euler.x, euler.y, euler.z]);
    }
  }, [position]);

  // Handle third-person camera adjustments
  useEffect(() => {
    if (cameraMode === 'third' && orbitControlsRef.current) {
      // Set orbit controls distance and angles for third-person view
      orbitControlsRef.current.minDistance = 3;
      orbitControlsRef.current.maxDistance = 10;
      orbitControlsRef.current.distance = 5;
      orbitControlsRef.current.minPolarAngle = Math.PI / 6; // Limit how high camera can go
      orbitControlsRef.current.maxPolarAngle = Math.PI / 2; // Limit how low camera can go
    }
  }, [cameraMode]);
  
  // Animate weather particles
  useFrame(({ clock }) => {
    // Only animate particles if player is exposed to weather
    if (!isExposedToWeather || !weatherSystem) return;
    
    const time = clock.getElapsedTime();
    
    // Animate rain particles
    if (rainParticlesRef.current && weatherSystem.currentWeather === 'rain') {
      // Safely animate each particle
      rainParticlesRef.current.children.forEach((child, i) => {
        if (child instanceof THREE.Mesh) {
          // Move particles downward
          child.position.y -= 0.2;
          
          // If particle is below player, reset to top
          if (child.position.y < -5) {
            child.position.y = 5 + Math.random() * 3;
            child.position.x = (Math.random() - 0.5) * 10;
            child.position.z = (Math.random() - 0.5) * 10;
          }
        }
      });
      
      // Move the entire particle group with the player
      rainParticlesRef.current!.position.set(position[0], position[1] + 5, position[2]);
    }
    
    // Animate snow particles
    if (snowParticlesRef.current && weatherSystem.currentWeather === 'snow') {
      // Safely animate each particle
      snowParticlesRef.current.children.forEach((child, i) => {
        if (child instanceof THREE.Mesh) {
          // Gentle falling with some drift
          child.position.y -= 0.03;
          child.position.x += Math.sin(time + i) * 0.01;
          child.position.z += Math.cos(time + i * 0.5) * 0.01;
          
          // If particle is below player, reset to top
          if (child.position.y < -5) {
            child.position.y = 5 + Math.random() * 3;
            child.position.x = (Math.random() - 0.5) * 10;
            child.position.z = (Math.random() - 0.5) * 10;
          }
        }
      });
      
      // Move the entire particle group with the player
      snowParticlesRef.current!.position.set(position[0], position[1] + 5, position[2]);
    }
    
    // Animate thunderstorm particles
    if (stormParticlesRef.current && weatherSystem.currentWeather === 'thunderstorm') {
      const children = stormParticlesRef.current.children;
      
      // Safely animate each particle
      children.forEach((child, i) => {
        if (child instanceof THREE.Mesh && i < children.length - 1) { // Skip the last child (lightning)
          // Faster falling with wind gusts
          child.position.y -= 0.3;
          child.position.x += Math.sin(time * 2) * 0.05;
          
          // If particle is below player, reset to top
          if (child.position.y < -5) {
            child.position.y = 5 + Math.random() * 3;
            child.position.x = (Math.random() - 0.5) * 10;
            child.position.z = (Math.random() - 0.5) * 10;
          }
        }
      });
      
      // Move the entire particle group with the player
      stormParticlesRef.current!.position.set(position[0], position[1] + 5, position[2]);
    }
  });
  
  return (
    <>
      {/* Controls based on camera mode */}
      {cameraMode === 'first' ? (
        // First-person controls - auto-lock on click
        <PointerLockControls 
          ref={controlsRef} 
          onUpdate={() => {
            // Force enable pointer lock when component mounts
            if (controlsRef.current && !controlsRef.current.isLocked) {
              console.log("Attempting to lock controls on mount");
              
              // Try to lock on mount with a small delay
              setTimeout(() => {
                if (controlsRef.current && !controlsRef.current.isLocked) {
                  try {
                    controlsRef.current.lock();
                  } catch (error) {
                    console.error("Failed to auto-lock controls:", error);
                  }
                }
              }, 1000);
              
              // Add a click event to the canvas to help mobile browsers
              const canvas = document.querySelector('canvas');
              if (canvas) {
                // Add click listener that persists (not once)
                canvas.addEventListener('click', () => {
                  if (controlsRef.current && !controlsRef.current.isLocked) {
                    console.log("Canvas clicked, locking pointer");
                    try {
                      controlsRef.current.lock();
                    } catch (error) {
                      console.error("Failed to lock on click:", error);
                    }
                  }
                });
                
                // Also listen for key presses to lock controls
                window.addEventListener('keydown', (e) => {
                  if (!controlsRef.current?.isLocked) {
                    if (e.key === 'w' || e.key === 'a' || e.key === 's' || e.key === 'd' || 
                        e.key === ' ' || e.key === 'ArrowUp' || e.key === 'ArrowDown' || 
                        e.key === 'ArrowLeft' || e.key === 'ArrowRight') {
                      console.log("Key pressed, locking pointer");
                      try {
                        controlsRef.current?.lock();
                      } catch (error) {
                        console.error("Failed to lock on keypress:", error);
                      }
                    }
                  }
                });
              }
            }
          }}
        />
      ) : (
        // Third-person orbit controls
        <OrbitControls 
          ref={orbitControlsRef}
          target={[position[0], position[1] + eyeHeight, position[2]]}
          enableZoom={true}
          enablePan={false}
          makeDefault
        />
      )}
      
      {/* Weather effects that follow the player when exposed */}
      {isExposedToWeather && weatherSystem && (
        <group position={[position[0], position[1] + 5, position[2]]}>
          {weatherSystem.currentWeather === 'rain' && (
            <group ref={rainParticlesRef}>
              {/* Rain particles */}
              {Array.from({ length: 30 }).map((_, i) => (
                <mesh 
                  key={`rain-${i}`} 
                  position={[
                    (Math.random() - 0.5) * 10,
                    Math.random() * 5,
                    (Math.random() - 0.5) * 10
                  ]}
                >
                  <boxGeometry args={[0.05, 0.3, 0.05]} />
                  <meshBasicMaterial color="#8EB1C7" transparent opacity={0.6} />
                </mesh>
              ))}
            </group>
          )}
          
          {weatherSystem.currentWeather === 'snow' && (
            <group ref={snowParticlesRef}>
              {/* Snow particles */}
              {Array.from({ length: 40 }).map((_, i) => (
                <mesh 
                  key={`snow-${i}`} 
                  position={[
                    (Math.random() - 0.5) * 10,
                    Math.random() * 5,
                    (Math.random() - 0.5) * 10
                  ]}
                >
                  <sphereGeometry args={[0.07, 4, 4]} />
                  <meshBasicMaterial color="white" transparent opacity={0.8} />
                </mesh>
              ))}
            </group>
          )}
          
          {weatherSystem.currentWeather === 'thunderstorm' && (
            <group ref={stormParticlesRef}>
              {/* Heavy rain particles */}
              {Array.from({ length: 60 }).map((_, i) => (
                <mesh 
                  key={`heavy-rain-${i}`} 
                  position={[
                    (Math.random() - 0.5) * 10,
                    Math.random() * 5,
                    (Math.random() - 0.5) * 10
                  ]}
                >
                  <boxGeometry args={[0.05, 0.4, 0.05]} />
                  <meshBasicMaterial color="#6E8CA3" transparent opacity={0.7} />
                </mesh>
              ))}
              
              {/* Occasional lightning flash */}
              {Math.random() > 0.99 && (
                <pointLight 
                  position={[0, 10, 0]} 
                  intensity={20} 
                  distance={50} 
                  color="#E0F7FF"
                  decay={1}
                />
              )}
            </group>
          )}
        </group>
      )}
      
      {/* Player model - always present but only visible in third-person mode */}
      <group ref={playerRef} position={[position[0], position[1], position[2]]}>
        {/* Conditional rendering based on camera mode */}
        {cameraMode === 'third' ? (
          // In third-person view, show player model
          <Suspense fallback={
            // Fallback for when model is loading
            <mesh>
              <boxGeometry args={[0.5, 1.6, 0.5]} />
              <meshStandardMaterial color="#2196F3" wireframe />
            </mesh>
          }>
            {modelLoaded && playerModel ? (
              // If 3D model loaded successfully, use it
              <primitive 
                object={playerModel!.clone()} 
                scale={[2.5, 2.5, 2.5]} // Steve model needs to be scaled up
                position={[0, -1.6, 0]} 
                rotation={[0, Math.PI, 0]} // Rotate to face forward
                castShadow
              />
            ) : (
              // Fallback blocky character if model failed to load
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
            )}
          </Suspense>
        ) : (
          // In first-person, only render the player's "arms" and tool if needed
          // Let's skip this for now to keep it simple
          null
        )}
        
        {/* Light source that follows the player (like holding a torch) */}
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