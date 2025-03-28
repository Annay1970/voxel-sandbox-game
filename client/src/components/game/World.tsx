import { useEffect, useRef, useState } from "react";
import { useThree, useFrame } from "@react-three/fiber";
import * as THREE from "three";
import { Sky, Stars, OrbitControls } from "@react-three/drei";
import { useVoxelGame } from "../../lib/stores/useVoxelGame";
import Player from "./Player";
import Chunk from "./Chunk";
import Creature from "./Creature";
import { generateTerrain } from "../../lib/terrain";
import { useErrorTracking, updatePerformanceMetrics } from "../../lib/utils/errorTracker";

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

  // Generate initial world
  useEffect(() => {
    if (generatedRef.current) return;
    
    console.log("Generating world...");
    const { generatedChunks, generatedBlocks } = generateTerrain();
    
    setChunks(generatedChunks);
    setBlocks(generatedBlocks);
    
    generatedRef.current = true;
    console.log("World generation complete");
  }, [setChunks, setBlocks]);
  
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

  return (
    <group ref={worldRef}>
      {/* Environment */}
      <Sky {...skyProps} />
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
      
      {/* Player - enable in normal mode */}
      {<Player />}
    </group>
  );
}
