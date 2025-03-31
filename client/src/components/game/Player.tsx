import { useRef, useState, useEffect } from 'react';
import { useFrame } from '@react-three/fiber';
import { useKeyboardControls } from '@react-three/drei';
import * as THREE from 'three';
import { Controls } from '../../App'; // Import the Controls enum from App.tsx
import { useGamepadControls } from '../../lib/controls/useGamepadControls';
import { useVoxelGame, WeatherType } from '../../lib/stores/useVoxelGame';

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

function Player({ position = [0, 1, 0] }: PlayerProps) {
  // References
  const playerRef = useRef<THREE.Group>(null);
  const velocityRef = useRef(new THREE.Vector3());
  const cameraRef = useRef(new THREE.Vector3(0, CAMERA_HEIGHT, CAMERA_DISTANCE));
  
  // State
  const [onGround, setOnGround] = useState(true);
  const [cameraMode, setCameraMode] = useState<'first-person' | 'third-person'>('third-person');
  const [toggleCameraPressed, setToggleCameraPressed] = useState(false);
  
  // Get weather from game state
  const weatherSystem = useVoxelGame(state => state.weatherSystem);
  
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
      {/* Player mesh - only visible in third person */}
      {cameraMode === 'third-person' && (
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
  );
}

export default Player;