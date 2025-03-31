import { useRef, useEffect, useMemo } from "react";
import * as THREE from "three";
import { useFrame } from "@react-three/fiber";
import { useVoxelGame } from "../../lib/stores/useVoxelGame";
import Player from "./Player";
import SkyDome from "./Sky";
import Creature from "./Creature";
import Weather from "./Weather";
import Watchtower from "./Watchtower";
import AncientRuins from "./AncientRuins";
import OptimizedChunk from "./OptimizedChunk";
import { ChunkEvent, getChunkManager } from "../../lib/services/ChunkManager";

/**
 * Network-optimized world component with dynamic chunk loading via web worker
 */
export default function OptimizedWorld() {
  // Get essential state
  const timeOfDay = useVoxelGame(state => state.timeOfDay);
  const weather = useVoxelGame(state => state.weather);
  const creatures = useVoxelGame(state => state.creatures);
  const playerPosition = useVoxelGame(state => state.player.position);
  
  // Reference for world group
  const worldRef = useRef<THREE.Group>(null);
  
  // Get singleton chunk manager instance
  const chunkManager = useMemo(() => getChunkManager(), []);
  
  // Set up chunk manager event listeners
  useEffect(() => {
    // Handle loaded chunks
    const onChunkLoaded = (data: any) => {
      console.log(`Chunk [${data.chunkX},${data.chunkZ}] loaded with ${Object.keys(data.blocks).length} blocks`);
    };
    
    // Handle unloaded chunks
    const onChunkUnloaded = (data: any) => {
      console.log(`Chunk [${data.chunkX},${data.chunkZ}] unloaded`);
    };
    
    // Subscribe to events
    const unsubscribeLoaded = chunkManager.on(ChunkEvent.CHUNK_LOADED, onChunkLoaded);
    const unsubscribeUnloaded = chunkManager.on(ChunkEvent.CHUNK_UNLOADED, onChunkUnloaded);
    
    // Clean up on unmount
    return () => {
      unsubscribeLoaded();
      unsubscribeUnloaded();
      // This would also dispose the chunk manager in a real app
      // but for development we keep the singleton alive
    };
  }, [chunkManager]);
  
  // Update chunks when player moves (frame independent)
  useEffect(() => {
    chunkManager.updateChunks(playerPosition[0], playerPosition[2]);
  }, [chunkManager, playerPosition]);
  
  // Monitor rendering performance
  useFrame(({ clock }) => {
    // Performance monitoring - throttle to avoid console spam
    if (Math.floor(clock.getElapsedTime() * 10) % 50 === 0) {
      const status = chunkManager.getLoadingStatus();
      console.log(
        `Rendering ${status.loadedChunks} chunks with ${status.totalBlocks} blocks ` +
        `(${status.pendingChunks} pending chunks)`
      );
    }
  });
  
  // Calculate player's current chunk
  const playerChunkX = Math.floor(playerPosition[0] / 16);
  const playerChunkZ = Math.floor(playerPosition[2] / 16);
  
  // Get visible chunks from the chunk manager
  const visibleChunks = useMemo(() => {
    return chunkManager.getVisibleChunks(playerPosition[0], playerPosition[2]);
  }, [chunkManager, playerPosition]);
  
  // Optimize creature rendering based on distance from player
  const visibleCreatures = useMemo(() => {
    return Object.values(creatures)
      .map(creature => {
        // Calculate distance from player
        const dx = creature.position.x - playerPosition[0];
        const dz = creature.position.z - playerPosition[2];
        const distance = Math.sqrt(dx * dx + dz * dz);
        
        return {
          ...creature,
          distance
        };
      })
      // Only render creatures within 40 blocks of player
      .filter(creature => creature.distance < 40)
      // Sort by distance for rendering priority
      .sort((a, b) => a.distance - b.distance);
  }, [creatures, playerPosition]);
  
  // Enhanced render with optimizations
  return (
    <group ref={worldRef}>
      {/* Basic sky */}
      <SkyDome timeOfDay={timeOfDay} weather={weather} />
      
      {/* Weather effects (rain, snow, lightning) */}
      <Weather />
      
      {/* Optimized chunks using instanced rendering */}
      {visibleChunks.map(chunk => (
        <OptimizedChunk
          key={`${chunk.x},${chunk.z}`}
          chunkData={chunk}
          playerChunkX={playerChunkX}
          playerChunkZ={playerChunkZ}
        />
      ))}
      
      {/* Optimized creature rendering */}
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
          leader={creature.leader}
        />
      ))}
      
      {/* Player */}
      <Player />
      
      {/* Landmark: Watchtower */}
      <Watchtower position={[30, 0, 30]} scale={[2.5, 2.5, 2.5]} />
      
      {/* Landmark: Ancient Ruins */}
      <AncientRuins position={[-40, 0, -40]} scale={[3, 3, 3]} />
      
      {/* Improved ambient light */}
      <ambientLight intensity={0.6} />
      
      {/* Improved directional light with better shadow settings */}
      <directionalLight
        position={[15, 20, 15]}
        intensity={0.8}
        color="#FFD580"
        castShadow
        shadow-mapSize-width={1024}
        shadow-mapSize-height={1024}
        shadow-camera-far={60}
        shadow-camera-left={-25}
        shadow-camera-right={25}
        shadow-camera-top={25}
        shadow-camera-bottom={-25}
      />
    </group>
  );
}