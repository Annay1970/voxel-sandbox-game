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
      
      {/* Basic ambient light */}
      <ambientLight intensity={0.7} />
      
      {/* Basic directional light */}
      <directionalLight
        position={[0, 10, 0]}
        intensity={1.0}
        castShadow={false}
      />
    </group>
  );
}
