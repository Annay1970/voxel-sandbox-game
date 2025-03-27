// Physics utility functions for voxel game

import * as THREE from 'three';
import { BlockType, isBlockSolid } from '../blocks';

// Constants
export const GRAVITY = 0.08;
export const JUMP_FORCE = 0.4;
export const PLAYER_HEIGHT = 1.8;
export const PLAYER_WIDTH = 0.6;
export const PLAYER_SPEED = 0.15;
export const SPRINT_MULTIPLIER = 1.6;

// Check collision between player and a block
export function checkBlockCollision(
  playerBox: {
    minX: number;
    maxX: number;
    minY: number;
    maxY: number;
    minZ: number;
    maxZ: number;
  },
  blockX: number,
  blockY: number,
  blockZ: number
): boolean {
  // Block bounds (blocks are 1x1x1 centered at their position)
  const blockBox = {
    minX: blockX - 0.5,
    maxX: blockX + 0.5,
    minY: blockY - 0.5,
    maxY: blockY + 0.5,
    minZ: blockZ - 0.5,
    maxZ: blockZ + 0.5,
  };

  // Check if the boxes intersect on all axes
  return (
    playerBox.maxX > blockBox.minX &&
    playerBox.minX < blockBox.maxX &&
    playerBox.maxY > blockBox.minY &&
    playerBox.minY < blockBox.maxY &&
    playerBox.maxZ > blockBox.minZ &&
    playerBox.minZ < blockBox.maxZ
  );
}

// Check if player is on ground by casting a ray downward
export function checkPlayerOnGround(
  position: { x: number; y: number; z: number },
  blocks: Record<string, BlockType>,
  rayLength: number = 0.1
): boolean {
  // Check block directly below player
  for (let y = Math.floor(position.y); y > Math.floor(position.y) - 2; y--) {
    const blockKey = `${Math.floor(position.x)},${y},${Math.floor(position.z)}`;
    if (blocks[blockKey] && isBlockSolid(blocks[blockKey])) {
      // Calculate distance between player feet and block top
      const blockTopY = y + 0.5; // Top of the block
      const playerFeetY = position.y; // Bottom of player
      
      // If player is close enough to or touching the block, they're on ground
      if (playerFeetY - blockTopY <= rayLength) {
        return true;
      }
    }
  }
  
  // Also check nearby blocks (for edge cases where player is on the edge of blocks)
  const offsets = [
    [0.3, 0.3], [0.3, -0.3], [-0.3, 0.3], [-0.3, -0.3] // Check corners of player
  ];
  
  for (const [xOffset, zOffset] of offsets) {
    for (let y = Math.floor(position.y); y > Math.floor(position.y) - 2; y--) {
      const blockKey = `${Math.floor(position.x + xOffset)},${y},${Math.floor(position.z + zOffset)}`;
      if (blocks[blockKey] && isBlockSolid(blocks[blockKey])) {
        const blockTopY = y + 0.5;
        const playerFeetY = position.y;
        
        if (playerFeetY - blockTopY <= rayLength) {
          return true;
        }
      }
    }
  }
  
  return false;
}

// Ray casting for block interaction (mining/placing)
export function castRay(
  origin: THREE.Vector3,
  direction: THREE.Vector3,
  blocks: Record<string, BlockType>,
  maxDistance: number = 5
): { 
  hit: boolean; 
  position: { x: number; y: number; z: number } | null;
  normal: { x: number; y: number; z: number } | null;
  distance: number;
} {
  // Setup the raycaster
  const raycaster = new THREE.Raycaster(origin, direction, 0, maxDistance);
  
  // Prepare blocks within range to check for intersection
  const blockPositions: THREE.Vector3[] = [];
  const blockMap: Record<string, { x: number, y: number, z: number }> = {};
  
  // Create a radius to check blocks within
  const checkRadius = Math.ceil(maxDistance);
  const originX = Math.floor(origin.x);
  const originY = Math.floor(origin.y);
  const originZ = Math.floor(origin.z);
  
  // Gather blocks in vicinity to check
  for (let x = originX - checkRadius; x <= originX + checkRadius; x++) {
    for (let y = originY - checkRadius; y <= originY + checkRadius; y++) {
      for (let z = originZ - checkRadius; z <= originZ + checkRadius; z++) {
        const key = `${x},${y},${z}`;
        
        // Skip if block doesn't exist or is air
        if (!blocks[key] || !isBlockSolid(blocks[key])) continue;
        
        // Create a vector for this block position
        const blockPos = new THREE.Vector3(x, y, z);
        blockPositions.push(blockPos);
        blockMap[blockPos.toArray().join(',')] = { x, y, z };
      }
    }
  }
  
  // No blocks to check
  if (blockPositions.length === 0) {
    return { hit: false, position: null, normal: null, distance: maxDistance };
  }
  
  // Find closest intersection manually
  let closestBlock = null;
  let closestDistance = maxDistance;
  let closestNormal = null;
  
  for (const blockPos of blockPositions) {
    // Create a box for the block
    const box = new THREE.Box3(
      new THREE.Vector3(blockPos.x - 0.5, blockPos.y - 0.5, blockPos.z - 0.5),
      new THREE.Vector3(blockPos.x + 0.5, blockPos.y + 0.5, blockPos.z + 0.5)
    );
    
    // Check for intersection
    const intersectionPoint = new THREE.Vector3();
    if (raycaster.ray.intersectBox(box, intersectionPoint)) {
      const distance = intersectionPoint.distanceTo(origin);
      
      if (distance < closestDistance) {
        closestDistance = distance;
        closestBlock = blockMap[blockPos.toArray().join(',')];
        
        // Calculate normal based on intersection point
        // This determines which face of the block was hit
        const eps = 0.001;
        const normal = { x: 0, y: 0, z: 0 };
        
        if (Math.abs(intersectionPoint.x - (blockPos.x - 0.5)) < eps) normal.x = -1;
        else if (Math.abs(intersectionPoint.x - (blockPos.x + 0.5)) < eps) normal.x = 1;
        else if (Math.abs(intersectionPoint.y - (blockPos.y - 0.5)) < eps) normal.y = -1;
        else if (Math.abs(intersectionPoint.y - (blockPos.y + 0.5)) < eps) normal.y = 1;
        else if (Math.abs(intersectionPoint.z - (blockPos.z - 0.5)) < eps) normal.z = -1;
        else if (Math.abs(intersectionPoint.z - (blockPos.z + 0.5)) < eps) normal.z = 1;
        
        closestNormal = normal;
      }
    }
  }
  
  return {
    hit: closestBlock !== null,
    position: closestBlock,
    normal: closestNormal,
    distance: closestDistance
  };
}

// Check if a new block placement would intersect with the player
export function wouldBlockIntersectPlayer(
  blockX: number,
  blockY: number,
  blockZ: number,
  playerPosition: { x: number, y: number, z: number }
) {
  const playerBox = {
    minX: playerPosition.x - PLAYER_WIDTH / 2,
    maxX: playerPosition.x + PLAYER_WIDTH / 2,
    minY: playerPosition.y,
    maxY: playerPosition.y + PLAYER_HEIGHT,
    minZ: playerPosition.z - PLAYER_WIDTH / 2,
    maxZ: playerPosition.z + PLAYER_WIDTH / 2
  };
  
  return checkBlockCollision(playerBox, blockX, blockY, blockZ);
}

// Resolve collision by pushing the player out of the block
export function resolveCollision(
  newPosition: { x: number, y: number, z: number },
  velocity: { x: number, y: number, z: number },
  blockX: number,
  blockY: number,
  blockZ: number
): { 
  position: { x: number, y: number, z: number }, 
  velocity: { x: number, y: number, z: number },
  collisionDirection: 'x' | 'y' | 'z' | null
} {
  // Calculate player boundaries with new position
  const playerBox = {
    minX: newPosition.x - PLAYER_WIDTH / 2,
    maxX: newPosition.x + PLAYER_WIDTH / 2,
    minY: newPosition.y,
    maxY: newPosition.y + PLAYER_HEIGHT,
    minZ: newPosition.z - PLAYER_WIDTH / 2,
    maxZ: newPosition.z + PLAYER_WIDTH / 2
  };
  
  // Calculate block boundaries
  const blockBox = {
    minX: blockX - 0.5,
    maxX: blockX + 0.5,
    minY: blockY - 0.5,
    maxY: blockY + 0.5,
    minZ: blockZ - 0.5,
    maxZ: blockZ + 0.5
  };
  
  // Find overlap on each axis
  const overlapX = Math.min(playerBox.maxX - blockBox.minX, blockBox.maxX - playerBox.minX);
  const overlapY = Math.min(playerBox.maxY - blockBox.minY, blockBox.maxY - playerBox.minY);
  const overlapZ = Math.min(playerBox.maxZ - blockBox.minZ, blockBox.maxZ - playerBox.minZ);
  
  // Determine minimum translation to resolve collision
  let resolvedPosition = { ...newPosition };
  let resolvedVelocity = { ...velocity };
  let collisionDirection: 'x' | 'y' | 'z' | null = null;
  
  // Resolve based on minimum overlap (push back in the direction with smallest overlap)
  if (overlapX < overlapY && overlapX < overlapZ) {
    // X-axis collision
    collisionDirection = 'x';
    resolvedVelocity.x = 0;
    
    if (playerBox.maxX - blockBox.minX < blockBox.maxX - playerBox.minX) {
      // Collision from right side of block
      resolvedPosition.x = blockBox.minX - PLAYER_WIDTH / 2;
    } else {
      // Collision from left side of block
      resolvedPosition.x = blockBox.maxX + PLAYER_WIDTH / 2;
    }
  } else if (overlapY < overlapZ) {
    // Y-axis collision
    collisionDirection = 'y';
    resolvedVelocity.y = 0;
    
    if (playerBox.maxY - blockBox.minY < blockBox.maxY - playerBox.minY) {
      // Collision from top of block
      resolvedPosition.y = blockBox.minY - PLAYER_HEIGHT;
    } else {
      // Collision from bottom of block (player is standing on it)
      resolvedPosition.y = blockBox.maxY;
    }
  } else {
    // Z-axis collision
    collisionDirection = 'z';
    resolvedVelocity.z = 0;
    
    if (playerBox.maxZ - blockBox.minZ < blockBox.maxZ - playerBox.minZ) {
      // Collision from front of block
      resolvedPosition.z = blockBox.minZ - PLAYER_WIDTH / 2;
    } else {
      // Collision from back of block
      resolvedPosition.z = blockBox.maxZ + PLAYER_WIDTH / 2;
    }
  }
  
  return {
    position: resolvedPosition,
    velocity: resolvedVelocity,
    collisionDirection
  };
}

// Utility function to get neighboring blocks
export function getNeighborBlocks(
  x: number, 
  y: number, 
  z: number, 
  blocks: Record<string, BlockType>
): Array<{ 
  position: { x: number, y: number, z: number }, 
  type: BlockType 
}> {
  const neighbors: Array<{ position: { x: number, y: number, z: number }, type: BlockType }> = [];
  
  // Possible offsets for neighbors
  const offsets = [
    [1, 0, 0], [-1, 0, 0],  // x-axis
    [0, 1, 0], [0, -1, 0],  // y-axis
    [0, 0, 1], [0, 0, -1]   // z-axis
  ];
  
  offsets.forEach(([dx, dy, dz]) => {
    const nx = x + dx;
    const ny = y + dy;
    const nz = z + dz;
    const key = `${nx},${ny},${nz}`;
    
    if (blocks[key]) {
      neighbors.push({
        position: { x: nx, y: ny, z: nz },
        type: blocks[key]
      });
    }
  });
  
  return neighbors;
}

// Function to get the rotation matrix from yaw (used for camera direction)
export function getDirectionFromYaw(yaw: number): THREE.Vector3 {
  return new THREE.Vector3(
    -Math.sin(yaw),
    0,
    -Math.cos(yaw)
  ).normalize();
}
