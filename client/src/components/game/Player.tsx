import { useRef, useEffect } from "react";
import { useFrame } from "@react-three/fiber";
import { useKeyboardControls } from "@react-three/drei";
import * as THREE from "three";
import { useVoxelGame, Controls } from "../../lib/stores/useVoxelGame";
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
  
  const meshRef = useRef<THREE.Mesh>(null);
  const cameraRef = useRef(new THREE.Vector3());
  
  // Get control states without causing re-renders
  const [, getControls] = useKeyboardControls<Controls>();

  // Add debugging to check if controls are working
  useEffect(() => {
    const interval = setInterval(() => {
      const controls = getControls();
      console.log('Control state:', JSON.stringify(controls));
    }, 2000);
    
    return () => clearInterval(interval);
  }, [getControls]);

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
    
    // Apply sprint multiplier
    const speedMultiplier = controls.sprint ? SPRINT_MULTIPLIER : 1;
    
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
    
    // Position camera behind player
    cameraRef.current.set(
      newPosition.x,
      newPosition.y + PLAYER_HEIGHT - 0.2,
      newPosition.z
    );
    
    // Set camera to first-person view (Minecraft-like)
    camera.position.lerp(
      new THREE.Vector3(
        newPosition.x,
        newPosition.y + PLAYER_HEIGHT - 0.2, // Eye level
        newPosition.z
      ),
      0.1
    );
    
    // Look in direction player is facing
    const lookTarget = new THREE.Vector3(
      newPosition.x - Math.sin(yRotation),
      newPosition.y + PLAYER_HEIGHT - 0.2 + Math.sin(cameraXRotation.current),
      newPosition.z - Math.cos(yRotation)
    );
    camera.lookAt(lookTarget);
    
    // Block interaction (mine/place)
    if (controls.mine || controls.place) {
      // Set ray origin to player camera position
      ray.current.set(
        cameraRef.current,
        new THREE.Vector3(
          -Math.sin(yRotation),
          Math.sin(cameraXRotation.current) * 0.5,
          -Math.cos(yRotation)
        ).normalize()
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
      
      // Handle block interaction
      if (closestBlockPos) {
        if (controls.mine) {
          // Remove the block
          removeBlock(closestBlockPos.x, closestBlockPos.y, closestBlockPos.z);
          console.log(`Removed block at ${closestBlockPos.x},${closestBlockPos.y},${closestBlockPos.z}`);
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
          }
        }
      }
    }
  });
  
  return (
    <mesh ref={meshRef} position={[position.x, position.y, position.z]}>
      <boxGeometry args={[PLAYER_WIDTH, PLAYER_HEIGHT, PLAYER_WIDTH]} />
      <meshStandardMaterial color="#00AAFF" opacity={0.8} transparent />
    </mesh>
  );
}
