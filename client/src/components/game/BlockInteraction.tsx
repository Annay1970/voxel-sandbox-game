import { useEffect, useRef, useState } from 'react';
import { useFrame, useThree } from '@react-three/fiber';
import { useKeyboardControls } from '@react-three/drei';
import * as THREE from 'three';
import { Controls } from '../../App';
import Crosshair from './Crosshair';
import Block from './Block';
import useVoxelStore from '../../lib/stores/useVoxelStore';
import { BlockType, getBlockDrops, getRequiredTool } from '../../lib/blocks';

// Maximum distance for block interaction
const MAX_INTERACTION_DISTANCE = 5;

// Minimum time between breaking blocks (in ms)
const BREAK_COOLDOWN = 250;

// Reference faces for placement
const FACE_NORMALS = [
  [0, 0, 1],   // Front
  [0, 0, -1],  // Back
  [-1, 0, 0],  // Left
  [1, 0, 0],   // Right
  [0, 1, 0],   // Top
  [0, -1, 0]   // Bottom
];

// Direction strings corresponding to face indices
const FACE_NAMES = ['front', 'back', 'left', 'right', 'top', 'bottom'];

export default function BlockInteraction() {
  // State for targeted block
  const [targetedBlock, setTargetedBlock] = useState<{
    x: number;
    y: number;
    z: number;
    distance: number;
    face: number;
  } | null>(null);
  
  // State for mining progress
  const [miningProgress, setMiningProgress] = useState(0);
  const [miningTimer, setMiningTimer] = useState<NodeJS.Timeout | null>(null);
  const [lastBreakTime, setLastBreakTime] = useState(0);
  
  // Raycast origin and direction
  const rayOrigin = useRef(new THREE.Vector3());
  const rayDirection = useRef(new THREE.Vector3());
  
  // Get renderer state for camera and raycaster
  const { camera } = useThree();
  const raycaster = useRef(new THREE.Raycaster());
  
  // Get keyboard controls
  const [subscribeKeys, getKeys] = useKeyboardControls<Controls>();
  
  // Get the voxel store
  const voxelStore = useVoxelStore();
  
  // Preview block for placement (ghost block)
  const [previewBlock, setPreviewBlock] = useState<{
    x: number;
    y: number;
    z: number;
    type: BlockType;
  } | null>(null);
  
  // Initialize the world
  useEffect(() => {
    // Generate a simple flat terrain if blocks are empty
    if (Object.keys(voxelStore.blocks).length === 0) {
      voxelStore.generateTerrain(16);
    }
  }, [voxelStore]);
  
  // Handle block breaking on left click
  useEffect(() => {
    const handleBreakBlock = (attack: boolean) => {
      if (!attack || !targetedBlock) return;
      
      const now = Date.now();
      if (now - lastBreakTime < BREAK_COOLDOWN) return;
      
      // Get the block type at the targeted position
      const blockType = voxelStore.getBlock(
        targetedBlock.x,
        targetedBlock.y,
        targetedBlock.z
      );
      
      if (!blockType) return;
      
      // Check if we have the right tool
      const { tool, level } = getRequiredTool(blockType);
      const playerToolLevel = voxelStore.toolLevel;
      const playerToolType = voxelStore.activeTool;
      
      // If we don't have the right tool or level, we can't break it
      const canBreak = !tool || 
        tool === 'hand' || 
        (tool === playerToolType && level <= playerToolLevel);
      
      if (!canBreak) {
        console.log(`Need a ${tool} of level ${level} to break this block`);
        return;
      }
      
      // Remove the block
      voxelStore.removeBlock(
        targetedBlock.x,
        targetedBlock.y,
        targetedBlock.z
      );
      
      // Get the drops for this block
      const drops = getBlockDrops(blockType);
      console.log(`Block broken! Drops:`, drops);
      
      // In a real game, would add items to inventory here
      
      // Set last break time to now
      setLastBreakTime(now);
      
      // Reset mining progress
      setMiningProgress(0);
      if (miningTimer) {
        clearTimeout(miningTimer);
        setMiningTimer(null);
      }
    };
    
    return subscribeKeys(
      (state) => state[Controls.attack],
      handleBreakBlock
    );
  }, [subscribeKeys, targetedBlock, voxelStore, lastBreakTime, miningTimer]);
  
  // Handle block placement on right click
  useEffect(() => {
    const handlePlaceBlock = (place: boolean) => {
      if (!place || !targetedBlock || !previewBlock) return;
      
      // Check if we have that block type selected
      const selectedBlock = voxelStore.selectedBlock;
      
      // In a real game, would check if player has this block in inventory
      
      // Place the block
      voxelStore.addBlock(
        previewBlock.x,
        previewBlock.y,
        previewBlock.z,
        selectedBlock
      );
      
      // Play a sound effect
      // playSound('block_place');
    };
    
    return subscribeKeys(
      (state) => state[Controls.place],
      handlePlaceBlock
    );
  }, [subscribeKeys, targetedBlock, previewBlock, voxelStore]);
  
  // Use frame to update raycast and check for block intersections
  useFrame(() => {
    // Update raycast origin and direction from camera
    rayOrigin.current.copy(camera.position);
    
    rayDirection.current.set(0, 0, -1);
    rayDirection.current.unproject(camera);
    rayDirection.current.sub(rayOrigin.current).normalize();
    
    // Set up the raycaster
    raycaster.current.set(rayOrigin.current, rayDirection.current);
    
    // Create a list of meshes to check against
    const meshes: THREE.Object3D[] = [];
    const blocks = voxelStore.blocks;
    
    // For a real game with many blocks, we'd optimize this to only check blocks near the player
    // For simplicity, we're checking all blocks for now
    for (const key in blocks) {
      const [x, y, z] = voxelStore.keyToCoords(key);
      
      // Don't check air blocks
      if (blocks[key] === 'air') continue;
      
      // Create a temporary object at the block position for raycasting
      const tempObject = new THREE.Object3D();
      tempObject.position.set(x, y, z);
      
      // Store the block coordinates in the userData for retrieval after intersection
      tempObject.userData = { x, y, z, type: blocks[key] };
      
      meshes.push(tempObject);
    }
    
    // Perform the raycast against block positions
    const intersections = raycaster.current.intersectObjects(meshes);
    
    // If we found an intersection, update the targeted block
    if (intersections.length > 0) {
      const intersection = intersections[0];
      const object = intersection.object;
      const { x, y, z } = object.userData;
      
      // Calculate the face from the normal
      const normal = intersection.face?.normal || new THREE.Vector3();
      let faceIndex = 0;
      
      // Find which face was hit based on the normal
      for (let i = 0; i < FACE_NORMALS.length; i++) {
        const [nx, ny, nz] = FACE_NORMALS[i];
        if (
          Math.abs(normal.x - nx) < 0.1 &&
          Math.abs(normal.y - ny) < 0.1 &&
          Math.abs(normal.z - nz) < 0.1
        ) {
          faceIndex = i;
          break;
        }
      }
      
      // Only target blocks within range
      const distance = intersection.distance;
      if (distance <= MAX_INTERACTION_DISTANCE) {
        setTargetedBlock({ x, y, z, distance, face: faceIndex });
        
        // Calculate the position for a new block based on the face normal
        const [nx, ny, nz] = FACE_NORMALS[faceIndex];
        setPreviewBlock({
          x: x + nx,
          y: y + ny,
          z: z + nz,
          type: voxelStore.selectedBlock
        });
      } else {
        setTargetedBlock(null);
        setPreviewBlock(null);
      }
    } else {
      setTargetedBlock(null);
      setPreviewBlock(null);
    }
  });
  
  // Existing blocks from the store
  const blocks = Object.entries(voxelStore.blocks).map(([key, type]) => {
    const [x, y, z] = voxelStore.keyToCoords(key);
    const isTargeted = targetedBlock ? 
      (targetedBlock.x === x && 
      targetedBlock.y === y && 
      targetedBlock.z === z) : false;
      
    return (
      <Block 
        key={key}
        position={[x, y, z]} 
        type={type}
        selected={isTargeted}
      />
    );
  });
  
  return (
    <>
      {/* Render all blocks from the store */}
      {blocks}
      
      {/* Render the preview block if there is one */}
      {previewBlock && (
        <Block
          position={[previewBlock.x, previewBlock.y, previewBlock.z]}
          type={previewBlock.type}
          selected={true}
        />
      )}
      
      {/* Render the crosshair */}
      <Crosshair 
        size={20} 
        color="white" 
        thickness={2} 
        gap={6} 
      />
    </>
  );
}