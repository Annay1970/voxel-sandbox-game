import { useRef, useEffect, useMemo } from "react";
import * as THREE from "three";
import { useFrame } from "@react-three/fiber";
import { useVoxelGame } from "../../lib/stores/useVoxelGame";
import { CHUNK_SIZE } from "./Chunk"; 
import Player from "./Player";
import Chunk from "./Chunk";
import SkyDome from "./Sky";
import Creature from "./Creature";
import Weather from "./Weather";
import Watchtower from "./Watchtower";

// Enhanced World component with dynamic chunk loading
export default function World() {
  const generateChunk = useVoxelGame(state => state.generateChunk);
  const chunks = useVoxelGame(state => state.chunks);
  const blocks = useVoxelGame(state => state.blocks);
  const timeOfDay = useVoxelGame(state => state.timeOfDay);
  const weather = useVoxelGame(state => state.weather);
  const creatures = useVoxelGame(state => state.creatures);
  const playerPosition = useVoxelGame(state => state.player.position);
  const setChunks = useVoxelGame(state => state.setChunks);
  
  const worldRef = useRef<THREE.Group>(null);
  const loadingChunksRef = useRef<Set<string>>(new Set());
  const lastPlayerChunkRef = useRef<{x: number, z: number} | null>(null);
  
  // Constants for chunk loading
  const CHUNK_RENDER_DISTANCE = 5;
  const CHUNK_LOAD_DISTANCE = 6;  // Load chunks a bit farther than render distance
  const CHUNK_UNLOAD_DISTANCE = 8; // Keep chunks in memory slightly longer than load distance
  
  // Calculate player's current chunk
  const playerChunkX = Math.floor(playerPosition[0] / CHUNK_SIZE);
  const playerChunkZ = Math.floor(playerPosition[2] / CHUNK_SIZE);
  
  // Dynamic chunk loading based on player position
  useEffect(() => {
    const currentPlayerChunk = { x: playerChunkX, z: playerChunkZ };
    const lastPlayerChunk = lastPlayerChunkRef.current;
    
    // Only trigger chunk updates if player changed chunks or first load
    if (!lastPlayerChunk || 
        lastPlayerChunk.x !== currentPlayerChunk.x || 
        lastPlayerChunk.z !== currentPlayerChunk.z) {
      
      // Update last known player chunk
      lastPlayerChunkRef.current = currentPlayerChunk;
      
      // Schedule chunk loading
      requestAnimationFrame(() => {
        // Get chunks to load
        const chunksToLoad = calculateChunksToLoad(
          playerChunkX, 
          playerChunkZ, 
          CHUNK_LOAD_DISTANCE
        );
        
        // Filter to only load chunks that don't exist yet
        const newChunksToLoad = chunksToLoad.filter(chunkKey => 
          !chunks[chunkKey] && !loadingChunksRef.current.has(chunkKey)
        );
        
        // Mark chunks as loading to prevent duplicate generation attempts
        newChunksToLoad.forEach(chunkKey => {
          loadingChunksRef.current.add(chunkKey);
          
          // Extract coordinates
          const [chunkX, chunkZ] = chunkKey.split(',').map(Number);
          
          // Generate chunk (this is async)
          generateChunk(chunkX, chunkZ);
        });
        
        // Unload distant chunks to save memory
        const chunksToKeep = calculateChunksToLoad(
          playerChunkX, 
          playerChunkZ, 
          CHUNK_UNLOAD_DISTANCE
        );
        
        // Filter existing chunks to identify those to unload
        const chunksToUnload = Object.keys(chunks).filter(
          chunkKey => !chunksToKeep.includes(chunkKey)
        );
        
        // If there are chunks to unload, create a new chunks object without them
        if (chunksToUnload.length > 0) {
          const newChunks = { ...chunks };
          chunksToUnload.forEach(chunkKey => {
            delete newChunks[chunkKey];
          });
          
          // Update chunks in store
          setChunks(newChunks);
        }
      });
    }
  }, [playerChunkX, playerChunkZ, chunks, generateChunk, setChunks]);
  
  // Helper function to calculate needed chunks
  function calculateChunksToLoad(centerX: number, centerZ: number, distance: number): string[] {
    const chunksToLoad: string[] = [];
    
    for (let x = centerX - distance; x <= centerX + distance; x++) {
      for (let z = centerZ - distance; z <= centerZ + distance; z++) {
        // Calculate chunk distance (circular pattern is better than square)
        const dx = x - centerX;
        const dz = z - centerZ;
        const distanceToPlayer = Math.sqrt(dx * dx + dz * dz);
        
        // Only include chunks within specified distance
        if (distanceToPlayer <= distance) {
          chunksToLoad.push(`${x},${z}`);
        }
      }
    }
    
    // Sort chunks by distance to player for prioritized loading
    return chunksToLoad.sort((a, b) => {
      const [ax, az] = a.split(',').map(Number);
      const [bx, bz] = b.split(',').map(Number);
      
      const distA = Math.sqrt(Math.pow(ax - centerX, 2) + Math.pow(az - centerZ, 2));
      const distB = Math.sqrt(Math.pow(bx - centerX, 2) + Math.pow(bz - centerZ, 2));
      
      return distA - distB; // Closest chunks first
    });
  }
  
  // Clear loading flag for successfully loaded chunks
  useEffect(() => {
    if (Object.keys(chunks).length > 0) {
      // Remove loaded chunks from loading set
      Object.keys(chunks).forEach(chunkKey => {
        if (loadingChunksRef.current.has(chunkKey)) {
          loadingChunksRef.current.delete(chunkKey);
        }
      });
    }
  }, [chunks]);
  
  // Optimize: Compute visible chunks with memoization and distance-based filtering
  const visibleChunks = useMemo(() => {
    return Object.keys(chunks)
      .map(chunkKey => {
        const [x, z] = chunkKey.split(',').map(Number);
        
        // Calculate distance from player in chunks
        const distanceFromPlayer = Math.sqrt(
          Math.pow(x - playerChunkX, 2) + 
          Math.pow(z - playerChunkZ, 2)
        );
        
        return { 
          x, 
          z, 
          key: chunkKey,
          distance: distanceFromPlayer 
        };
      })
      // Only render chunks within render distance
      .filter(chunk => chunk.distance <= CHUNK_RENDER_DISTANCE)
      // Sort by distance for prioritization (closest first)
      .sort((a, b) => a.distance - b.distance);
  }, [chunks, playerChunkX, playerChunkZ]);
  
  // Monitor rendering performance
  useFrame(({ clock }) => {
    // Performance monitoring - throttle to avoid console spam
    if (Math.floor(clock.getElapsedTime()) % 5 === 0) {
      console.log(`Rendering ${visibleChunks.length} chunks of ${Object.keys(chunks).length} loaded`);
    }
  });
  
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
      
      {/* Performance optimized chunk rendering */}
      {visibleChunks.map(chunk => (
        <Chunk 
          key={`${chunk.x},${chunk.z}`} 
          chunkX={chunk.x} 
          chunkZ={chunk.z} 
          blocks={blocks}
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
