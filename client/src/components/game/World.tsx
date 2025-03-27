import { useEffect, useRef, useState } from "react";
import { useThree } from "@react-three/fiber";
import * as THREE from "three";
import { Sky, Stars, OrbitControls } from "@react-three/drei";
import { useVoxelGame } from "../../lib/stores/useVoxelGame";
import Player from "./Player";
import Chunk from "./Chunk";
import Creature from "./Creature";
import { generateTerrain } from "../../lib/terrain";

export default function World() {
  const { scene } = useThree();
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
    // Add ambient light
    const ambientLight = new THREE.AmbientLight(0xffffff, 0.4);
    scene.add(ambientLight);
    
    // Add directional light (sun)
    const directionalLight = new THREE.DirectionalLight(0xffffff, 0.8);
    directionalLight.position.set(10, 20, 10);
    directionalLight.castShadow = true;
    
    // Configure shadow map
    directionalLight.shadow.mapSize.width = 1024;
    directionalLight.shadow.mapSize.height = 1024;
    directionalLight.shadow.camera.near = 0.5;
    directionalLight.shadow.camera.far = 50;
    directionalLight.shadow.camera.left = -20;
    directionalLight.shadow.camera.right = 20;
    directionalLight.shadow.camera.top = 20;
    directionalLight.shadow.camera.bottom = -20;
    
    scene.add(directionalLight);
    
    // Clean up lights on unmount
    return () => {
      scene.remove(ambientLight);
      scene.remove(directionalLight);
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
    sunPosition: new THREE.Vector3(
      Math.cos(timeOfDay * Math.PI * 2) * 100,
      Math.sin(timeOfDay * Math.PI * 2) * 100,
      0
    ),
    mieCoefficient: timeOfDay > 0.75 || timeOfDay < 0.25 ? 0.005 : 0.03,
    mieDirectionalG: 0.7,
    rayleigh: 0.5,
    turbidity: weather === 'rain' ? 10 : weather === 'cloudy' ? 5 : 2
  };
  
  const isNight = timeOfDay > 0.75 || timeOfDay < 0.25;
  
  const [debug, setDebug] = useState(true);

  return (
    <group ref={worldRef}>
      {/* Environment */}
      <Sky {...skyProps} />
      {isNight && <Stars radius={100} depth={50} count={1000} factor={4} />}
      
      {/* Debug controls */}
      {debug && <OrbitControls />}
      
      {/* Create a large ground plane */}
      <mesh 
        rotation={[-Math.PI / 2, 0, 0]} 
        position={[0, -0.5, 0]}
        receiveShadow
      >
        <planeGeometry args={[1000, 1000]} />
        <meshStandardMaterial color="#228B22" />
      </mesh>
      
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
        />
      ))}
      
      {/* Player */}
      {!debug && <Player />}
    </group>
  );
}
