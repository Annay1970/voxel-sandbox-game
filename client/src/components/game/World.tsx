import { useEffect, useRef, useState, useMemo } from "react";
import { useThree, useFrame } from "@react-three/fiber";
import * as THREE from "three";
import { Sky, Stars, OrbitControls } from "@react-three/drei";
import { useVoxelGame } from "../../lib/stores/useVoxelGame";
import Player from "./Player";
import Chunk from "./Chunk";
import Creature from "./Creature";
import Rock from "./Rock";
import SkyDome from "./Sky";
import { generateTerrain } from "../../lib/terrain";
import { useErrorTracking, updatePerformanceMetrics } from "../../lib/utils/errorTracker";
import { textureManager } from "../../lib/utils/textureManager";
import { BlockType } from "../../lib/blocks";

export default function World() {
  const { scene, gl } = useThree();
  const chunks = useVoxelGame(state => state.chunks);
  const blocks = useVoxelGame(state => state.blocks);
  const creatures = useVoxelGame(state => state.creatures);
  const timeOfDay = useVoxelGame(state => state.timeOfDay);
  const weather = useVoxelGame(state => state.weather);
  const setChunks = useVoxelGame(state => state.setChunks);
  const setBlocks = useVoxelGame(state => state.setBlocks);
  const addBlock = useVoxelGame(state => state.addBlock);
  const incrementTime = useVoxelGame(state => state.incrementTime);
  const updateCreatures = useVoxelGame(state => state.updateCreatures);
  
  const generatedRef = useRef(false);
  const worldRef = useRef<THREE.Group>(null);
  
  // Track errors in the World component
  const { trackError } = useErrorTracking('World');
  
  // Monitor renderer performance and potential errors
  useEffect(() => {
    const canvas = gl.domElement;
    
    // Track WebGL context loss
    const handleContextLost = (event: Event) => {
      event.preventDefault();
      trackError(new Error('WebGL context lost'), { 
        renderer: gl.info.render,
        memory: gl.info.memory,
        programs: gl.info.programs
      });
    };
    
    // Track WebGL context restore
    const handleContextRestored = () => {
      trackError(new Error('WebGL context restored - reloading required'), {
        action: 'reload_recommended'
      });
    };
    
    canvas.addEventListener('webglcontextlost', handleContextLost);
    canvas.addEventListener('webglcontextrestored', handleContextRestored);
    
    return () => {
      canvas.removeEventListener('webglcontextlost', handleContextLost);
      canvas.removeEventListener('webglcontextrestored', handleContextRestored);
    };
  }, [gl, trackError]);
  
  // Performance monitoring in the render loop
  useFrame(() => {
    // Update performance metrics
    updatePerformanceMetrics();
    
    // Check for graphics memory issues
    if (gl.info.memory && gl.info.memory.geometries > 10000) {
      trackError(
        new Error(`High geometry count: ${gl.info.memory.geometries}`),
        { memory: gl.info.memory }
      );
    }
    
    if (gl.info.memory && gl.info.memory.textures > 100) {
      trackError(
        new Error(`High texture count: ${gl.info.memory.textures}`),
        { memory: gl.info.memory }
      );
    }
  });

  // Generate initial world and load textures
  useEffect(() => {
    if (generatedRef.current) return;
    
    console.log("Initializing world generation...");
    
    // Load textures first
    (async () => {
      console.log("Loading block textures...");
      try {
        await textureManager.loadTextures();
        console.log("Texture loading complete");
      } catch (error) {
        console.error("Error loading textures:", error);
        trackError(new Error('Texture loading failed'), { cause: error });
      }
      
      // Then generate world after textures are ready
      try {
        const { generatedChunks, generatedBlocks } = generateTerrain();
        
        if (!generatedChunks || !generatedBlocks || Object.keys(generatedChunks).length === 0) {
          console.error("World generation produced empty results, using fallback terrain");
          
          // Create a minimal fallback terrain
          const fallbackChunks: Record<string, { x: number, z: number }> = { '0,0': { x: 0, z: 0 } };
          const fallbackBlocks: Record<string, BlockType> = {};
          
          // Create a 16x16 platform at y=20
          for (let x = -8; x < 8; x++) {
            for (let z = -8; z < 8; z++) {
              fallbackBlocks[`${x},19,${z}`] = 'stone';
              fallbackBlocks[`${x},20,${z}`] = 'grass';
            }
          }
          
          setChunks(fallbackChunks);
          setBlocks(fallbackBlocks);
        } else {
          setChunks(generatedChunks);
          setBlocks(generatedBlocks);
          console.log(`World generation complete: ${Object.keys(generatedBlocks).length} blocks created`);
        }
      } catch (error) {
        console.error("Failed to generate terrain:", error);
        
        // Create emergency flat platform
        const emergencyChunks: Record<string, { x: number, z: number }> = { '0,0': { x: 0, z: 0 } };
        const emergencyBlocks: Record<string, BlockType> = {};
        
        // Create a 16x16 platform at y=20
        for (let x = -8; x < 8; x++) {
          for (let z = -8; z < 8; z++) {
            emergencyBlocks[`${x},19,${z}`] = 'stone';
            emergencyBlocks[`${x},20,${z}`] = 'grass';
          }
        }
        
        setChunks(emergencyChunks);
        setBlocks(emergencyBlocks);
        console.log("Generated emergency terrain due to error");
      }
      
      generatedRef.current = true;
    })();
  }, [setChunks, setBlocks, trackError]);
  
  // Set up ambient and directional light
  useEffect(() => {
    // Add bright ambient light to make everything visible
    const ambientLight = new THREE.AmbientLight(0xffffff, 0.7);
    scene.add(ambientLight);
    
    // Add directional light (sun) with strong intensity
    const directionalLight = new THREE.DirectionalLight(0xffffff, 1.0);
    directionalLight.position.set(10, 20, 10);
    directionalLight.castShadow = true;
    
    // Configure shadow map
    directionalLight.shadow.mapSize.width = 1024;
    directionalLight.shadow.mapSize.height = 1024;
    directionalLight.shadow.camera.near = 0.5;
    directionalLight.shadow.camera.far = 500; // Extended far plane
    directionalLight.shadow.camera.left = -50; // Wider frustum
    directionalLight.shadow.camera.right = 50;
    directionalLight.shadow.camera.top = 50;
    directionalLight.shadow.camera.bottom = -50;
    
    scene.add(directionalLight);
    
    // Add a secondary light from another angle to prevent dark shadows
    const secondaryLight = new THREE.DirectionalLight(0xffffff, 0.5);
    secondaryLight.position.set(-10, 15, -10);
    scene.add(secondaryLight);
    
    // Add hemisphere light for better ambient lighting that looks natural
    const hemisphereLight = new THREE.HemisphereLight(0xffffbb, 0x080820, 0.5);
    scene.add(hemisphereLight);
    
    console.log("Enhanced lighting setup complete");
    
    // Clean up lights on unmount
    return () => {
      scene.remove(ambientLight);
      scene.remove(directionalLight);
      scene.remove(secondaryLight);
      scene.remove(hemisphereLight);
    };
  }, [scene]);
  
  // Update time of day and creatures
  useEffect(() => {
    const interval = setInterval(() => {
      incrementTime();
      updateCreatures();
    }, 1000);
    
    return () => clearInterval(interval);
  }, [incrementTime, updateCreatures]);
  
  // Compute visible chunks
  const visibleChunks = Object.keys(chunks).map(chunkKey => {
    const [x, z] = chunkKey.split(',').map(Number);
    return { x, z };
  });
  
  // Compute visible creatures
  const visibleCreatures = Object.values(creatures);
  
  // Calculate sky and lighting based on time of day
  const skyProps = {
    distance: 450000, // Increase sky distance for better visibility
    sunPosition: new THREE.Vector3(
      Math.cos(timeOfDay * Math.PI * 2) * 100,
      Math.sin(timeOfDay * Math.PI * 2) * 100,
      0
    ),
    mieCoefficient: timeOfDay > 0.75 || timeOfDay < 0.25 ? 0.005 : 0.03,
    mieDirectionalG: 0.8,
    rayleigh: 0.5,
    turbidity: weather === 'rain' ? 10 : weather === 'cloudy' ? 5 : 2,
    inclination: 0.5,
    azimuth: 0.25
  };
  
  const isNight = timeOfDay > 0.75 || timeOfDay < 0.25;
  
  // Set debug mode to false for normal gameplay
  const [debug, setDebug] = useState(false);

  // Set up debug mode toggle (press 'F3')
  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'F3') {
        setDebug(prevDebug => !prevDebug);
      }
    };
    
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);
  
  // Generate rock decorations across the landscape
  // We use useMemo to create rocks at fixed positions, ensuring they don't regenerate on every render
  const rockDecorations = useMemo(() => {
    console.log("Generating rock decorations");
    const rocks = [];
    const rockCount = 15; // Number of rocks to place
    
    // Generate rocks with some randomness but deterministically
    // We use a seed-like approach to position them
    const seed = 42; // Fixed seed for consistent generation
    
    for (let i = 0; i < rockCount; i++) {
      // Generate pseudo-random positions based on the rock index and seed
      const rockSeed = seed + i * 7919; // Use a prime number to add variety
      
      // Create a simple hash function for position generation
      const hashX = Math.sin(rockSeed * 0.1) * 10000;
      const hashZ = Math.cos(rockSeed * 0.1) * 10000;
      
      // Generate positions within reasonable range of the world
      const x = Math.floor((hashX - Math.floor(hashX)) * 64) - 32;
      const z = Math.floor((hashZ - Math.floor(hashZ)) * 64) - 32;
      
      // Determine rock height based on terrain - place on top of blocks
      let y = 0;
      let foundSurface = false;
      
      // Scan from y=70 down to find the highest solid block
      for (let checkY = 70; checkY >= 0; checkY--) {
        const blockKey = `${x},${checkY},${z}`;
        if (blocks[blockKey] && blocks[blockKey] !== 'air' && blocks[blockKey] !== 'water') {
          y = checkY + 1; // Place rock on top of this block
          foundSurface = true;
          break;
        }
      }
      
      // Only add rock if we found a surface to place it on
      if (foundSurface) {
        // Determine rock variant (0-2) based on position
        const variant = Math.abs((x * z) % 3);
        
        // Randomize rock rotation and scale for variety
        const rotation: [number, number, number] = [
          0, 
          (hashX - Math.floor(hashX)) * Math.PI * 2, // Random rotation 0-2π
          0
        ];
        
        // Slightly randomize scale
        const baseScale = 1.0 + (hashZ - Math.floor(hashZ)) * 1.5;
        const scale: [number, number, number] = [
          baseScale + (variant * 0.2),
          baseScale, 
          baseScale + (variant * 0.2)
        ];
        
        rocks.push({
          position: [x, y, z] as [number, number, number],
          rotation,
          scale,
          variant
        });
      }
    }
    
    console.log(`Generated ${rocks.length} rock decorations`);
    return rocks;
  }, [blocks]); // Only recalculate if the blocks change

  return (
    <group ref={worldRef}>
      {/* Environment with custom sky */}
      <SkyDome timeOfDay={timeOfDay} weather={weather} />
      {isNight && <Stars radius={100} depth={50} count={1000} factor={4} />}
      
      {/* Debug controls (press F3 to toggle) */}
      {debug && <OrbitControls />}
      
      {/* We don't need the flat ground plane when we have voxel terrain */}
      
      {/* Render chunks */}
      {visibleChunks.map(chunk => (
        <Chunk 
          key={`${chunk.x},${chunk.z}`} 
          chunkX={chunk.x} 
          chunkZ={chunk.z} 
          blocks={blocks}
        />
      ))}
      
      {/* Creatures */}
      {visibleCreatures.map(creature => (
        <Creature 
          key={creature.id}
          type={creature.type}
          position={creature.position}
          rotation={creature.rotation}
          state={creature.state}
          mood={creature.mood}
          animationState={creature.animationState}
          animationSpeed={creature.animationSpeed}
          animationProgress={creature.animationProgress}
          flockId={creature.flockId}
          leader={creature.leader}
        />
      ))}
      
      {/* Decorative rocks scattered around the terrain */}
      {rockDecorations.map((rock, index) => (
        <Rock 
          key={`rock-${index}`}
          position={rock.position}
          scale={rock.scale}
          rotation={rock.rotation}
          variant={rock.variant}
        />
      ))}
      
      {/* Player - enable in normal mode */}
      {<Player />}
    </group>
  );
}
