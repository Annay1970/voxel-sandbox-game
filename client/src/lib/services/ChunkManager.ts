import { BlockType } from '../blocks';
import { CHUNK_SIZE } from '../../components/game/Chunk';

/**
 * Events for chunk loading and unloading
 */
export enum ChunkEvent {
  CHUNK_LOADED = 'chunkLoaded',
  CHUNK_UNLOADED = 'chunkUnloaded',
  CHUNK_UPDATED = 'chunkUpdated',
}

/**
 * Interface for chunk data
 */
export interface ChunkData {
  blocks: Record<string, BlockType>;
  x: number;
  z: number;
  lastAccessed: number;
  needsUpdate: boolean;
}

/**
 * ChunkManager handles chunk loading, caching, and worker communication
 */
export class ChunkManager {
  private chunks: Map<string, ChunkData> = new Map();
  private worker: Worker | null = null;
  private pendingChunks: Set<string> = new Set();
  private eventListeners: Record<string, Function[]> = {};
  private worldSeed: number;
  private lastPlayerChunk: { x: number, z: number } | null = null;
  
  // Tunable parameters for chunk loading
  readonly CHUNK_LOAD_RADIUS = 6;
  readonly CHUNK_RENDER_RADIUS = 5;
  readonly CHUNK_RETAIN_RADIUS = 8;
  readonly CACHE_SIZE_LIMIT = 256; // Maximum number of chunks to keep in memory
  
  /**
   * Initialize the chunk manager with a seed
   */
  constructor(seed: number = Math.floor(Math.random() * 1000000)) {
    this.worldSeed = seed;
    this.initWorker();
  }
  
  /**
   * Initialize the terrain generation worker
   */
  private initWorker() {
    try {
      this.worker = new Worker(new URL('../workers/terrainWorker.ts', import.meta.url), { type: 'module' });
      
      this.worker.onmessage = (e) => {
        const { type, payload } = e.data;
        
        if (type === 'chunkGenerated') {
          const { chunkX, chunkZ, blocks } = payload;
          const chunkKey = this.getChunkKey(chunkX, chunkZ);
          
          // Store the chunk data
          this.chunks.set(chunkKey, {
            blocks,
            x: chunkX,
            z: chunkZ,
            lastAccessed: Date.now(),
            needsUpdate: false
          });
          
          // Remove from pending list
          this.pendingChunks.delete(chunkKey);
          
          // Notify listeners
          this.emit(ChunkEvent.CHUNK_LOADED, { chunkX, chunkZ, blocks });
          
          console.log(`Chunk ${chunkKey} loaded (${Object.keys(blocks).length} blocks)`);
        }
      };
      
      this.worker.onerror = (error) => {
        console.error('Terrain worker error:', error);
      };
      
      console.log('Terrain worker initialized');
    } catch (error) {
      console.error('Failed to initialize terrain worker:', error);
      // Fallback to main thread generation if worker fails
      this.worker = null;
    }
  }
  
  /**
   * Request chunks to be loaded around player position
   */
  updateChunks(playerX: number, playerZ: number) {
    // Convert to chunk coordinates
    const playerChunkX = Math.floor(playerX / CHUNK_SIZE);
    const playerChunkZ = Math.floor(playerZ / CHUNK_SIZE);
    
    // Skip if player hasn't moved to a new chunk
    if (this.lastPlayerChunk && 
        this.lastPlayerChunk.x === playerChunkX && 
        this.lastPlayerChunk.z === playerChunkZ) {
      return;
    }
    
    // Update last player chunk
    this.lastPlayerChunk = { x: playerChunkX, z: playerChunkZ };
    
    // Calculate chunks needed
    const chunksToLoad = this.getChunksInRadius(
      playerChunkX, 
      playerChunkZ, 
      this.CHUNK_LOAD_RADIUS
    );
    
    // Request missing chunks
    chunksToLoad.forEach(chunkKey => {
      if (!this.chunks.has(chunkKey) && !this.pendingChunks.has(chunkKey)) {
        const [chunkX, chunkZ] = chunkKey.split(',').map(Number);
        this.requestChunk(chunkX, chunkZ);
      } else if (this.chunks.has(chunkKey)) {
        // Update last accessed time for this chunk
        const chunk = this.chunks.get(chunkKey)!;
        chunk.lastAccessed = Date.now();
      }
    });
    
    // Unload distant chunks
    this.unloadDistantChunks(playerChunkX, playerChunkZ);
    
    // Clean up cache if it gets too large
    if (this.chunks.size > this.CACHE_SIZE_LIMIT) {
      this.cleanupChunkCache();
    }
  }
  
  /**
   * Get the chunks that should be rendered based on player position
   */
  getVisibleChunks(playerX: number, playerZ: number): ChunkData[] {
    // Convert to chunk coordinates
    const playerChunkX = Math.floor(playerX / CHUNK_SIZE);
    const playerChunkZ = Math.floor(playerZ / CHUNK_SIZE);
    
    // Get chunk keys in render radius
    const visibleChunkKeys = this.getChunksInRadius(
      playerChunkX, 
      playerChunkZ, 
      this.CHUNK_RENDER_RADIUS
    );
    
    // Get only loaded chunks
    return visibleChunkKeys
      .map(key => this.chunks.get(key))
      .filter((chunk): chunk is ChunkData => chunk !== undefined)
      .sort((a, b) => {
        // Sort by distance to player for rendering priority
        const distA = Math.sqrt(
          Math.pow(a.x - playerChunkX, 2) + 
          Math.pow(a.z - playerChunkZ, 2)
        );
        const distB = Math.sqrt(
          Math.pow(b.x - playerChunkX, 2) + 
          Math.pow(b.z - playerChunkZ, 2)
        );
        return distA - distB;
      });
  }
  
  /**
   * Request a chunk to be generated
   */
  private requestChunk(chunkX: number, chunkZ: number) {
    const chunkKey = this.getChunkKey(chunkX, chunkZ);
    
    // Mark as pending
    this.pendingChunks.add(chunkKey);
    
    if (this.worker) {
      // Request through worker
      this.worker.postMessage({
        type: 'generateChunk',
        payload: {
          chunkX,
          chunkZ,
          seed: this.worldSeed
        }
      });
    } else {
      // Fallback - generate on main thread
      console.warn('Using main thread for chunk generation');
      setTimeout(() => {
        // This would be replaced with actual generation code
        // For now just create a simple flat chunk
        const blocks: Record<string, BlockType> = {};
        
        // Simple placeholder terrain
        for (let x = 0; x < CHUNK_SIZE; x++) {
          for (let z = 0; z < CHUNK_SIZE; z++) {
            const worldX = chunkX * CHUNK_SIZE + x;
            const worldZ = chunkZ * CHUNK_SIZE + z;
            
            blocks[`${worldX},0,${worldZ}`] = 'grass';
            blocks[`${worldX},1,${worldZ}`] = 'dirt';
            blocks[`${worldX},2,${worldZ}`] = 'stone';
          }
        }
        
        // Store the chunk
        this.chunks.set(chunkKey, {
          blocks,
          x: chunkX,
          z: chunkZ,
          lastAccessed: Date.now(),
          needsUpdate: false
        });
        
        // Remove from pending
        this.pendingChunks.delete(chunkKey);
        
        // Notify listeners
        this.emit(ChunkEvent.CHUNK_LOADED, { chunkX, chunkZ, blocks });
      }, 50);
    }
  }
  
  /**
   * Update a block in a chunk
   */
  updateBlock(x: number, y: number, z: number, type: BlockType) {
    // Calculate chunk coordinates
    const chunkX = Math.floor(x / CHUNK_SIZE);
    const chunkZ = Math.floor(z / CHUNK_SIZE);
    const chunkKey = this.getChunkKey(chunkX, chunkZ);
    
    // Check if chunk exists
    if (!this.chunks.has(chunkKey)) {
      console.warn(`Attempted to update block at [${x},${y},${z}] but chunk does not exist`);
      return false;
    }
    
    // Update the block
    const chunk = this.chunks.get(chunkKey)!;
    
    if (type === 'air') {
      // For air blocks, remove from the map to save memory
      delete chunk.blocks[`${x},${y},${z}`];
    } else {
      chunk.blocks[`${x},${y},${z}`] = type;
    }
    
    // Mark chunk as needing update
    chunk.needsUpdate = true;
    
    // Notify listeners
    this.emit(ChunkEvent.CHUNK_UPDATED, { 
      chunkX, 
      chunkZ, 
      blockX: x, 
      blockY: y, 
      blockZ: z, 
      type 
    });
    
    return true;
  }
  
  /**
   * Unload chunks that are too far from player
   */
  private unloadDistantChunks(playerChunkX: number, playerChunkZ: number) {
    // Get chunks to keep based on retain radius (larger than load radius)
    const chunksToRetain = this.getChunksInRadius(
      playerChunkX, 
      playerChunkZ, 
      this.CHUNK_RETAIN_RADIUS
    );
    
    // Set for faster lookups
    const retainSet = new Set(chunksToRetain);
    
    // Find chunks to unload
    const chunksToUnload: string[] = [];
    
    this.chunks.forEach((chunk, key) => {
      if (!retainSet.has(key)) {
        chunksToUnload.push(key);
      }
    });
    
    // Unload chunks
    chunksToUnload.forEach(key => {
      const [chunkX, chunkZ] = key.split(',').map(Number);
      this.chunks.delete(key);
      
      // Notify listeners
      this.emit(ChunkEvent.CHUNK_UNLOADED, { chunkX, chunkZ });
    });
    
    if (chunksToUnload.length > 0) {
      console.log(`Unloaded ${chunksToUnload.length} distant chunks`);
    }
  }
  
  /**
   * Clean up the chunk cache based on last accessed time
   */
  private cleanupChunkCache() {
    // Sort chunks by last accessed time
    const sortedChunks = Array.from(this.chunks.entries())
      .sort((a, b) => a[1].lastAccessed - b[1].lastAccessed);
    
    // Keep only the most recently accessed chunks
    const chunksToRemove = sortedChunks
      .slice(0, sortedChunks.length - this.CACHE_SIZE_LIMIT)
      .map(entry => entry[0]);
    
    // Remove old chunks
    chunksToRemove.forEach(key => {
      const [chunkX, chunkZ] = key.split(',').map(Number);
      this.chunks.delete(key);
      
      // Notify listeners
      this.emit(ChunkEvent.CHUNK_UNLOADED, { chunkX, chunkZ });
    });
    
    console.log(`Cleaned up ${chunksToRemove.length} chunks from cache`);
  }
  
  /**
   * Get chunk key from coordinates
   */
  private getChunkKey(chunkX: number, chunkZ: number): string {
    return `${chunkX},${chunkZ}`;
  }
  
  /**
   * Get chunks in a circular radius around a center point
   */
  private getChunksInRadius(centerX: number, centerZ: number, radius: number): string[] {
    const chunks: string[] = [];
    
    for (let x = centerX - radius; x <= centerX + radius; x++) {
      for (let z = centerZ - radius; z <= centerZ + radius; z++) {
        // Calculate distance from center (circular pattern)
        const dx = x - centerX;
        const dz = z - centerZ;
        const distance = Math.sqrt(dx * dx + dz * dz);
        
        // Only include chunks within radius
        if (distance <= radius) {
          chunks.push(this.getChunkKey(x, z));
        }
      }
    }
    
    // Sort by distance from center
    return chunks.sort((a, b) => {
      const [ax, az] = a.split(',').map(Number);
      const [bx, bz] = b.split(',').map(Number);
      
      const distA = Math.sqrt(Math.pow(ax - centerX, 2) + Math.pow(az - centerZ, 2));
      const distB = Math.sqrt(Math.pow(bx - centerX, 2) + Math.pow(bz - centerZ, 2));
      
      return distA - distB;
    });
  }
  
  /**
   * Get a block at specific coordinates
   */
  getBlock(x: number, y: number, z: number): BlockType | null {
    // Calculate chunk coordinates
    const chunkX = Math.floor(x / CHUNK_SIZE);
    const chunkZ = Math.floor(z / CHUNK_SIZE);
    const chunkKey = this.getChunkKey(chunkX, chunkZ);
    
    // Check if chunk exists
    if (!this.chunks.has(chunkKey)) {
      return null;
    }
    
    // Get the block
    const chunk = this.chunks.get(chunkKey)!;
    return chunk.blocks[`${x},${y},${z}`] || null;
  }
  
  /**
   * Get all loaded blocks (for compatibility)
   */
  getAllBlocks(): Record<string, BlockType> {
    const allBlocks: Record<string, BlockType> = {};
    
    // Merge all chunk blocks
    this.chunks.forEach(chunk => {
      Object.assign(allBlocks, chunk.blocks);
    });
    
    return allBlocks;
  }
  
  /**
   * Check if a specific chunk is loaded
   */
  isChunkLoaded(chunkX: number, chunkZ: number): boolean {
    return this.chunks.has(this.getChunkKey(chunkX, chunkZ));
  }
  
  /**
   * Get information about chunk loading state
   */
  getLoadingStatus() {
    return {
      loadedChunks: this.chunks.size,
      pendingChunks: this.pendingChunks.size,
      totalBlocks: Array.from(this.chunks.values())
        .reduce((sum, chunk) => sum + Object.keys(chunk.blocks).length, 0)
    };
  }
  
  /**
   * Register an event listener
   */
  on(event: ChunkEvent, callback: Function) {
    if (!this.eventListeners[event]) {
      this.eventListeners[event] = [];
    }
    
    this.eventListeners[event].push(callback);
    
    // Return unsubscribe function
    return () => {
      if (this.eventListeners[event]) {
        this.eventListeners[event] = this.eventListeners[event].filter(
          cb => cb !== callback
        );
      }
    };
  }
  
  /**
   * Emit an event to listeners
   */
  private emit(event: ChunkEvent, data: any) {
    if (this.eventListeners[event]) {
      this.eventListeners[event].forEach(callback => {
        try {
          callback(data);
        } catch (error) {
          console.error(`Error in chunk event listener for ${event}:`, error);
        }
      });
    }
  }
  
  /**
   * Clean up resources
   */
  dispose() {
    if (this.worker) {
      this.worker.terminate();
      this.worker = null;
    }
    
    this.chunks.clear();
    this.pendingChunks.clear();
    this.eventListeners = {};
  }
}

// Singleton instance
let chunkManagerInstance: ChunkManager | null = null;

/**
 * Get or create the chunk manager singleton
 */
export function getChunkManager(seed?: number): ChunkManager {
  if (!chunkManagerInstance) {
    chunkManagerInstance = new ChunkManager(seed);
  }
  
  return chunkManagerInstance;
}