import { Canvas, useFrame } from "@react-three/fiber";
import { Suspense, useState, useRef } from "react";
import { KeyboardControls, OrbitControls, useKeyboardControls } from "@react-three/drei";
import "@fontsource/inter";
import { Controls } from "./lib/stores/useVoxelGame";
import * as THREE from "three";

// Simple Player component with basic movement
const Player = () => {
  const [position, setPosition] = useState({ x: 0, y: 1, z: 0 });
  const playerRef = useRef<THREE.Mesh>(null);
  
  // Access keyboard controls
  const [subscribeKeys, getKeys] = useKeyboardControls<Controls>();
  
  // Update player position in animation frame
  useFrame((state: any, delta: number) => {
    if (!playerRef.current) return;
    
    // Get current key states
    const { forward, backward, left, right, jump } = getKeys();
    
    // Simple movement logic
    const moveSpeed = 5 * delta;
    let newPosition = { ...position };
    
    if (forward) newPosition.z -= moveSpeed;
    if (backward) newPosition.z += moveSpeed;
    if (left) newPosition.x -= moveSpeed;
    if (right) newPosition.x += moveSpeed;
    if (jump) newPosition.y += moveSpeed * 2;
    
    // Apply gravity
    if (newPosition.y > 1) {
      newPosition.y -= 9.8 * delta;
    } else {
      newPosition.y = 1;
    }
    
    // Update position
    setPosition(newPosition);
    
    // Apply to mesh
    playerRef.current.position.set(newPosition.x, newPosition.y, newPosition.z);
    
    // Update camera to follow player
    state.camera.position.set(
      newPosition.x, 
      newPosition.y + 3, 
      newPosition.z + 5
    );
    state.camera.lookAt(newPosition.x, newPosition.y, newPosition.z);
  });
  
  return (
    <mesh ref={playerRef} position={[position.x, position.y, position.z]} castShadow>
      <boxGeometry args={[1, 2, 1]} />
      <meshStandardMaterial color="red" />
    </mesh>
  );
};

// Simplified World component for debugging
const SimplifiedWorld = () => {
  return (
    <>
      {/* Simple ground plane */}
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, -0.5, 0]} receiveShadow>
        <planeGeometry args={[100, 100]} />
        <meshStandardMaterial color="#228B22" />
      </mesh>
      
      {/* Simple lighting */}
      <ambientLight intensity={0.4} />
      <directionalLight position={[10, 10, 5]} intensity={0.8} castShadow />
      
      {/* Basic environment objects */}
      <mesh position={[5, 1, -5]} castShadow>
        <boxGeometry args={[2, 2, 2]} />
        <meshStandardMaterial color="blue" />
      </mesh>
      
      <mesh position={[-5, 1, 5]} castShadow>
        <boxGeometry args={[2, 2, 2]} />
        <meshStandardMaterial color="green" />
      </mesh>
      
      <mesh position={[-5, 1, -5]} castShadow>
        <boxGeometry args={[2, 2, 2]} />
        <meshStandardMaterial color="yellow" />
      </mesh>
      
      {/* Player character */}
      <Player />
    </>
  );
};

// Simple loading fallback
const SimplifiedLoadingFallback = () => {
  return (
    <mesh position={[0, 0, 0]}>
      <boxGeometry args={[1, 1, 1]} />
      <meshStandardMaterial color="#FFFFFF" />
    </mesh>
  );
};

// Simplified UI
const SimplifiedUI = () => {
  return (
    <div className="fixed top-4 left-4 text-white bg-black bg-opacity-50 p-2 rounded">
      <h2>Voxel Game (Debug Mode)</h2>
      <p>WASD - Move | Space - Jump</p>
      <p>Camera automatically follows player</p>
    </div>
  );
};

// Clean & simplified App component
function App() {
  // Simplified keyboard controls
  const keyMap = [
    { name: Controls.forward, keys: ["KeyW", "ArrowUp"] },
    { name: Controls.backward, keys: ["KeyS", "ArrowDown"] },
    { name: Controls.left, keys: ["KeyA", "ArrowLeft"] },
    { name: Controls.right, keys: ["KeyD", "ArrowRight"] },
    { name: Controls.jump, keys: ["Space"] },
    { name: Controls.mine, keys: ["KeyE"] },
    { name: Controls.place, keys: ["KeyQ"] },
    { name: Controls.inventory, keys: ["KeyI"] },
    { name: Controls.sprint, keys: ["ShiftLeft"] },
  ];

  return (
    <div className="w-full h-full">
      <KeyboardControls map={keyMap}>
        <Canvas
          shadows
          camera={{
            position: [5, 5, 5], 
            fov: 70,
            near: 0.1,
            far: 1000
          }}
          gl={{
            antialias: true,
            powerPreference: "high-performance",
            alpha: false
          }}
          dpr={1} // Fixed DPR for reliability
        >
          <color attach="background" args={["#87CEEB"]} />
          <fog attach="fog" args={["#87CEEB", 30, 100]} />
          
          <Suspense fallback={<SimplifiedLoadingFallback />}>
            <SimplifiedWorld />
          </Suspense>
        </Canvas>
        <SimplifiedUI />
      </KeyboardControls>
    </div>
  );
}

export default App;