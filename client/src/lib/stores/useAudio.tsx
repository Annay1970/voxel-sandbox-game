import { create } from "zustand";
import { useVoxelGame } from "./useVoxelGame";

interface GameSounds {
  // Music and main sounds
  backgroundMusic: HTMLAudioElement | null;
  hitSound: HTMLAudioElement | null;
  successSound: HTMLAudioElement | null;
  
  // Movement sounds
  walkSound: HTMLAudioElement | null;
  walkSandSound: HTMLAudioElement | null;
  walkStoneSound: HTMLAudioElement | null;
  walkWoodSound: HTMLAudioElement | null;
  jumpSound: HTMLAudioElement | null;
  landSound: HTMLAudioElement | null;
  swimSound: HTMLAudioElement | null;
  splashSound: HTMLAudioElement | null;
  
  // Interaction sounds
  placeSound: HTMLAudioElement | null;
  breakSound: HTMLAudioElement | null;
  digDirtSound: HTMLAudioElement | null;
  digStoneSound: HTMLAudioElement | null;
  digWoodSound: HTMLAudioElement | null;
  
  // Combat sounds
  attackSound: HTMLAudioElement | null;
  damageSound: HTMLAudioElement | null;
  deathSound: HTMLAudioElement | null;
  
  // UI sounds
  uiClickSound: HTMLAudioElement | null;
  inventoryOpenSound: HTMLAudioElement | null;
  craftingSound: HTMLAudioElement | null;
  
  // Ambient sounds
  ambientDay: HTMLAudioElement | null;
  ambientNight: HTMLAudioElement | null;
  rainSound: HTMLAudioElement | null;
  thunderSound: HTMLAudioElement | null;
  waterAmbient: HTMLAudioElement | null;
  caveAmbient: HTMLAudioElement | null;
  
  // Creature sounds
  cowSound: HTMLAudioElement | null;
  sheepSound: HTMLAudioElement | null;
  pigSound: HTMLAudioElement | null;
  chickenSound: HTMLAudioElement | null;
  zombieSound: HTMLAudioElement | null;
  zombieHurtSound: HTMLAudioElement | null;
  skeletonSound: HTMLAudioElement | null;
  spiderSound: HTMLAudioElement | null;
  beeSound: HTMLAudioElement | null;
}

type TerrainType = 'grass' | 'sand' | 'stone' | 'wood' | 'water';

interface AudioState extends GameSounds {
  isMuted: boolean;
  masterVolume: number;
  musicVolume: number;
  effectsVolume: number;
  ambientVolume: number;
  
  // Timers
  footstepTimer: number | null;
  ambientTimer: number | null;
  creatureTimer: number | null;
  
  // State tracking
  currentAmbient: 'day' | 'night' | 'rain' | 'cave' | 'water' | 'none';
  footstepTerrain: TerrainType;
  isUnderwater: boolean;
  
  // Setter functions
  setSound: (name: keyof GameSounds, sound: HTMLAudioElement) => void;
  
  // Control functions
  toggleMute: () => void;
  setMasterVolume: (volume: number) => void;
  setMusicVolume: (volume: number) => void;
  setEffectsVolume: (volume: number) => void;
  setAmbientVolume: (volume: number) => void;
  
  // Sound playback
  playSound: (name: keyof GameSounds, options?: { volume?: number, loop?: boolean, delay?: number }) => void;
  stopSound: (name: keyof GameSounds) => void;
  
  // Specialized sound systems
  playFootsteps: (isWalking: boolean, isRunning: boolean, onGround: boolean, terrain?: TerrainType) => void;
  stopFootsteps: () => void;
  playWaterSounds: (isSwimming: boolean, isUnderwater: boolean) => void;
  playCraftingSound: () => void;
  playBlockBreakSound: (blockType: string) => void;
  playBlockPlaceSound: (blockType: string) => void;
  playCreatureSound: (creatureType: string, action?: 'idle' | 'hurt' | 'death') => void;
  playUISound: (action: 'click' | 'open' | 'close' | 'craft' | 'error') => void;
  
  // Environmental sound system
  updateAmbience: (timeOfDay: number, weather: string, playerDepth: number, isNearWater: boolean) => void;
}

export const useAudio = create<AudioState>((set, get) => ({
  // Music and main sounds
  backgroundMusic: null,
  hitSound: null,
  successSound: null,
  
  // Movement sounds
  walkSound: null,
  walkSandSound: null,
  walkStoneSound: null,
  walkWoodSound: null,
  jumpSound: null,
  landSound: null,
  swimSound: null,
  splashSound: null,
  
  // Interaction sounds
  placeSound: null,
  breakSound: null,
  digDirtSound: null,
  digStoneSound: null,
  digWoodSound: null,
  
  // Combat sounds
  attackSound: null,
  damageSound: null,
  deathSound: null,
  
  // UI sounds
  uiClickSound: null,
  inventoryOpenSound: null,
  craftingSound: null,
  
  // Ambient sounds
  ambientDay: null,
  ambientNight: null,
  rainSound: null,
  thunderSound: null,
  waterAmbient: null,
  caveAmbient: null,
  
  // Creature sounds
  cowSound: null,
  sheepSound: null,
  pigSound: null,
  chickenSound: null,
  zombieSound: null,
  zombieHurtSound: null,
  skeletonSound: null,
  spiderSound: null,
  beeSound: null,
  
  // Volume settings
  isMuted: true, // Start muted by default
  masterVolume: 0.7,
  musicVolume: 0.5,
  effectsVolume: 0.8,
  ambientVolume: 0.6,
  
  // Timers
  footstepTimer: null,
  ambientTimer: null,
  creatureTimer: null,
  
  // State tracking
  currentAmbient: 'none' as 'day' | 'night' | 'rain' | 'cave' | 'water' | 'none',
  footstepTerrain: 'grass' as TerrainType,
  isUnderwater: false,
  
  // Unified setter for any sound
  setSound: (name, sound) => set({ [name]: sound }),
  
  // Volume control functions
  setMasterVolume: (volume) => {
    set({ masterVolume: Math.max(0, Math.min(1, volume)) });
    console.log(`Master volume set to ${volume}`);
  },
  
  setMusicVolume: (volume) => {
    set({ musicVolume: Math.max(0, Math.min(1, volume)) });
    // Update background music volume if playing
    const backgroundMusic = get().backgroundMusic;
    if (backgroundMusic && !get().isMuted) {
      backgroundMusic.volume = volume * get().masterVolume;
    }
    console.log(`Music volume set to ${volume}`);
  },
  
  setEffectsVolume: (volume) => {
    set({ effectsVolume: Math.max(0, Math.min(1, volume)) });
    console.log(`Effects volume set to ${volume}`);
  },
  
  setAmbientVolume: (volume) => {
    set({ ambientVolume: Math.max(0, Math.min(1, volume)) });
    // Update ambient sounds volume if playing
    const state = get();
    const actualVolume = volume * state.masterVolume;
    
    if (!state.isMuted) {
      if (state.ambientDay && state.currentAmbient === 'day') {
        state.ambientDay.volume = actualVolume;
      }
      if (state.ambientNight && state.currentAmbient === 'night') {
        state.ambientNight.volume = actualVolume;
      }
      if (state.rainSound && state.currentAmbient === 'rain') {
        state.rainSound.volume = actualVolume;
      }
      if (state.waterAmbient && state.currentAmbient === 'water') {
        state.waterAmbient.volume = actualVolume;
      }
      if (state.caveAmbient && state.currentAmbient === 'cave') {
        state.caveAmbient.volume = actualVolume;
      }
    }
    console.log(`Ambient volume set to ${volume}`);
  },
  
  // Toggle mute state for all sounds
  toggleMute: () => {
    const state = get();
    const newMutedState = !state.isMuted;
    
    // Update the muted state
    set({ isMuted: newMutedState });
    
    // Manage background music and ambient sounds
    if (newMutedState) {
      // Pause all looping sounds
      if (state.backgroundMusic) state.backgroundMusic.pause();
      if (state.ambientDay) state.ambientDay.pause();
      if (state.ambientNight) state.ambientNight.pause();
      if (state.rainSound) state.rainSound.pause();
      if (state.waterAmbient) state.waterAmbient.pause();
      if (state.caveAmbient) state.caveAmbient.pause();
      
      // Stop timers
      if (state.footstepTimer) {
        window.clearInterval(state.footstepTimer);
        set({ footstepTimer: null });
      }
      if (state.ambientTimer) {
        window.clearInterval(state.ambientTimer);
        set({ ambientTimer: null });
      }
      if (state.creatureTimer) {
        window.clearInterval(state.creatureTimer);
        set({ creatureTimer: null });
      }
    } else {
      // Resume ambient sound based on current state - provide default playerDepth and isNearWater values
      state.updateAmbience(
        state.currentAmbient === 'day' ? 0.5 : 0.9, 
        state.currentAmbient === 'rain' ? 'rain' : 'clear',
        0,  // Default player depth (surface level)
        false // Default not near water
      );
    }
    
    // Log the change
    console.log(`Sound ${newMutedState ? 'muted' : 'unmuted'}`);
  },
  
  // Generic sound player - can be used for any sound
  playSound: (name, options = {}) => {
    const state = get();
    const sound = state[name];
    
    if (!sound || state.isMuted) return;
    
    // Clone for overlapping sounds (like hit, place, break)
    const shouldClone = !options.loop && 
      ['hitSound', 'placeSound', 'breakSound', 'attackSound'].includes(name);
    
    const soundToPlay = shouldClone ? 
      (sound.cloneNode() as HTMLAudioElement) : sound;
    
    // Set volume if specified, otherwise use defaults
    soundToPlay.volume = options.volume !== undefined ? options.volume : 
      (name === 'backgroundMusic' ? 0.4 : 
       name === 'walkSound' ? 0.2 : 
       name === 'rainSound' ? 0.3 : 0.5);
    
    // Set looping if specified
    soundToPlay.loop = !!options.loop;
    
    if (!shouldClone) soundToPlay.currentTime = 0;
    
    soundToPlay.play().catch(error => {
      console.log(`${name} play prevented:`, error);
    });
    
    return soundToPlay;
  },
  
  // Stop a specific sound
  stopSound: (name) => {
    const sound = get()[name];
    if (sound) {
      sound.pause();
      sound.currentTime = 0;
    }
  },
  
  // Stop footstep sounds
  stopFootsteps: () => {
    const { footstepTimer } = get();
    if (footstepTimer) {
      window.clearInterval(footstepTimer);
      set({ footstepTimer: null });
    }
  },
  
  // Enhanced footstep system with terrain awareness
  playFootsteps: (isWalking, isRunning, onGround, terrain = 'grass') => {
    const state = get();
    
    // Don't play footsteps if muted, not on ground, or not moving
    if (state.isMuted || !onGround || (!isWalking && !isRunning)) {
      state.stopFootsteps();
      return;
    }
    
    // Update terrain type if changed
    if (terrain !== state.footstepTerrain) {
      set({ footstepTerrain: terrain });
    }
    
    // If already playing, don't start again
    if (state.footstepTimer) return;
    
    // Footstep speed based on movement type
    const interval = isRunning ? 250 : 400; // milliseconds between steps
    
    const timer = window.setInterval(() => {
      if (state.isMuted) return;
      
      // Choose appropriate footstep sound based on terrain
      let footstepSound = state.walkSound; // Default
      
      switch(terrain) {
        case 'sand':
          footstepSound = state.walkSandSound || state.walkSound;
          break;
        case 'stone':
          footstepSound = state.walkStoneSound || state.walkSound;
          break;
        case 'wood':
          footstepSound = state.walkWoodSound || state.walkSound;
          break;
        case 'water':
          footstepSound = state.splashSound || state.walkSound;
          break;
        case 'grass':
        default:
          footstepSound = state.walkSound;
      }
      
      if (!footstepSound) return;
      
      const soundClone = footstepSound.cloneNode() as HTMLAudioElement;
      // Apply volume modifiers
      soundClone.volume = (isRunning ? 0.3 : 0.2) * state.effectsVolume * state.masterVolume;
      soundClone.play().catch(error => {
        console.log(`${terrain} footstep sound play prevented:`, error);
      });
    }, interval);
    
    set({ footstepTimer: timer });
  },
  
  // Water immersion sounds
  playWaterSounds: (isSwimming, isUnderwater) => {
    const state = get();
    
    // First update underwater state if changed
    if (isUnderwater !== state.isUnderwater) {
      set({ isUnderwater });
      
      // Play splash sound when entering/exiting water
      if (state.splashSound) {
        const volume = 0.6 * state.effectsVolume * state.masterVolume; 
        state.playSound('splashSound', { volume });
      }
    }
    
    // Then handle ambient water sounds
    if (isSwimming && !state.isMuted) {
      if (state.waterAmbient && state.currentAmbient !== 'water') {
        // Stop other ambient sounds
        if (state.ambientDay) state.ambientDay.pause();
        if (state.ambientNight) state.ambientNight.pause();
        if (state.rainSound) state.rainSound.pause();
        if (state.caveAmbient) state.caveAmbient.pause();
        
        // Play water ambient
        state.waterAmbient.loop = true;
        state.waterAmbient.volume = 0.5 * state.ambientVolume * state.masterVolume;
        state.waterAmbient.play().catch(error => {
          console.log("Water ambient sound play prevented:", error);
        });
        
        set({ currentAmbient: 'water' });
      }
      
      // Play swimming sound effects
      if (state.swimSound && !state.swimSound.paused && !state.isMuted) {
        return; // Already playing
      }
      
      if (state.swimSound) {
        state.swimSound.loop = true;
        state.swimSound.volume = 0.3 * state.effectsVolume * state.masterVolume;
        state.swimSound.play().catch(error => {
          console.log("Swim sound play prevented:", error);
        });
      }
    } else {
      // Stop swim sound when not swimming
      if (state.swimSound) {
        state.swimSound.pause();
      }
      
      // Restore previous ambient if exiting water
      if (state.currentAmbient === 'water') {
        // Get player position from the game state to determine ambient
        const gameState = useVoxelGame.getState();
        state.updateAmbience(
          gameState.timeOfDay, 
          gameState.weather,
          Math.abs(gameState.player.position[1]), // Get player depth 
          false // No longer near water
        );
      }
    }
  },
  
  // Crafting sounds
  playCraftingSound: () => {
    const state = get();
    state.playSound('craftingSound', { 
      volume: 0.6 * state.effectsVolume * state.masterVolume
    });
  },
  
  // Block interaction sounds
  playBlockBreakSound: (blockType) => {
    const state = get();
    let soundName: keyof GameSounds = 'breakSound'; // Default
    
    // Select appropriate sound based on block type
    if (blockType === 'stone' || blockType === 'coal') {
      soundName = 'digStoneSound';
    } else if (blockType === 'dirt' || blockType === 'grass' || blockType === 'sand') {
      soundName = 'digDirtSound';
    } else if (blockType === 'wood' || blockType === 'log' || blockType === 'leaves') {
      soundName = 'digWoodSound';
    }
    
    // Fall back to generic break sound if specific not available
    const sound = state[soundName] || state.breakSound;
    
    if (sound) {
      const soundClone = sound.cloneNode() as HTMLAudioElement;
      soundClone.volume = 0.5 * state.effectsVolume * state.masterVolume;
      soundClone.play().catch(error => {
        console.log(`Block break sound play prevented:`, error);
      });
    }
  },
  
  playBlockPlaceSound: (blockType) => {
    const state = get();
    // For now, use same sound for all block types
    const sound = state.placeSound;
    
    if (sound) {
      const soundClone = sound.cloneNode() as HTMLAudioElement;
      soundClone.volume = 0.4 * state.effectsVolume * state.masterVolume;
      soundClone.play().catch(error => {
        console.log(`Block place sound play prevented:`, error);
      });
    }
  },
  
  // Creature sounds
  playCreatureSound: (creatureType, action = 'idle') => {
    const state = get();
    let soundName: keyof GameSounds | null = null;
    
    // Map creature type to appropriate sound
    switch (creatureType) {
      case 'cow':
        soundName = 'cowSound';
        break;
      case 'sheep':
        soundName = 'sheepSound';
        break;
      case 'pig':
        soundName = 'pigSound';
        break;
      case 'chicken':
        soundName = 'chickenSound';
        break;
      case 'zombie':
        soundName = action === 'hurt' ? 'zombieHurtSound' : 'zombieSound';
        break;
      case 'skeleton':
        soundName = 'skeletonSound';
        break;
      case 'spider':
        soundName = 'spiderSound';
        break;
      case 'bee':
        soundName = 'beeSound';
        break;
      default:
        return; // No sound for this creature
    }
    
    if (soundName && state[soundName]) {
      // Randomize volume a bit to add variety
      const baseVolume = 0.5;
      const randomVolume = baseVolume * (0.9 + Math.random() * 0.2); 
      const adjustedVolume = randomVolume * state.effectsVolume * state.masterVolume;
      
      state.playSound(soundName, { volume: adjustedVolume });
    }
  },
  
  // UI sounds
  playUISound: (action) => {
    const state = get();
    let sound: HTMLAudioElement | null = null;
    let volume = 0.4;
    
    switch (action) {
      case 'click':
        sound = state.uiClickSound;
        volume = 0.3;
        break;
      case 'open':
      case 'close':
        sound = state.inventoryOpenSound;
        volume = 0.5;
        break;
      case 'craft':
        sound = state.craftingSound;
        volume = 0.6;
        break;
      case 'error':
        sound = state.damageSound;
        volume = 0.4;
        break;
    }
    
    if (sound) {
      const adjustedVolume = volume * state.effectsVolume * state.masterVolume;
      const soundClone = sound.cloneNode() as HTMLAudioElement;
      soundClone.volume = adjustedVolume;
      soundClone.play().catch(error => {
        console.log(`UI ${action} sound play prevented:`, error);
      });
    }
  },
  
  // Environment ambient sound system based on time, weather, and player position
  updateAmbience: (timeOfDay, weather, playerDepth = 0, isNearWater = false) => {
    const state = get();
    
    // Don't update ambient sounds if muted
    if (state.isMuted) return;
    
    // Determine which ambient sound should be playing
    let newAmbient: 'day' | 'night' | 'rain' | 'cave' | 'water' | 'none' = 'none';
    
    // Priority order: water > cave > rain > day/night
    if (state.isUnderwater || isNearWater) {
      newAmbient = 'water';
    } else if (playerDepth > 20 && state.caveAmbient) { // Only if cave ambient is available
      newAmbient = 'cave';
    } else if (weather === 'rain' || weather === 'storm') {
      newAmbient = 'rain';
    } else if (timeOfDay > 0.25 && timeOfDay < 0.75) {
      newAmbient = 'day';
    } else {
      newAmbient = 'night';
    }
    
    // Only change if needed
    if (newAmbient === state.currentAmbient) return;
    
    console.log(`Changing ambient from ${state.currentAmbient} to ${newAmbient}`);
    
    // Stop current ambient sounds
    if (state.ambientDay) state.ambientDay.pause();
    if (state.ambientNight) state.ambientNight.pause();
    if (state.rainSound) state.rainSound.pause();
    if (state.thunderSound) state.thunderSound.pause();
    if (state.waterAmbient) state.waterAmbient.pause();
    if (state.caveAmbient) state.caveAmbient.pause();
    
    // Clean up any existing ambient timer
    if (state.ambientTimer) {
      window.clearInterval(state.ambientTimer);
      set({ ambientTimer: null });
    }
    
    // Calculate base ambient volume
    const ambientVolume = state.ambientVolume * state.masterVolume;
    
    // Start new ambient sound
    switch (newAmbient) {
      case 'day':
        if (state.ambientDay) {
          state.ambientDay.loop = true;
          state.ambientDay.volume = 0.4 * ambientVolume;
          state.ambientDay.currentTime = 0;
          state.ambientDay.play().catch(error => {
            console.log("Ambient day sound play prevented:", error);
          });
        }
        break;
      
      case 'night':
        if (state.ambientNight) {
          state.ambientNight.loop = true;
          state.ambientNight.volume = 0.5 * ambientVolume;
          state.ambientNight.currentTime = 0;
          state.ambientNight.play().catch(error => {
            console.log("Ambient night sound play prevented:", error);
          });
        }
        break;
      
      case 'rain':
        if (state.rainSound) {
          state.rainSound.loop = true;
          state.rainSound.volume = 0.6 * ambientVolume;
          state.rainSound.currentTime = 0;
          state.rainSound.play().catch(error => {
            console.log("Rain sound play prevented:", error);
          });
        }
        
        // Play occasional thunder during storms
        if (weather === 'storm' && state.thunderSound) {
          // Set up thunder interval
          const thunderTimer = window.setInterval(() => {
            if (state.isMuted) return;
            
            // Random chance to play thunder (30% chance every 10-20 seconds)
            if (Math.random() < 0.3 && state.thunderSound) {
              state.thunderSound.currentTime = 0;
              state.thunderSound.volume = 0.7 * ambientVolume;
              state.thunderSound.play().catch(error => {
                console.log("Thunder sound play prevented:", error);
              });
            }
          }, 10000 + Math.random() * 10000); // 10-20 second interval
          
          set({ ambientTimer: thunderTimer });
        }
        break;
      
      case 'cave':
        if (state.caveAmbient) {
          state.caveAmbient.loop = true;
          state.caveAmbient.volume = 0.5 * ambientVolume;
          state.caveAmbient.currentTime = 0;
          state.caveAmbient.play().catch(error => {
            console.log("Cave ambient sound play prevented:", error);
          });
          
          // Cave sounds
          const caveTimer = window.setInterval(() => {
            if (state.isMuted) return;
            
            // Random cave sounds (drips, distant moans, etc.)
            if (Math.random() < 0.15) { // 15% chance every 20-40 seconds
              // In a real implementation, we'd have a library of cave sounds
              // For now we'll just modulate the volume of the cave ambient
              if (state.caveAmbient) {
                const currentVolume = state.caveAmbient.volume;
                state.caveAmbient.volume = currentVolume * 1.5;
                
                setTimeout(() => {
                  if (state.caveAmbient) state.caveAmbient.volume = currentVolume;
                }, 1500);
              }
            }
          }, 20000 + Math.random() * 20000); // 20-40 second interval
          
          set({ ambientTimer: caveTimer });
        }
        break;
      
      case 'water':
        if (state.waterAmbient) {
          state.waterAmbient.loop = true;
          state.waterAmbient.volume = 0.5 * ambientVolume;
          state.waterAmbient.currentTime = 0;
          state.waterAmbient.play().catch(error => {
            console.log("Water ambient sound play prevented:", error);
          });
        }
        break;
    }
    
    set({ currentAmbient: newAmbient });
  },
  
  // Legacy methods for backward compatibility
  playHit: () => get().playSound('hitSound', { volume: 0.3 }),
  playSuccess: () => get().playSound('successSound', { volume: 0.5 })
}));
