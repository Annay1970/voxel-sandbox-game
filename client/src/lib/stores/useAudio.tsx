import { create } from "zustand";

interface GameSounds {
  backgroundMusic: HTMLAudioElement | null;
  hitSound: HTMLAudioElement | null;
  successSound: HTMLAudioElement | null;
  walkSound: HTMLAudioElement | null;
  jumpSound: HTMLAudioElement | null;
  placeSound: HTMLAudioElement | null;
  breakSound: HTMLAudioElement | null;
  attackSound: HTMLAudioElement | null;
  damageSound: HTMLAudioElement | null;
  ambientDay: HTMLAudioElement | null;
  ambientNight: HTMLAudioElement | null;
  rainSound: HTMLAudioElement | null;
  thunderSound: HTMLAudioElement | null;
}

interface AudioState extends GameSounds {
  isMuted: boolean;
  footstepTimer: number | null;
  ambientTimer: number | null;
  currentAmbient: 'day' | 'night' | 'rain' | 'none';
  
  // Setter functions
  setSound: (name: keyof GameSounds, sound: HTMLAudioElement) => void;
  
  // Control functions
  toggleMute: () => void;
  playSound: (name: keyof GameSounds, options?: { volume?: number, loop?: boolean }) => void;
  stopSound: (name: keyof GameSounds) => void;
  playFootsteps: (isWalking: boolean, isRunning: boolean, onGround: boolean) => void;
  stopFootsteps: () => void;
  updateAmbience: (timeOfDay: number, weather: string) => void;
}

export const useAudio = create<AudioState>((set, get) => ({
  // Sound sources
  backgroundMusic: null,
  hitSound: null,
  successSound: null,
  walkSound: null,
  jumpSound: null,
  placeSound: null,
  breakSound: null,
  attackSound: null,
  damageSound: null,
  ambientDay: null,
  ambientNight: null,
  rainSound: null,
  thunderSound: null,
  
  // State variables
  isMuted: true, // Start muted by default
  footstepTimer: null,
  ambientTimer: null,
  currentAmbient: 'none' as 'day' | 'night' | 'rain' | 'none',
  
  // Unified setter for any sound
  setSound: (name, sound) => set({ [name]: sound }),
  
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
      
      // Stop footstep timer if running
      if (state.footstepTimer) {
        window.clearInterval(state.footstepTimer);
        set({ footstepTimer: null });
      }
    } else {
      // Resume ambient sound based on current state
      state.updateAmbience(state.currentAmbient === 'day' ? 0.5 : 0.9, 
                          state.currentAmbient === 'rain' ? 'rain' : 'clear');
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
  
  // Footstep system with variable speed based on player movement
  playFootsteps: (isWalking, isRunning, onGround) => {
    const state = get();
    
    // Don't play footsteps if muted, not on ground, or not moving
    if (state.isMuted || !onGround || (!isWalking && !isRunning)) {
      state.stopFootsteps();
      return;
    }
    
    // If already playing, don't start again
    if (state.footstepTimer) return;
    
    // Footstep speed based on movement type
    const interval = isRunning ? 250 : 400; // milliseconds between steps
    
    const timer = window.setInterval(() => {
      if (!state.walkSound || state.isMuted) return;
      
      const soundClone = state.walkSound.cloneNode() as HTMLAudioElement;
      soundClone.volume = isRunning ? 0.3 : 0.2;
      soundClone.play().catch(error => {
        console.log("Walk sound play prevented:", error);
      });
    }, interval);
    
    set({ footstepTimer: timer });
  },
  
  // Stop footstep sounds
  stopFootsteps: () => {
    const { footstepTimer } = get();
    if (footstepTimer) {
      window.clearInterval(footstepTimer);
      set({ footstepTimer: null });
    }
  },
  
  // Environment ambient sound system based on time and weather
  updateAmbience: (timeOfDay, weather) => {
    const state = get();
    
    // Don't update ambient sounds if muted
    if (state.isMuted) return;
    
    // Determine which ambient sound should be playing
    let newAmbient: 'day' | 'night' | 'rain' | 'none' = 'none';
    
    if (weather === 'rain' || weather === 'storm') {
      newAmbient = 'rain';
    } else if (timeOfDay > 0.25 && timeOfDay < 0.75) {
      newAmbient = 'day';
    } else {
      newAmbient = 'night';
    }
    
    // Only change if needed
    if (newAmbient === state.currentAmbient) return;
    
    // Stop current ambient sounds
    if (state.ambientDay) state.ambientDay.pause();
    if (state.ambientNight) state.ambientNight.pause();
    if (state.rainSound) state.rainSound.pause();
    if (state.thunderSound) state.thunderSound.pause();
    
    // Start new ambient sound
    switch (newAmbient) {
      case 'day':
        if (state.ambientDay) {
          state.ambientDay.loop = true;
          state.ambientDay.volume = 0.3;
          state.ambientDay.currentTime = 0;
          state.ambientDay.play().catch(error => {
            console.log("Ambient day sound play prevented:", error);
          });
        }
        break;
      case 'night':
        if (state.ambientNight) {
          state.ambientNight.loop = true;
          state.ambientNight.volume = 0.3;
          state.ambientNight.currentTime = 0;
          state.ambientNight.play().catch(error => {
            console.log("Ambient night sound play prevented:", error);
          });
        }
        break;
      case 'rain':
        if (state.rainSound) {
          state.rainSound.loop = true;
          state.rainSound.volume = 0.4;
          state.rainSound.currentTime = 0;
          state.rainSound.play().catch(error => {
            console.log("Rain sound play prevented:", error);
          });
        }
        
        // Play occasional thunder during storms
        if (weather === 'storm' && state.thunderSound) {
          // Clear existing ambient timer
          if (state.ambientTimer) {
            window.clearInterval(state.ambientTimer);
          }
          
          // Set up thunder interval
          const thunderTimer = window.setInterval(() => {
            if (state.isMuted) return;
            
            // Random chance to play thunder (30% chance every 10 seconds)
            if (Math.random() < 0.3 && state.thunderSound) {
              state.thunderSound.currentTime = 0;
              state.thunderSound.volume = 0.7;
              state.thunderSound.play().catch(error => {
                console.log("Thunder sound play prevented:", error);
              });
            }
          }, 10000);
          
          set({ ambientTimer: thunderTimer });
        }
        break;
    }
    
    set({ currentAmbient: newAmbient });
  },
  
  // Legacy methods for backward compatibility
  playHit: () => get().playSound('hitSound', { volume: 0.3 }),
  playSuccess: () => get().playSound('successSound', { volume: 0.5 })
}));
