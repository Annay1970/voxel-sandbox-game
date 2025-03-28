import { Canvas } from "@react-three/fiber";
import { Suspense, useEffect } from "react";
import { KeyboardControls } from "@react-three/drei";
import * as THREE from "three";
import "@fontsource/inter";
import { Controls, useVoxelGame } from "./lib/stores/useVoxelGame";
import { useAudio } from "./lib/stores/useAudio";
import { generateTerrain } from "./lib/terrain";
import World from "./components/game/World";
import UI from "./components/game/UI";

// Loading screen while world generates
const LoadingScreen = () => {
  return (
    <div className="fixed inset-0 flex items-center justify-center bg-black bg-opacity-75 z-50 text-white">
      <div className="text-center">
        <h1 className="text-3xl font-bold mb-4">Generating World...</h1>
        <div className="w-64 h-2 bg-gray-700 rounded-full overflow-hidden">
          <div className="h-full bg-green-500 animate-pulse" style={{ width: '90%' }}></div>
        </div>
      </div>
    </div>
  );
};

// Simple loading fallback for 3D components
const LoadingFallback = () => {
  return (
    <mesh position={[0, 0, 0]}>
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
  
  // Set up audio
  const setBackgroundMusic = useAudio(state => state.setBackgroundMusic);
  const setHitSound = useAudio(state => state.setHitSound);
  const setSuccessSound = useAudio(state => state.setSuccessSound);

  // Initial world generation
  useEffect(() => {
    // Only generate if we don't already have chunks
    if (Object.keys(chunks).length === 0) {
      console.log("Initializing world generation...");
      
      // Generate initial terrain
      const { generatedChunks, generatedBlocks } = generateTerrain();
      
      // Set chunks and blocks in the game store
      setChunks(generatedChunks);
      setBlocks(generatedBlocks);
      
      // Load game sounds
      const bgMusic = new Audio('/sounds/background.mp3');
      bgMusic.loop = true;
      bgMusic.volume = 0.4;
      setBackgroundMusic(bgMusic);
      
      const hitSfx = new Audio('/sounds/hit.mp3');
      hitSfx.volume = 0.6;
      setHitSound(hitSfx);
      
      const successSfx = new Audio('/sounds/success.mp3');
      successSfx.volume = 0.7;
      setSuccessSound(successSfx);
    }
  }, [setChunks, setBlocks, chunks, setBackgroundMusic, setHitSound, setSuccessSound]);

  // Define keyboard controls
  const keyMap = [
    { name: Controls.forward, keys: ["KeyW", "ArrowUp"] },
    { name: Controls.backward, keys: ["KeyS", "ArrowDown"] },
    { name: Controls.left, keys: ["KeyA", "ArrowLeft"] },
    { name: Controls.right, keys: ["KeyD", "ArrowRight"] },
    { name: Controls.jump, keys: ["Space"] },
    { name: Controls.mine, keys: ["KeyE", "Mouse0"] }, // Left mouse click
    { name: Controls.place, keys: ["KeyQ", "Mouse2"] }, // Right mouse click
    { name: Controls.inventory, keys: ["KeyI", "KeyE"] },
    { name: Controls.sprint, keys: ["ShiftLeft"] },
  ];

  // Check if world is still loading
  const isLoading = Object.keys(chunks).length === 0;

  return (
    <div className="w-full h-full">
      {isLoading && <LoadingScreen />}
      
      <KeyboardControls map={keyMap}>
        <Canvas
          shadows
          camera={{
            position: [0, 30, 30], // Higher starting camera position to see terrain
            fov: 75,
            near: 0.1,
            far: 2000
          }}
          gl={{
            antialias: true,
            powerPreference: "high-performance",
            alpha: false,
            stencil: false, // Disable stencil for better performance
            depth: true,     // Enable depth for proper 3D
            logarithmicDepthBuffer: true // Better for voxel worlds
          }}
          dpr={[1, 1.5]} // Responsive DPR for better performance
          onCreated={({ gl }) => {
            gl.setClearColor(new THREE.Color('#87CEEB')); // Set clear color to blue sky
            console.log("WebGL renderer created successfully");
          }}
        >
          {/* Sky-colored background */}
          <color attach="background" args={["#87CEEB"]} />
          <fog attach="fog" args={["#87CEEB", 60, 200]} /> {/* Increased fog distances */}
          
          <ambientLight intensity={0.8} /> {/* Global light so everything is visible */}
          <directionalLight position={[10, 20, 10]} intensity={1.0} castShadow /> {/* Sun-like light */}
          
          {/* Render the voxel world */}
          <Suspense fallback={<LoadingFallback />}>
            <World />
          </Suspense>
        </Canvas>
        
        {/* Game UI overlay */}
        <UI />
      </KeyboardControls>
    </div>
  );
}

export default App;