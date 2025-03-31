import { useRef, useState, useEffect, Suspense } from 'react';
import { useFrame } from '@react-three/fiber';
import { useKeyboardControls, useGLTF, OrbitControls, Html } from '@react-three/drei';
import * as THREE from 'three';
import { Controls } from '../../App'; // Import the Controls enum from App.tsx
import { useGamepadControls } from '../../lib/controls/useGamepadControls';
import { useVoxelGame, WeatherType } from '../../lib/stores/useVoxelGame';
import { getBlockTemperatureEffect } from '../../lib/blocks';
import { GLTF } from 'three-stdlib';
import CombatSystem, { AttackType, WeaponType } from './CombatSystem';

// Player configuration
const PLAYER_SPEED = 5;
const PLAYER_JUMP_FORCE = 8;
const PLAYER_SPRINT_MULTIPLIER = 1.7;
const GRAVITY = 25;
const CAMERA_DISTANCE = 5;
const CAMERA_HEIGHT = 2.5;
const CAMERA_LERP_FACTOR = 0.1;

// Weather impact on movement
const WEATHER_MOVEMENT_MODIFIERS: Record<WeatherType, number> = {
  'clear': 1.0,
  'cloudy': 0.9,
  'rain': 0.8,
  'thunderstorm': 0.6,
  'fog': 0.7,
  'snow': 0.5
};

interface PlayerProps {
  position?: [number, number, number];
}

// Preload the model
useGLTF.preload('/models/player.glb');

function Player({ position = [0, 1, 0] }: PlayerProps) {
  // References
  const playerRef = useRef<THREE.Group>(null);
  const modelRef = useRef<THREE.Group>(null);
  const velocityRef = useRef(new THREE.Vector3());
  const cameraRef = useRef(new THREE.Vector3(0, CAMERA_HEIGHT, CAMERA_DISTANCE));
  
  // Load the 3D model
  const { scene: playerModel } = useGLTF('/models/player.glb') as GLTF & {
    scene: THREE.Group
  };
  
  // Model loading state
  const [modelLoaded, setModelLoaded] = useState(false);
  
  // Track when model is loaded
  useEffect(() => {
    if (playerModel) {
      setModelLoaded(true);
      console.log("Player model loaded successfully");
    }
  }, [playerModel]);
  
  // State
  const [onGround, setOnGround] = useState(true);
  const [cameraMode, setCameraMode] = useState<'first-person' | 'third-person'>('third-person');
  const [toggleCameraPressed, setToggleCameraPressed] = useState(false);
  const [lastTemperatureUpdate, setLastTemperatureUpdate] = useState(0);
  
  // Get state from voxel game
  const weatherSystem = useVoxelGame(state => state.weatherSystem);
  const blocks = useVoxelGame(state => state.blocks);
  const updatePlayerStamina = useVoxelGame(state => state.updatePlayerStamina);
  const setPlayerSprinting = useVoxelGame(state => state.setPlayerSprinting);
  const updatePlayerTemperature = useVoxelGame(state => state.updatePlayerTemperature);
  
  // Controls using subscribe method to avoid re-renders
  const [subscribeKeys, getKeys] = useKeyboardControls<Controls>();
  const gamepad = useGamepadControls();
  
  // Helper to get combined input from keyboard and gamepad
  const getInput = (
    keyboardKey: Controls,
    gamepadValue: number | boolean,
    isAxis = false
  ): number => {
    const keyboardValue = getKeys()[keyboardKey] ? 1 : 0;
    
    if (isAxis) {
      // For axes (like movement), combine both inputs
      return Math.abs(gamepadValue as number) > 0.1 
        ? gamepadValue as number 
        : keyboardValue;
    } else {
      // For buttons, either input can activate
      return (keyboardValue > 0 || gamepadValue) ? 1 : 0;
    }
  };
  
  // Toggle camera effect
  useEffect(() => {
    // Subscribe to camera toggle changes
    return subscribeKeys(
      (state) => state[Controls.toggleCamera], 
      (pressed) => {
        if (pressed && !toggleCameraPressed) {
          setCameraMode(prev => prev === 'third-person' ? 'first-person' : 'third-person');
        }
        setToggleCameraPressed(pressed);
      }
    );
  }, [toggleCameraPressed, subscribeKeys]);
  
  // Player movement
  useFrame((state, delta) => {
    if (!playerRef.current) return;
    
    const player = playerRef.current;
    const velocity = velocityRef.current;
    
    // Get the current keyboard state
    const keys = getKeys();
    
    // Get input from keyboard and gamepad
    const forwardInput = getInput(
      Controls.forward, 
      gamepad.movementY > 0 ? 0 : -gamepad.movementY, // Negative because forward is -Z
      true
    ) - getInput(
      Controls.back, 
      gamepad.movementY < 0 ? 0 : gamepad.movementY,
      true
    );
    
    const rightInput = getInput(
      Controls.right, 
      gamepad.movementX, 
      true
    ) - getInput(
      Controls.left, 
      -gamepad.movementX, 
      true
    );
    
    const jumpInput = getInput(Controls.jump, gamepad.jump);
    const sprintInput = getInput(Controls.sprint, gamepad.sprint);
    
    // Update sprinting state in the game store
    setPlayerSprinting(sprintInput > 0);
    
    // Apply camera rotation from gamepad right stick
    if (Math.abs(gamepad.cameraX) > 0.1 || Math.abs(gamepad.cameraY) > 0.1) {
      player.rotation.y -= gamepad.cameraX * delta * 3;
      
      // Camera rotation on vertical axis limited to avoid flipping
      const verticalRotation = Math.max(
        -Math.PI / 3, // Look up limit (60 degrees)
        Math.min(Math.PI / 3, player.rotation.x + gamepad.cameraY * delta * 3)
      );
      player.rotation.x = verticalRotation;
    }
    
    // Apply weather movement modifier
    const weatherModifier = weatherSystem.effects.movementModifier;
    
    // Handle stamina for sprinting
    if (sprintInput) {
      // Reduce stamina when sprinting (more reduction in adverse weather)
      const staminaReduction = -15 * delta * (2 - weatherModifier); // More stamina used in bad weather
      updatePlayerStamina(staminaReduction);
    } else {
      // Regenerate stamina when not sprinting
      const now = Date.now();
      if (now - lastTemperatureUpdate > 500) { // Update every 500ms to avoid too frequent updates
        updatePlayerStamina(10 * delta); // Regenerate stamina over time
        setLastTemperatureUpdate(now);
      }
    }
    
    // Apply speed based on sprint and weather conditions
    const speed = PLAYER_SPEED * (sprintInput ? PLAYER_SPRINT_MULTIPLIER : 1) * weatherModifier;
    
    // Add visual feedback for movement in extreme weather
    if (weatherModifier < 0.7) {
      console.log(`Movement slowed by ${weatherSystem.currentWeather} (${(1 - weatherModifier) * 100}% reduction)`);
    }
    
    // Create movement direction vector
    const direction = new THREE.Vector3();
    
    // Forward/backward
    if (forwardInput !== 0) {
      direction.z = forwardInput > 0 ? -1 : 1;
    }
    
    // Left/right
    if (rightInput !== 0) {
      direction.x = rightInput > 0 ? 1 : -1;
    }
    
    // Normalize direction if moving diagonally
    if (direction.length() > 0) {
      direction.normalize();
      
      // Apply rotation to movement
      direction.applyAxisAngle(new THREE.Vector3(0, 1, 0), player.rotation.y);
      
      // Apply speed to movement
      velocity.x = direction.x * speed;
      velocity.z = direction.z * speed;
    } else {
      // Apply friction when not actively moving
      velocity.x *= 0.85;
      velocity.z *= 0.85;
      
      // Clamp small values to zero to avoid sliding
      if (Math.abs(velocity.x) < 0.01) velocity.x = 0;
      if (Math.abs(velocity.z) < 0.01) velocity.z = 0;
    }
    
    // Jump if on ground
    if (onGround && jumpInput) {
      // Apply weather effects to jump height (reduce in rain/snow, extra height in clear weather)
      const jumpModifier = weatherSystem.currentWeather === 'snow' ? 0.7 :
                          weatherSystem.currentWeather === 'rain' ? 0.8 :
                          weatherSystem.currentWeather === 'thunderstorm' ? 0.6 :
                          weatherSystem.currentWeather === 'clear' ? 1.1 : 1.0;
      
      velocity.y = PLAYER_JUMP_FORCE * jumpModifier;
      setOnGround(false);
      
      // Consume stamina on jump
      updatePlayerStamina(-5);
      
      // Log jumping in extreme weather
      if (jumpModifier !== 1.0) {
        console.log(`Jump ${jumpModifier < 1 ? 'hindered' : 'enhanced'} by ${weatherSystem.currentWeather} weather`);
      }
    }
    
    // Apply gravity
    if (!onGround) {
      velocity.y -= GRAVITY * delta;
    }
    
    // Simple ground check (improve this with raycasting later)
    if (player.position.y <= 1) {
      player.position.y = 1;
      velocity.y = 0;
      setOnGround(true);
    }
    
    // Apply velocity
    player.position.x += velocity.x * delta;
    player.position.y += velocity.y * delta;
    player.position.z += velocity.z * delta;
    
    // Check for nearby blocks that affect temperature
    const now = Date.now();
    if (now - lastTemperatureUpdate > 1000) { // Update every second
      setLastTemperatureUpdate(now);
      
      // Base temperature modifier from weather
      let temperatureModifier = weatherSystem.effects.temperatureModifier;
      
      // Check blocks in a radius around the player
      const checkRadius = 5;
      const playerPos = [
        Math.floor(player.position.x),
        Math.floor(player.position.y),
        Math.floor(player.position.z)
      ];
      
      // Check nearby blocks for temperature effects
      for (let x = playerPos[0] - checkRadius; x <= playerPos[0] + checkRadius; x++) {
        for (let y = playerPos[1] - checkRadius; y <= playerPos[1] + checkRadius; y++) {
          for (let z = playerPos[2] - checkRadius; z <= playerPos[2] + checkRadius; z++) {
            const blockKey = `${x},${y},${z}`;
            const blockType = blocks[blockKey];
            
            if (blockType) {
              const temperatureEffect = getBlockTemperatureEffect(blockType);
              if (temperatureEffect) {
                // Calculate distance
                const distance = Math.sqrt(
                  Math.pow(x - playerPos[0], 2) +
                  Math.pow(y - playerPos[1], 2) +
                  Math.pow(z - playerPos[2], 2)
                );
                
                // Only apply effect if within the block's radius
                if (distance <= temperatureEffect.radius) {
                  // Calculate effect based on distance (closer = stronger)
                  const distanceFactor = 1 - (distance / temperatureEffect.radius);
                  const effectStrength = temperatureEffect.effect * 
                                        distanceFactor * 
                                        temperatureEffect.intensity;
                  
                  // Add to the total temperature modifier
                  temperatureModifier += effectStrength;
                  
                  // Debug log for significant temperature changes
                  if (Math.abs(effectStrength) > 0.05) {
                    console.log(`Temperature ${effectStrength > 0 ? 'increased' : 'decreased'} by ${blockType} block at distance ${distance.toFixed(1)}`);
                  }
                }
              }
            }
          }
        }
      }
      
      // Apply the temperature change to the player
      updatePlayerTemperature(temperatureModifier * 0.1); // Scale down to make changes gradual
    }
    
    // Update camera position
    if (cameraMode === 'third-person') {
      // Third-person camera follows behind player
      const cameraTarget = new THREE.Vector3(
        player.position.x,
        player.position.y + CAMERA_HEIGHT,
        player.position.z + CAMERA_DISTANCE
      );
      
      // Apply player rotation to camera position
      cameraTarget.sub(player.position)
        .applyAxisAngle(new THREE.Vector3(0, 1, 0), player.rotation.y)
        .add(player.position);
      
      // Smoothly move the camera (lerp)
      state.camera.position.lerp(cameraTarget, CAMERA_LERP_FACTOR);
      
      // Make camera look at player
      state.camera.lookAt(
        player.position.x,
        player.position.y + 1,
        player.position.z
      );
    } else {
      // First-person camera
      state.camera.position.copy(new THREE.Vector3(
        player.position.x,
        player.position.y + 1.6, // Eye height
        player.position.z
      ));
      
      // Use player rotation for camera
      state.camera.rotation.y = player.rotation.y;
      state.camera.rotation.x = player.rotation.x;
    }
  });
  
  return (
    <group 
      ref={playerRef} 
      position={position instanceof Array ? position : [0, 1, 0]}
    >
      {/* Only show player model in third-person mode */}
      {cameraMode === 'third-person' && (
        <group ref={modelRef} scale={[1, 1, 1]}>
          {modelLoaded && playerModel ? (
            <Suspense fallback={
              <mesh castShadow>
                <boxGeometry args={[0.6, 1.8, 0.6]} />
                <meshStandardMaterial color="#4287f5" />
              </mesh>
            }>
              <primitive 
                object={playerModel.clone()} 
                position={[0, 0, 0]}
                rotation={[0, Math.PI, 0]} // Rotate to face correct direction
                scale={[2.5, 2.5, 2.5]}    // Scale up the model to match player size
                castShadow 
                receiveShadow 
              />
            </Suspense>
          ) : (
            // Fallback mesh if model isn't loaded yet
            <>
              {/* Player body */}
              <mesh position={[0, 0.9, 0]} castShadow>
                <boxGeometry args={[0.6, 1.8, 0.6]} />
                <meshStandardMaterial color="#4287f5" />
              </mesh>
              
              {/* Player head */}
              <mesh position={[0, 1.9, 0]} castShadow>
                <boxGeometry args={[0.5, 0.5, 0.5]} />
                <meshStandardMaterial color="#ffe6cc" />
              </mesh>
            </>
          )}
        </group>
      )}
      
      {/* Combat system */}
      {playerRef.current && (
        <CombatSystem 
          playerPosition={playerRef.current.position}
          playerRotation={playerRef.current.rotation}
          onHitCreature={(creatureId, damage, attackType) => {
            console.log(`Hit creature ${creatureId} with ${damage} damage using ${attackType} attack`);
          }}
        />
      )}
    </group>
  );
}

export default Player;