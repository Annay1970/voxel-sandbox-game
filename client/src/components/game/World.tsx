import { useRef } from "react";
import * as THREE from "three";
import { useVoxelGame } from "../../lib/stores/useVoxelGame";
import Player from "./Player";
import Chunk from "./Chunk";
import SkyDome from "./Sky";

// Minimal World component for emergency performance mode
export default function World() {
  const chunks = useVoxelGame(state => state.chunks);
  const blocks = useVoxelGame(state => state.blocks);
  const timeOfDay = useVoxelGame(state => state.timeOfDay);
  const weather = useVoxelGame(state => state.weather);
  
  const worldRef = useRef<THREE.Group>(null);
  
  // Compute visible chunks - minimal code
  const visibleChunks = Object.keys(chunks).map(chunkKey => {
    const [x, z] = chunkKey.split(',').map(Number);
    return { x, z };
  });
  
  // Super minimized render
  return (
    <group ref={worldRef}>
      {/* Basic sky */}
      <SkyDome timeOfDay={timeOfDay} weather={weather} />
      
      {/* Only essential chunks */}
      {visibleChunks.map(chunk => (
        <Chunk 
          key={`${chunk.x},${chunk.z}`} 
          chunkX={chunk.x} 
          chunkZ={chunk.z} 
          blocks={blocks}
        />
      ))}
      
      {/* Player */}
      <Player />
      
      {/* Improved ambient light */}
      <ambientLight intensity={0.6} />
      
      {/* Improved directional light */}
      <directionalLight
        position={[15, 20, 15]}
        intensity={0.8}
        color="#FFD580"
        castShadow
        shadow-mapSize-width={512}
        shadow-mapSize-height={512}
        shadow-camera-far={50}
        shadow-camera-left={-15}
        shadow-camera-right={15}
        shadow-camera-top={15}
        shadow-camera-bottom={-15}
      />
    </group>
  );
}
