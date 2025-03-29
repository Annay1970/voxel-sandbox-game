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
    { name: Controls.attack, keys: ["KeyF", "Mouse0"] }, // Attack with F or left mouse click
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
            position: [0, 50, 0], // Start high above ground to see terrain (will be controlled by Player component)
            fov: 75, // Minecraft-like FOV
            near: 0.1,
            far: 2000
          }}
          gl={{
            antialias: true,
            powerPreference: "high-performance",
            alpha: false,
            stencil: false,
            depth: true,
            logarithmicDepthBuffer: true
          }}
          dpr={window.devicePixelRatio > 1 ? 1.5 : 1} // Balance between quality and performance
          style={{ background: "#87CEEB" }} // Set background via CSS too
          onCreated={({ gl, scene, camera }) => {
            gl.setClearColor(new THREE.Color('#87CEEB')); // Set WebGL clear color
            console.log("WebGL renderer created successfully");
            
            // Set the sky color for the scene background
            scene.background = new THREE.Color('#87CEEB');
            
            // Enable shadow mapping with better quality settings
            gl.shadowMap.enabled = true;
            gl.shadowMap.type = THREE.PCFSoftShadowMap;
            
            // Set up camera for first-person view
            camera.lookAt(0, 2, -1); // Look slightly forward
            
            // Add event listener to handle WebGL context loss and recovery
            gl.domElement.addEventListener('webglcontextlost', (event) => {
              event.preventDefault();
              console.warn('WebGL context lost. Trying to restore...');
            });
            
            gl.domElement.addEventListener('webglcontextrestored', () => {
              console.log('WebGL context restored successfully');
            });
            
            // Log WebGL capabilities to help debug
            console.log("WebGL capabilities:", {
              maxTextures: gl.capabilities.maxTextures,
              precision: gl.capabilities.precision,
              maxAttributes: gl.capabilities.maxAttributes,
              maxVaryings: gl.capabilities.maxVaryings,
              maxFragmentUniforms: gl.capabilities.maxFragmentUniforms,
              maxVertexUniforms: gl.capabilities.maxVertexUniforms
            });
          }}
        >
          {/* Minimal scene to guarantee something renders */}
          <Suspense fallback={<LoadingFallback />}>
            {/* The World component contains everything */}
            <World />
            
            {/* Starting point marker (debug) */}
            <mesh position={[5, 1, 5]} scale={0.5}>
              <boxGeometry args={[1, 1, 1]} />
              <meshStandardMaterial color="red" emissive="red" emissiveIntensity={0.5} /> 
            </mesh>

            {/* Initial player starting point (debug) */}
            <mesh position={[0, 0.5, 0]} scale={0.5}>
              <sphereGeometry args={[1, 16, 16]} />
              <meshStandardMaterial color="blue" emissive="blue" emissiveIntensity={0.5} /> 
            </mesh>
            
            {/* More realistic lighting for outdoor scene */}
            <ambientLight intensity={0.5} /> {/* Soft ambient light */}
            <directionalLight
              position={[100, 100, 0]}
              intensity={1.0}
              castShadow
              shadow-mapSize-width={2048}
              shadow-mapSize-height={2048}
              shadow-camera-far={500}
              shadow-camera-left={-100}
              shadow-camera-right={100}
              shadow-camera-top={100}
              shadow-camera-bottom={-100}
            />
            {/* Day cycle directional light acting as the sun */}
            <directionalLight
              position={[-50, 100, -50]}
              intensity={0.7}
              color="#ffedd5"
            />
          </Suspense>
        </Canvas>
        
        {/* Game UI overlay */}
        <UI />
      </KeyboardControls>
    </div>
  );
}

export default App;