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
  const setSound = useAudio(state => state.setSound);

  // Initial world generation
  useEffect(() => {
    // Only generate if we don't already have chunks
    if (Object.keys(chunks).length === 0) {
      console.log("Initializing world generation...");
      
      // Generate initial terrain
      const { generatedChunks, generatedBlocks } = generateTerrain();
      
      // Set chunks and blocks in the game store
      // Cast to ensure type compatibility
      setChunks(generatedChunks as Record<string, { x: number, z: number }>);
      setBlocks(generatedBlocks);
      
      // Load game sounds
      const bgMusic = new Audio('/sounds/background.mp3');
      bgMusic.loop = true;
      bgMusic.volume = 0.4;
      setSound('backgroundMusic', bgMusic);
      
      const hitSfx = new Audio('/sounds/hit.mp3');
      hitSfx.volume = 0.6;
      setSound('hitSound', hitSfx);
      
      const successSfx = new Audio('/sounds/success.mp3');
      successSfx.volume = 0.7;
      setSound('successSound', successSfx);
      
      // Basic movement sounds
      const walkSfx = new Audio('/sounds/walk.mp3');
      setSound('walkSound', walkSfx);
      
      try {
        // Additional movement sounds for different terrains
        const walkSandSfx = new Audio('/sounds/blocks/sand_step.mp3');
        setSound('walkSandSound', walkSandSfx);
        
        const walkStoneSfx = new Audio('/sounds/blocks/stone_step.mp3');
        setSound('walkStoneSound', walkStoneSfx);
        
        const walkWoodSfx = new Audio('/sounds/blocks/wood_step.mp3');
        setSound('walkWoodSound', walkWoodSfx);
        
        // Jump and landing
        const jumpSfx = new Audio('/sounds/jump.mp3');
        setSound('jumpSound', jumpSfx);
        
        const landSfx = new Audio('/sounds/land.mp3');
        setSound('landSound', landSfx);
      } catch (e) {
        console.warn("Could not load some step sounds, using fallbacks.");
      }
      
      // Water-related sounds
      try {
        const swimSfx = new Audio('/sounds/swim.mp3');
        setSound('swimSound', swimSfx);
        
        const splashSfx = new Audio('/sounds/splash.mp3');
        setSound('splashSound', splashSfx);
        
        const waterAmbientSfx = new Audio('/sounds/ambient/water.mp3');
        setSound('waterAmbient', waterAmbientSfx);
      } catch (e) {
        console.warn("Could not load water sounds, using fallbacks.");
      }
      
      // Block interaction sounds
      const placeSfx = new Audio('/sounds/place.mp3');
      setSound('placeSound', placeSfx);
      
      const breakSfx = new Audio('/sounds/break.mp3');
      setSound('breakSound', breakSfx);
      
      try {
        // Specialized dig sounds
        const digDirtSfx = new Audio('/sounds/blocks/dirt_dig.mp3');
        setSound('digDirtSound', digDirtSfx);
        
        const digStoneSfx = new Audio('/sounds/blocks/stone_dig.mp3');
        setSound('digStoneSound', digStoneSfx);
        
        const digWoodSfx = new Audio('/sounds/blocks/wood_dig.mp3');
        setSound('digWoodSound', digWoodSfx);
      } catch (e) {
        console.warn("Could not load dig sounds, using fallbacks.");
      }
      
      // Combat sounds
      const attackSfx = new Audio('/sounds/attack.mp3');
      setSound('attackSound', attackSfx);
      
      const damageSfx = new Audio('/sounds/damage.mp3');
      setSound('damageSound', damageSfx);
      
      try {
        const deathSfx = new Audio('/sounds/death.mp3');
        setSound('deathSound', deathSfx);
      } catch (e) {
        console.warn("Could not load death sound, using fallback.");
      }
      
      // UI sounds
      try {
        const uiClickSfx = new Audio('/sounds/ui/click.mp3');
        setSound('uiClickSound', uiClickSfx);
        
        const inventoryOpenSfx = new Audio('/sounds/ui/inventory.mp3');
        setSound('inventoryOpenSound', inventoryOpenSfx);
        
        const craftingSfx = new Audio('/sounds/ui/craft.mp3');
        setSound('craftingSound', craftingSfx);
      } catch (e) {
        console.warn("Could not load UI sounds, using fallbacks.");
      }
      
      // Ambient sounds
      const ambientDaySfx = new Audio('/sounds/ambient_day.mp3');
      setSound('ambientDay', ambientDaySfx);
      
      const ambientNightSfx = new Audio('/sounds/ambient_night.mp3');
      setSound('ambientNight', ambientNightSfx);
      
      const rainSfx = new Audio('/sounds/rain.mp3');
      setSound('rainSound', rainSfx);
      
      const thunderSfx = new Audio('/sounds/thunder.mp3');
      setSound('thunderSound', thunderSfx);
      
      try {
        // Cave ambient sound
        const caveAmbientSfx = new Audio('/sounds/ambient/cave.mp3');
        setSound('caveAmbient', caveAmbientSfx);
      } catch (e) {
        console.warn("Could not load cave ambient sound, using fallback.");
      }
      
      // Creature sounds
      try {
        // Passive creatures
        const cowSfx = new Audio('/sounds/creatures/cow.mp3');
        setSound('cowSound', cowSfx);
        
        const sheepSfx = new Audio('/sounds/creatures/sheep.mp3');
        setSound('sheepSound', sheepSfx);
        
        const pigSfx = new Audio('/sounds/creatures/pig.mp3');
        setSound('pigSound', pigSfx);
        
        const chickenSfx = new Audio('/sounds/creatures/chicken.mp3');
        setSound('chickenSound', chickenSfx);
        
        // Hostile creatures
        const zombieSfx = new Audio('/sounds/creatures/zombie.mp3');
        setSound('zombieSound', zombieSfx);
        
        const zombieHurtSfx = new Audio('/sounds/creatures/zombie_hurt.mp3');
        setSound('zombieHurtSound', zombieHurtSfx);
        
        const skeletonSfx = new Audio('/sounds/creatures/skeleton.mp3');
        setSound('skeletonSound', skeletonSfx);
        
        const spiderSfx = new Audio('/sounds/creatures/spider.mp3');
        setSound('spiderSound', spiderSfx);
        
        const beeSfx = new Audio('/sounds/creatures/bee.mp3');
        setSound('beeSound', beeSfx);
      } catch (e) {
        console.warn("Could not load some creature sounds, using fallbacks.");
      }
    }
  }, [setChunks, setBlocks, chunks, setSound]);

  // Define keyboard controls
  const keyMap = [
    { name: Controls.forward, keys: ["KeyW", "ArrowUp"] },
    { name: Controls.back, keys: ["KeyS", "ArrowDown"] },
    { name: Controls.left, keys: ["KeyA", "ArrowLeft"] },
    { name: Controls.right, keys: ["KeyD", "ArrowRight"] },
    { name: Controls.jump, keys: ["Space"] },
    { name: Controls.place, keys: ["KeyQ", "Mouse2"] }, // Right mouse click
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