import { Canvas } from "@react-three/fiber";
import { Suspense, useEffect, useState } from "react";
import { KeyboardControls } from "@react-three/drei";
import * as THREE from "three";
import "@fontsource/inter";
import { Controls, useVoxelGame } from "./lib/stores/useVoxelGame";
import { useAudio } from "./lib/stores/useAudio";
import { generateTerrain } from "./lib/terrain";
import World from "./components/game/World";
import UI from "./components/game/UI";
import { GameMonitoringSystem } from "./components/monitoring";

// Ultra simplified loading screen for better performance
interface LoadingScreenProps {
  progress: number;
}

const LoadingScreen = ({ progress }: LoadingScreenProps) => {
  // Simplified messages
  let message = "Loading - Please Wait...";
  
  return (
    <div className="fixed inset-0 flex items-center justify-center bg-black bg-opacity-90 z-50 text-white">
      <div className="text-center">
        <h1 className="text-3xl font-bold mb-4">{message}</h1>
        <div className="w-64 h-4 bg-gray-700 rounded-full overflow-hidden">
          <div 
            className="h-full bg-green-500" 
            style={{ width: `${progress}%` }}
          />
        </div>
        <p className="mt-2 text-gray-300">{progress}% Complete</p>
      </div>
    </div>
  );
};

// Ultra simple loading fallback
const LoadingFallback = () => {
  return (
    <mesh>
      <boxGeometry args={[1, 1, 1]} />
      <meshStandardMaterial color="#FFFFFF" />
    </mesh>
  );
};

function App() {
  // Game state from store
  const setChunks = useVoxelGame(state => state.setChunks);
  const setBlocks = useVoxelGame(state => state.setBlocks);
  const chunks = useVoxelGame(state => state.chunks);
  
  // Only use minimal required sounds
  const setSound = useAudio(state => state.setSound);

  // Loading state
  const [isLoading, setIsLoading] = useState(true);
  const [loadingProgress, setLoadingProgress] = useState(0);
  
  // EMERGENCY MODE: Minimal world generation 
  useEffect(() => {
    // Only generate if we don't already have chunks
    if (Object.keys(chunks).length === 0) {
      console.log("EMERGENCY MODE: Generating minimal world...");
      
      // Immediate generation with simplified steps
      try {
        // Step 1: Generate terrain (80%)
        setLoadingProgress(20);
        const { generatedChunks, generatedBlocks } = generateTerrain();
        setLoadingProgress(80);
        
        // Step 2: Apply to store (100%)
        setChunks(generatedChunks as Record<string, { x: number, z: number }>);
        setBlocks(generatedBlocks);
        setLoadingProgress(100);
        
        // Only load absolutely essential sounds
        try {
          // Just load the minimum required sounds
          const hitSfx = new Audio('/sounds/hit.mp3');
          hitSfx.volume = 0.6;
          setSound('hitSound', hitSfx);
        } catch (e) {
          console.warn("Sound loading error:", e);
        }
        
        // Complete loading
        setIsLoading(false);
      } catch (e) {
        console.error("Critical error during world generation:", e);
        // If terrain generation fails, still attempt to show UI
        setLoadingProgress(100);
        setIsLoading(false);
      }
    } else {
      // Already have chunks, no need to load
      setIsLoading(false);
    }
  }, [setChunks, setBlocks, chunks, setSound]);

  // Complete keyboard controls
  const keyMap = [
    { name: Controls.forward, keys: ["KeyW", "ArrowUp"] },
    { name: Controls.back, keys: ["KeyS", "ArrowDown"] },
    { name: Controls.left, keys: ["KeyA", "ArrowLeft"] },
    { name: Controls.right, keys: ["KeyD", "ArrowRight"] },
    { name: Controls.jump, keys: ["Space"] },
    { name: Controls.sprint, keys: ["ShiftLeft"] },
    { name: Controls.attack, keys: ["KeyF"] }, // F key for attacking
    { name: Controls.place, keys: ["KeyE"] }, // E key for placing
  ];

  return (
    <div className="w-full h-full">
      {isLoading && (
        <LoadingScreen progress={loadingProgress} />
      )}
      
      <KeyboardControls map={keyMap}>
        <Canvas
          shadows={false} // Disable shadows for performance
          camera={{
            position: [0, 50, 0], 
            fov: 75,
            near: 0.1,
            far: 500 // Reduced for performance
          }}
          gl={{
            antialias: false, // Disable for performance
            powerPreference: "high-performance",
            alpha: false,
            stencil: false,
            depth: true,
            logarithmicDepthBuffer: false // Disable for performance
          }}
          dpr={1} // Lowest resolution for performance
          style={{ background: "#87CEEB" }}
          onCreated={({ gl, scene, camera }) => {
            gl.setClearColor(new THREE.Color('#87CEEB'));
            
            // Set the sky color for the scene background
            scene.background = new THREE.Color('#87CEEB');
            
            // Disable shadows
            gl.shadowMap.enabled = false;
            
            // Set up camera
            camera.lookAt(0, 2, -1);
          }}
        >
          {/* Minimal scene */}
          <Suspense fallback={<LoadingFallback />}>
            {/* The World component contains everything */}
            <World />
            
            {/* Minimal lighting for performance */}
            <ambientLight intensity={0.7} />
            <directionalLight
              position={[0, 100, 0]}
              intensity={1.0}
              castShadow={false}
            />
          </Suspense>
        </Canvas>
        
        {/* Game UI overlay */}
        <UI />
        
        {/* Game Monitoring System */}
        <GameMonitoringSystem />
      </KeyboardControls>
    </div>
  );
}

export default App;