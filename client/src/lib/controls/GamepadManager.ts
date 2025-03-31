/**
 * Gamepad state with required properties
 */
export interface GamepadState {
  id: string;
  index: number;
  buttons: {
    pressed: boolean;
    touched: boolean;
    value: number;
  }[];
  axes: number[];
  timestamp: number;
  mapping: string;
  connected: boolean;
}

// Define types for callbacks
type GamepadCallback = (gamepad: GamepadState | null) => void;

/**
 * Singleton manager for gamepads/controllers
 * Handles connecting, disconnecting, and polling gamepads
 */
class GamepadManager {
  private isRunning: boolean = false;
  private animationFrameId: number | null = null;
  private callbacks: Set<GamepadCallback> = new Set();
  private gamepads: Map<number, GamepadState> = new Map();
  private lastNotifiedGamepadState: GamepadState | null = null;
  
  // Configuration
  private deadzone: number = 0.1; // Stick deadzone (0-1)
  private pollingRate: number = 1000 / 60; // 60 times per second
  private lastPollTime: number = 0;
  
  constructor() {
    // Bind the event handlers
    this.handleGamepadConnected = this.handleGamepadConnected.bind(this);
    this.handleGamepadDisconnected = this.handleGamepadDisconnected.bind(this);
    this.pollGamepads = this.pollGamepads.bind(this);
  }
  
  /**
   * Start listening for gamepad events and polling
   */
  public start(): void {
    if (this.isRunning) return;
    
    // Check if the GamePad API is available
    if (!navigator.getGamepads) {
      console.warn('Gamepad API is not supported in this browser');
      return;
    }
    
    // Add event listeners for gamepad connections
    window.addEventListener('gamepadconnected', this.handleGamepadConnected);
    window.addEventListener('gamepaddisconnected', this.handleGamepadDisconnected);
    
    // Start the polling loop
    this.isRunning = true;
    this.pollGamepads();
    
    console.log('GamepadManager started');
  }
  
  /**
   * Stop listening for gamepad events and polling
   */
  public stop(): void {
    if (!this.isRunning) return;
    
    // Remove event listeners
    window.removeEventListener('gamepadconnected', this.handleGamepadConnected);
    window.removeEventListener('gamepaddisconnected', this.handleGamepadDisconnected);
    
    // Stop the polling loop
    this.isRunning = false;
    if (this.animationFrameId !== null) {
      cancelAnimationFrame(this.animationFrameId);
      this.animationFrameId = null;
    }
    
    // Reset state
    this.gamepads.clear();
    this.lastNotifiedGamepadState = null;
    
    console.log('GamepadManager stopped');
  }
  
  /**
   * Subscribe to gamepad updates
   * @param callback Function to call with the active gamepad state
   * @returns Function to unsubscribe
   */
  public subscribe(callback: GamepadCallback): () => void {
    this.callbacks.add(callback);
    
    // Immediately call with the current state
    if (this.lastNotifiedGamepadState) {
      callback(this.lastNotifiedGamepadState);
    } else {
      callback(null);
    }
    
    // Return unsubscribe function
    return () => {
      this.callbacks.delete(callback);
    };
  }
  
  /**
   * Handle a gamepad being connected
   */
  private handleGamepadConnected(event: GamepadEvent): void {
    const { gamepad } = event;
    console.log(`Gamepad connected: ${gamepad.id} (index: ${gamepad.index})`);
    
    // Store the gamepad
    this.gamepads.set(gamepad.index, this.normalizeGamepad(gamepad));
    
    // Notify subscribers - pick the first connected gamepad as active
    this.notifySubscribers();
  }
  
  /**
   * Handle a gamepad being disconnected
   */
  private handleGamepadDisconnected(event: GamepadEvent): void {
    const { gamepad } = event;
    console.log(`Gamepad disconnected: ${gamepad.id} (index: ${gamepad.index})`);
    
    // Remove the gamepad from our map
    this.gamepads.delete(gamepad.index);
    
    // Notify subscribers
    this.notifySubscribers();
  }
  
  /**
   * Poll for gamepad updates
   */
  private pollGamepads(): void {
    if (!this.isRunning) return;
    
    // Only poll at the configured rate
    const now = Date.now();
    const timeSinceLastPoll = now - this.lastPollTime;
    
    if (timeSinceLastPoll >= this.pollingRate) {
      this.lastPollTime = now;
      
      // Get the latest gamepad states
      const rawGamepads = navigator.getGamepads();
      
      // Process each gamepad
      for (let i = 0; i < rawGamepads.length; i++) {
        const gamepad = rawGamepads[i];
        
        if (gamepad) {
          // Update our stored gamepad state
          this.gamepads.set(gamepad.index, this.normalizeGamepad(gamepad));
        }
      }
      
      // Notify subscribers of any changes
      this.notifySubscribers();
    }
    
    // Schedule the next poll
    this.animationFrameId = requestAnimationFrame(this.pollGamepads);
  }
  
  /**
   * Notify all subscribers of the current gamepad state
   */
  private notifySubscribers(): void {
    // Get the first connected gamepad (might change this to be configurable later)
    let activeGamepad: GamepadState | null = null;
    
    if (this.gamepads.size > 0) {
      activeGamepad = Array.from(this.gamepads.values())[0];
    }
    
    // If state hasn't changed, don't notify
    if (this.isSameGamepadState(activeGamepad, this.lastNotifiedGamepadState)) {
      return;
    }
    
    // Store the last notified state for comparison
    this.lastNotifiedGamepadState = activeGamepad;
    
    // Notify all subscribers
    this.callbacks.forEach(callback => {
      try {
        callback(activeGamepad);
      } catch (error) {
        console.error('Error in gamepad subscriber:', error);
      }
    });
  }
  
  /**
   * Check if two gamepad states are effectively the same
   * This prevents excessive re-renders when nothing has changed
   */
  private isSameGamepadState(a: GamepadState | null, b: GamepadState | null): boolean {
    if (a === null && b === null) return true;
    if (a === null || b === null) return false;
    
    // Check if the button states are the same
    for (let i = 0; i < a.buttons.length; i++) {
      if (a.buttons[i]?.pressed !== b.buttons[i]?.pressed) {
        return false;
      }
    }
    
    // Check if the axes are the same (within deadzone)
    for (let i = 0; i < a.axes.length; i++) {
      const diff = Math.abs((a.axes[i] || 0) - (b.axes[i] || 0));
      if (diff > this.deadzone) {
        return false;
      }
    }
    
    return true;
  }
  
  /**
   * Normalize the gamepad object to our internal format
   * This makes a consistent interface and applies deadzone to analog sticks
   */
  private normalizeGamepad(gamepad: Gamepad): GamepadState {
    const buttons = gamepad.buttons.map(button => ({
      pressed: button.pressed,
      touched: button.touched,
      value: button.value
    }));
    
    // Apply deadzone to analog inputs
    const axes = gamepad.axes.map(axis => {
      return Math.abs(axis) < this.deadzone ? 0 : axis;
    });
    
    return {
      id: gamepad.id,
      index: gamepad.index,
      buttons,
      axes,
      timestamp: gamepad.timestamp,
      mapping: gamepad.mapping,
      connected: true
    };
  }
  
  /**
   * Get the current active gamepad state directly
   */
  public getActiveGamepad(): GamepadState | null {
    return this.lastNotifiedGamepadState;
  }
  
  /**
   * Set the deadzone for analog sticks
   */
  public setDeadzone(value: number): void {
    this.deadzone = Math.max(0, Math.min(1, value));
  }
  
  /**
   * Set the polling rate for gamepad updates
   */
  public setPollingRate(fps: number): void {
    this.pollingRate = 1000 / fps;
  }
}

// Export a singleton instance
export const gamepadManager = new GamepadManager();