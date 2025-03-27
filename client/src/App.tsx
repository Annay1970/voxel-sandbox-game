import { Canvas } from "@react-three/fiber";
import { Suspense, useState } from "react";
import { KeyboardControls, OrbitControls } from "@react-three/drei";
import "@fontsource/inter";
import { Controls } from "./lib/stores/useVoxelGame";

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
      
      {/* Debug controls */}
      <OrbitControls />
      
      {/* Simple cube for testing */}
      <mesh position={[0, 1, 0]} castShadow>
        <boxGeometry args={[1, 1, 1]} />
        <meshStandardMaterial color="blue" />
      </mesh>
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
      <p>WASD - Move | Space - Jump | E - Mine | Q - Place</p>
      <p>Orbit controls enabled - Use mouse to rotate camera</p>
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